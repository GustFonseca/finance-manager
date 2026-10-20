using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Auth.Commands.RecordUserActivity;

public class RecordUserActivityHandler : IRequestHandler<RecordUserActivityCommand, bool>
{
    public static readonly TimeSpan MinimumGap = TimeSpan.FromHours(1);

    private readonly IUserRepository _userRepository;

    public RecordUserActivityHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<bool> Handle(RecordUserActivityCommand request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(request.UserId);
        if (user == null) return false;
        if (user.LastSeenAt is { } seen && request.Now - seen < MinimumGap) return false;

        user.LastSeenAt = request.Now;
        await _userRepository.UpdateAsync(user);
        return true;
    }
}
