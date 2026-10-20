using FinanceManager.Api.Controllers;
using FinanceManager.Aplication.DTOs.Auth;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.UseCases.Profile.Commands.UpdateProfile;
using FinanceManager.Aplication.UseCases.Profile.Queries.GetProfile;
using FinanceManager.Domain.Entities;
using FinanceManager.Infrastructure.Auth;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace FinanceManager.Tests.UseCases.Profile;

public class ProfileTests
{
    private static readonly DateTime Now = new(2026, 10, 19, 12, 0, 0, DateTimeKind.Utc);

    private readonly AppDbContext _db = TestDb.InMemory();
    private readonly User _me;
    private readonly ConfigAdminDirectory _admins;

    public ProfileTests()
    {
        _me = _db.AddUser("Gustavo Fonseca");
        _admins = new ConfigAdminDirectory(new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Admin:Emails"] = _me.Email }).Build());
    }

    private UpdateProfileHandler Update => new(new UserRepository(_db), _admins);

    private static UpdateProfileRequest Valid() => new()
    {
        Name = "  Gustavo F.  ",
        AvatarIcon = "rocket",
        AvatarColor = "#e0a526",
        BirthDate = new DateTime(1995, 5, 20, 15, 30, 0, DateTimeKind.Utc),
        Phone = "(31) 99999-1234",
        City = " Belo Horizonte ",
        State = "mg",
        Occupation = "Desenvolvedor",
        MonthlyIncomeCents = 900000,
        Payday = 5,
        Dependents = 1,
        DigestByEmail = true,
    };

    [Fact]
    public async Task The_profile_is_read_with_the_admin_flag_and_falls_back_to_the_email_as_name()
    {
        var profile = await new GetProfileHandler(new UserRepository(_db), _admins).Handle(new GetProfileQuery(_me.Id));

        Assert.Equal(("Gustavo Fonseca", true, (string?)null), (profile!.Name, profile.IsAdmin, profile.AvatarIcon));
        Assert.Equal(_me.CreatedAt, profile.MemberSince);
        await Assert.ThrowsAsync<NotFoundException>(() => new GetProfileHandler(new UserRepository(_db), _admins).Handle(new GetProfileQuery(Guid.NewGuid())));

        _me.Name = " ";
        _db.SaveChanges();
        Assert.Equal(_me.Email, (await new GetProfileHandler(new UserRepository(_db), _admins).Handle(new GetProfileQuery(_me.Id)))!.Name);
    }

    [Fact]
    public async Task Updating_normalizes_the_fields_and_logs_the_change()
    {
        var profile = await Update.Handle(new UpdateProfileCommand(_me.Id, Valid(), Now));

        Assert.Equal(("Gustavo F.", "rocket", "#E0A526", "31999991234", "Belo Horizonte", "MG"),
            (profile!.Name, profile.AvatarIcon, profile.AvatarColor, profile.Phone, profile.City, profile.State));
        Assert.Equal(new DateTime(1995, 5, 20, 0, 0, 0, DateTimeKind.Utc), profile.BirthDate);
        Assert.Equal((900000L, 5, 1, true), (profile.MonthlyIncomeCents!.Value, profile.Payday!.Value, profile.Dependents!.Value, profile.DigestByEmail));
        Assert.Equal(Now, _db.Users.Single(u => u.Id == _me.Id).ProfileUpdatedAt);
        Assert.Contains(_db.ActivityLogs, a => a.UserId == _me.Id && a.Description == "Dados da conta atualizados");
        await Assert.ThrowsAsync<NotFoundException>(() => Update.Handle(new UpdateProfileCommand(Guid.NewGuid(), Valid(), Now)));
    }

    [Fact]
    public async Task Optional_fields_can_be_cleared()
    {
        await Update.Handle(new UpdateProfileCommand(_me.Id, Valid(), Now));

        var cleared = await Update.Handle(new UpdateProfileCommand(_me.Id, new UpdateProfileRequest { Name = "Gustavo", AvatarIcon = " ", City = "" }, Now));

        Assert.Equal(("Gustavo", (string?)null, (string?)null, (DateTime?)null, (long?)null, false),
            (cleared!.Name, cleared.AvatarIcon, cleared.City, cleared.BirthDate, cleared.MonthlyIncomeCents, cleared.DigestByEmail));
    }

    public static TheoryData<Action<UpdateProfileRequest>> Invalid => new()
    {
        r => r.Name = " ",
        r => r.Name = new string('n', 101),
        r => r.AvatarIcon = "Rocket!",
        r => r.AvatarColor = "laranja",
        r => r.BirthDate = new DateTime(1899, 12, 31, 0, 0, 0, DateTimeKind.Utc),
        r => r.BirthDate = new DateTime(2027, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        r => r.Phone = "1234",
        r => r.Phone = "12345678901234",
        r => r.State = "XX",
        r => r.City = new string('c', 101),
        r => r.Occupation = new string('o', 101),
        r => r.MonthlyIncomeCents = -1,
        r => r.Payday = 0,
        r => r.Payday = 32,
        r => r.Dependents = -1,
        r => r.Dependents = 21,
    };

    [Theory]
    [MemberData(nameof(Invalid))]
    public async Task Invalid_values_are_rejected(Action<UpdateProfileRequest> change)
    {
        var request = Valid();
        change(request);

        await Assert.ThrowsAsync<BusinessRuleException>(() => Update.Handle(new UpdateProfileCommand(_me.Id, request, Now)));
        Assert.Null(_db.Users.Single(u => u.Id == _me.Id).ProfileUpdatedAt);
    }

    [Fact]
    public async Task The_endpoints_read_and_save_the_signed_in_users_profile()
    {
        var mediator = new FakeMediator();
        var me = Guid.NewGuid();
        var controller = new ProfileController(mediator).SignedIn(me);
        var dto = new ProfileDto { Name = "Ana" };
        mediator.Returns<GetProfileQuery>(q => q.UserId == me ? dto : throw new NotFoundException("não encontrado"));
        mediator.Returns<UpdateProfileCommand>(c => c.Profile.Name == "Ana" ? dto : throw new NotFoundException("não encontrado"));

        Assert.Same(dto, Assert.IsType<OkObjectResult>((await controller.Get()).Result).Value);
        Assert.Same(dto, Assert.IsType<OkObjectResult>((await controller.Update(new UpdateProfileRequest { Name = "Ana" })).Result).Value);
        await Assert.ThrowsAsync<NotFoundException>(() => controller.Update(new UpdateProfileRequest { Name = "Outro" }));
        await Assert.ThrowsAsync<NotFoundException>(() => new ProfileController(mediator).SignedIn(Guid.NewGuid()).Get());
    }
}
