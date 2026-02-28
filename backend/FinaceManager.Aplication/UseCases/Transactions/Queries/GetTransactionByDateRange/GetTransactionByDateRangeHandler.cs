using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Transactions.Queries.GetTransactionByDateRange;

public class GetTransactionsByDateRangeHandler : IRequestHandler<GetTransactionsByDateRangeQuery, List<TransactionDto>>
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly IMapper _mapper;

    public GetTransactionsByDateRangeHandler(ITransactionRepository transactionRepository, IMapper mapper)
    {
        _transactionRepository = transactionRepository;
        _mapper = mapper;
    }

    public async Task<List<TransactionDto>> Handle(GetTransactionsByDateRangeQuery request, CancellationToken cancellationToken = default)
    {
        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, request.Start, request.End);
        return _mapper.Map<List<TransactionDto>>(transactions);
    }
}
