using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Planning.Queries.GetTaxReport;

public class GetTaxReportHandler : IRequestHandler<GetTaxReportQuery, TaxReportDto>
{
    public const int MinYear = 2000;

    private readonly ITransactionRepository _transactionRepository;
    private readonly IClassificationRulesProvider _rulesProvider;

    public GetTaxReportHandler(ITransactionRepository transactionRepository, IClassificationRulesProvider rulesProvider)
    {
        _transactionRepository = transactionRepository;
        _rulesProvider = rulesProvider;
    }

    public async Task<TaxReportDto> Handle(GetTaxReportQuery request, CancellationToken cancellationToken = default)
    {
        if (request.Year < MinYear || request.Year > DateTime.UtcNow.Year) throw new BusinessRuleException("Ano inválido.");
        var start = new DateTime(request.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, start.AddDays(-1), start.AddYears(1).AddDays(1));
        return TaxReportBuilder.Build(transactions, request.Year, await _rulesProvider.GetAsync(cancellationToken));
    }
}
