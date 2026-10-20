using FinanceManager.Aplication.Auth;
using FinanceManager.Aplication.DTOs.Auth;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Profile.Queries.GetProfile;

public class GetProfileHandler : IRequestHandler<GetProfileQuery, ProfileDto>
{
    private readonly IUserRepository _userRepository;
    private readonly IAdminDirectory _admins;

    public GetProfileHandler(IUserRepository userRepository, IAdminDirectory admins)
    {
        _userRepository = userRepository;
        _admins = admins;
    }

    public async Task<ProfileDto> Handle(GetProfileQuery request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(request.UserId) ?? throw ProfileMapper.UserNotFound();
        return ProfileMapper.ToDto(user, _admins.IsAdmin(user.Email));
    }
}
