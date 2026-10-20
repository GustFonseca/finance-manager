using FinanceManager.Aplication.Validation;
using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Merchants.Commands.UpdateMerchant;

public class UpdateMerchantHandler : IRequestHandler<UpdateMerchantCommand, UpdateMerchantResultDto>
{

    private readonly IMerchantRepository _merchantRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly ITransactionRepository _transactionRepository;

    public UpdateMerchantHandler(
        IMerchantRepository merchantRepository,
        ICategoryRepository categoryRepository,
        ITransactionRepository transactionRepository)
    {
        _merchantRepository = merchantRepository;
        _categoryRepository = categoryRepository;
        _transactionRepository = transactionRepository;
    }

    public async Task<UpdateMerchantResultDto> Handle(UpdateMerchantCommand request, CancellationToken cancellationToken = default)
    {
        var merchant = await _merchantRepository.GetOwnedAsync(request.MerchantId, request.UserId);

        var name = Input.Name(request.Name);
        if (MerchantParser.KeyOf(name) != merchant.Key)
        {
            var same = await _merchantRepository.GetByKeyAsync(request.UserId, MerchantParser.KeyOf(name));
            if (same != null && same.Id != merchant.Id)
                throw new BusinessRuleException($"Já existe um estabelecimento chamado {same.Name}");
        }

        Category? category = null;
        if (request.CategoryId.HasValue)
        {
            category = await _categoryRepository.FindOwnedAsync(request.CategoryId.Value, request.UserId)
                ?? throw new BusinessRuleException("Categoria não encontrada");
        }

        merchant.Name = name;
        merchant.Kind = request.Kind;
        merchant.CategoryId = category?.Id;
        merchant.Category = category;
        await _merchantRepository.UpdateAsync(merchant);

        var updated = 0;
        if (request.ApplyToTransactions && category != null)
        {
            var type = category.Type == CategoryType.INCOME ? TransactionType.INCOME : TransactionType.EXPENSE;
            var changed = (await _transactionRepository.GetByMerchantIdAsync(merchant.Id))
                .Where(t => t.Type == type && t.CategoryId != category.Id)
                .ToList();
            foreach (var transaction in changed) transaction.CategoryId = category.Id;
            if (changed.Count > 0) await _transactionRepository.UpdateRangeAsync(changed);
            updated = changed.Count;
        }

        return new UpdateMerchantResultDto { Merchant = merchant.ToDto(), UpdatedTransactions = updated };
    }
}
