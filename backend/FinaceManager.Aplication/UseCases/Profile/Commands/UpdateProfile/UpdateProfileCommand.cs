using FinanceManager.Aplication.DTOs.Auth;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Profile.Commands.UpdateProfile;

public record UpdateProfileCommand(Guid UserId, UpdateProfileRequest Profile, DateTime Now) : ICommand<ProfileDto>;
