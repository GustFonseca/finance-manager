using FinanceManager.Aplication.Auth;
using FinanceManager.Aplication.DTOs.Auth;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Profile.Commands.UpdateProfile;

public class UpdateProfileHandler : IRequestHandler<UpdateProfileCommand, ProfileDto>
{
    private readonly IUserRepository _userRepository;
    private readonly IAdminDirectory _admins;

    public UpdateProfileHandler(IUserRepository userRepository, IAdminDirectory admins)
    {
        _userRepository = userRepository;
        _admins = admins;
    }

    public async Task<ProfileDto> Handle(UpdateProfileCommand request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(request.UserId) ?? throw ProfileMapper.UserNotFound();
        ProfileMapper.Apply(user, request.Profile, request.Now);
        await _userRepository.UpdateAsync(user);
        return ProfileMapper.ToDto(user, _admins.IsAdmin(user.Email));
    }
}
