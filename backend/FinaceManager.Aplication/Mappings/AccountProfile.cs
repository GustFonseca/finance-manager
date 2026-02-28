
using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;

namespace FinanceManager.Aplication.Mappings;

public class AccountProfile : Profile
{
        public AccountProfile()
        {
            CreateMap<Account, AccountDto>();
    }
}

