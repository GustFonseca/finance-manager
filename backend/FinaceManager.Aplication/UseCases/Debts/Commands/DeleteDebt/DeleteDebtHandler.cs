using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Debts.Commands.DeleteDebt;

public class DeleteDebtHandler : IRequestHandler<DeleteDebtCommand>
{
    private readonly IDebtRepository _debtRepository;

    public DeleteDebtHandler(IDebtRepository debtRepository)
    {
        _debtRepository = debtRepository;
    }

    public async Task Handle(DeleteDebtCommand request, CancellationToken cancellationToken = default)
    {
        var debt = await _debtRepository.GetOwnedAsync(request.DebtId, request.UserId);
        await _debtRepository.DeleteAsync(debt);
    }
}
