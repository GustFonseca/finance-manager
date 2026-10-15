using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;

namespace FinanceManager.Aplication.Mappings;

public class StoredFileProfile : Profile
{
    public StoredFileProfile()
    {
        CreateMap<StoredFile, StoredFileDto>()
            .ForMember(dest => dest.FolderName, opt => opt.Ignore());
    }
}
