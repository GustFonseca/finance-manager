using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Summary.Queries.GetDigest;

public record GetDigestQuery(Guid UserId, DateTime MonthStart, DateTime Now, DateTime DayStart) : IQuery<DigestDto>;
