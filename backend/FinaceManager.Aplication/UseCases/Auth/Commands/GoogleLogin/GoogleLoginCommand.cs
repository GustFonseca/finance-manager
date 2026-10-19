using FinanceManager.Aplication.Auth;
using FinanceManager.Aplication.DTOs.Auth;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Auth.Commands.GoogleLogin;

public record GoogleLoginCommand(GoogleIdentity Identity) : ICommand<LoginResponse>;
