using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Activity.Queries.GetActivity;

public class GetActivityHandler : IRequestHandler<GetActivityQuery, List<ActivityLogDto>>
{
    public const int MaxLimit = 200;

    private readonly IActivityLogRepository _activityLogRepository;
    private readonly IMapper _mapper;

    public GetActivityHandler(IActivityLogRepository activityLogRepository, IMapper mapper)
    {
        _activityLogRepository = activityLogRepository;
        _mapper = mapper;
    }

    public async Task<List<ActivityLogDto>> Handle(GetActivityQuery request, CancellationToken cancellationToken = default)
    {
        var limit = Math.Clamp(request.Limit, 1, MaxLimit);
        var entries = await _activityLogRepository.GetByUserIdAsync(request.UserId, request.Before, limit);
        return _mapper.Map<List<ActivityLogDto>>(entries);
    }
}
