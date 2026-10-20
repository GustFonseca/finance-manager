using FinanceManager.Domain.Common;

namespace FinanceManager.Aplication.Exceptions;

public class BusinessRuleException(string message) : DomainException(message);
