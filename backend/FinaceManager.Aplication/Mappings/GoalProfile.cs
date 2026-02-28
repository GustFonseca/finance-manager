using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;

namespace FinanceManager.Aplication.Mappings;

public class GoalProfile : Profile
{
    public GoalProfile()
    {
        CreateMap<Goal, GoalDto>()
            .ForMember(dest => dest.ProgressPercent, opt => opt.Ignore());
    }
}
