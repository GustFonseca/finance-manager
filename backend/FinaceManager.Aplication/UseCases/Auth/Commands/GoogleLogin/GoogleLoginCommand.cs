using FinanceManager.Aplication.DTOs.Auth;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Auth.Commands.GoogleLogin;

public record GoogleLoginCommand(string IdToken) : ICommand<LoginResponse>;
