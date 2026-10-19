using FinanceManager.Aplication.Auth;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Auth.Queries.ValidateGoogleToken;

public record ValidateGoogleTokenQuery(string IdToken, string? Nonce) : IQuery<GoogleIdentity>;
