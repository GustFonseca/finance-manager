# Finance Manager

Personal finance management app with a C# API backend and React Native mobile frontend.

## Architecture

- **Backend**: ASP.NET Core Web API (C#) with Entity Framework Core + PostgreSQL
- **Frontend**: React Native (Expo) with TypeScript
- **Auth**: Google OAuth 2.0 → JWT

## Getting Started

### Backend

```bash
cd backend/FinanceManager.Api

# Configure your PostgreSQL connection in appsettings.json
# Configure Google OAuth Client ID and JWT secret

dotnet ef database update   # Run migrations
dotnet run                  # Start API (default: http://localhost:5000)
```

API docs available at `/swagger` when running.

### Mobile

```bash
cd mobile
npm install
npx expo start
```

