using FinanceManager.Aplication.Mediator.Messaging;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Controllers;

public abstract class AppController(IMediator mediator) : ControllerBase
{
    protected IMediator Mediator { get; } = mediator;

    protected Guid UserId => User.GetUserId();
}
