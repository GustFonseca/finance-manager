using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Transactions.Queries.GetTransactionByDateRange;

public class GetTransactionsByDateRangeHandler : IRequestHandler<GetTransactionsByDateRangeQuery, List<TransactionDto>>
{
    private readonly ITransactionRepository _transactionRepository;

    public GetTransactionsByDateRangeHandler(ITransactionRepository transactionRepository)
    {
        _transactionRepository = transactionRepository;
    }

    public async Task<List<TransactionDto>> Handle(GetTransactionsByDateRangeQuery request, CancellationToken cancellationToken = default)
    {
        var transactions = await _transactionRepository.SearchAsync(request.UserId, new TransactionFilter(
            request.Start, request.End, request.AccountId, request.MerchantId, request.CategoryId, request.Type, request.Search,
            string.IsNullOrWhiteSpace(request.Search) ? null : MerchantParser.KeyOf(request.Search),
            request.Limit));
        return transactions.Select(x => x.ToDto()).ToList();
    }
}
