namespace FinanceManager.Aplication.Mediator.Messaging;

public interface IUnitOfWork
{
    void OnCommitted(Func<Task> action);
}
