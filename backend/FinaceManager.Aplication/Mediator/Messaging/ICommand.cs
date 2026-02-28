namespace FinanceManager.Aplication.Mediator.Messaging;

public interface ICommand : IRequest{}
public interface ICommand<TResponse> : IRequest<TResponse>{ }

