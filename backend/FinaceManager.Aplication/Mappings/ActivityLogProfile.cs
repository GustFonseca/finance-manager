using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;

namespace FinanceManager.Aplication.Mappings;

public class ActivityLogProfile : Profile
{
    public ActivityLogProfile()
    {
        CreateMap<ActivityLog, ActivityLogDto>();
    }
}
