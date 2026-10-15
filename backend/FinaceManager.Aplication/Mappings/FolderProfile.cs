using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;

namespace FinanceManager.Aplication.Mappings;

public class FolderProfile : Profile
{
    public FolderProfile()
    {
        CreateMap<Folder, FolderDto>()
            .ForMember(dest => dest.FileCount, opt => opt.Ignore());
        CreateMap<Folder, TrashFolderDto>()
            .ForMember(dest => dest.FileCount, opt => opt.Ignore());
    }
}
