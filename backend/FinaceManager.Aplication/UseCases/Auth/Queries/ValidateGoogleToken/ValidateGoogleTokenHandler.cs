using FinanceManager.Aplication.Auth;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Auth.Queries.ValidateGoogleToken;

public class ValidateGoogleTokenHandler : IRequestHandler<ValidateGoogleTokenQuery, GoogleIdentity>
{
    public const string MissingNonce = "Login com o Google sem o código de verificação desta sessão. Atualize a página e tente novamente.";
    public const string WrongNonce = "Login com o Google não pertence a esta sessão. Atualize a página e tente novamente.";
    public const string UnverifiedEmail = "O e-mail desta conta Google não foi verificado.";

    private readonly IGoogleTokenValidator _validator;

    public ValidateGoogleTokenHandler(IGoogleTokenValidator validator)
    {
        _validator = validator;
    }

    public async Task<GoogleIdentity> Handle(ValidateGoogleTokenQuery request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Nonce)) throw new UnauthorizedAccessException(MissingNonce);
        var identity = await _validator.ValidateAsync(request.IdToken, cancellationToken);
        if (!string.Equals(identity.Nonce, request.Nonce, StringComparison.Ordinal)) throw new UnauthorizedAccessException(WrongNonce);
        if (!identity.EmailVerified) throw new UnauthorizedAccessException(UnverifiedEmail);
        return identity;
    }
}
