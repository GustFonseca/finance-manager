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

## Project Structure

```
backend/           ASP.NET Core API
  FinanceManager.Api/
    Controllers/   REST endpoints
    Models/        EF Core entities
    DTOs/          Request/response types
    Services/      Business logic
    Data/          DbContext

mobile/            React Native (Expo)
  app/             File-based routing
  components/      Reusable UI components
  services/        API client
  contexts/        Auth state management

sql/migrations/    Legacy SQL migrations
```

## API Endpoints

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | /api/auth/google            | Google OAuth login       |
| GET    | /api/accounts               | List accounts            |
| POST   | /api/accounts               | Create account           |
| PUT    | /api/accounts/:id           | Update account           |
| GET    | /api/categories             | List categories          |
| POST   | /api/categories             | Create category          |
| PUT    | /api/categories/:id         | Update category          |
| DELETE | /api/categories/:id         | Delete category          |
| GET    | /api/transactions           | List transactions        |
| POST   | /api/transactions           | Create transaction       |
| DELETE | /api/transactions/:id       | Delete transaction       |
| GET    | /api/goals                  | List goals               |
| POST   | /api/goals                  | Create goal              |
| PUT    | /api/goals/:id/progress     | Add progress to goal     |
| PUT    | /api/goals/:id/complete     | Mark goal as completed   |
| GET    | /api/summary                | Financial summary        |
