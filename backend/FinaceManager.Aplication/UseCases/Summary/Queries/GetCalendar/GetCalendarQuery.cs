using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Summary.Queries.GetCalendar;

public record GetCalendarQuery(Guid UserId, DateTime MonthStart, DateTime Now) : IQuery<CalendarDto>;
