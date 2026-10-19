namespace FinanceManager.Aplication.DTOs;

public class CompanyDto
{
    public string Cnpj { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string Activity { get; set; } = string.Empty;
}
