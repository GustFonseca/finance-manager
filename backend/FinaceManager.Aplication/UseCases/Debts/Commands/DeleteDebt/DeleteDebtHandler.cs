using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Debts.Commands.DeleteDebt;

public class DeleteDebtHandler : IRequestHandler<DeleteDebtCommand, bool>
{
    private readonly IDebtRepository _debtRepository;

    public DeleteDebtHandler(IDebtRepository debtRepository)
    {
        _debtRepository = debtRepository;
    }

    public async Task<bool> Handle(DeleteDebtCommand request, CancellationToken cancellationToken = default)
    {
        var debt = await _debtRepository.GetByIdAsync(request.DebtId);
        if (debt == null || debt.UserId != request.UserId) return false;
        await _debtRepository.DeleteAsync(debt);
        return true;
    }
}
