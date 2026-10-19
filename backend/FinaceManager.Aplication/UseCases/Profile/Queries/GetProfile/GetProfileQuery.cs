using FinanceManager.Aplication.DTOs.Auth;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Profile.Queries.GetProfile;

public record GetProfileQuery(Guid UserId) : IQuery<ProfileDto?>;
