# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first so the dependency layer is cached between builds
COPY nuget.config .
COPY FinanceManager.Domain/FinanceManager.Domain.csproj FinanceManager.Domain/
COPY FinaceManager.Aplication/FinanceManager.Aplication.csproj FinaceManager.Aplication/
COPY FinanceManager.Infrastructure/FinanceManager.Infrastructure.csproj FinanceManager.Infrastructure/
COPY FinanceManager.Api/FinanceManager.Api.csproj FinanceManager.Api/
RUN dotnet restore FinanceManager.Api/FinanceManager.Api.csproj -r linux-x64 -p:PublishReadyToRun=true

COPY . .
RUN dotnet publish FinanceManager.Api/FinanceManager.Api.csproj -c Release -r linux-x64 --self-contained false -p:PublishReadyToRun=true -o /app --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "FinanceManager.Api.dll"]
