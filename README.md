# Finance Manager

Personal finance management web app with a C# API backend and a React (Expo Web) frontend.

## Architecture

- **Backend**: ASP.NET Core Web API (C#) with Entity Framework Core + PostgreSQL
- **Frontend**: React web app built with Expo (react-native-web) + expo-router + TypeScript
- **Auth**: Google OAuth 2.0 → JWT

## Features

- Google sign-in (OAuth 2.0)
- Accounts, categories, transactions and savings goals management
- Financial summary dashboard with breakdown by category

## Project structure

```
finance-manager/
├── backend/   # ASP.NET Core Web API
└── web/       # React web frontend (Expo Web)
```

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

### Web frontend

```bash
cd web
npm install
npm start            # dev server (expo start --web)
npm test             # unit tests (jest)
npm run build        # static export to ./dist (expo export --platform web)
```

The API base URL is read from the `EXPO_PUBLIC_API_URL` environment variable
(defaults to `http://localhost:5101/api`).

## Deployment

- **Frontend**: the static export (`./dist`) is published to GitHub Pages via
  [`.github/workflows/deploy-web.yml`](.github/workflows/deploy-web.yml) on every
  push to `main` that touches `web/`.
- **Backend**: built from [`backend/Dockerfile`](backend/Dockerfile) and deployed
  to Render (free plan) as defined in [`render.yaml`](render.yaml). Render
  redeploys on every push to `main` that touches `backend/`. The database is
  PostgreSQL on Neon; its connection string is set as
  `ConnectionStrings__DefaultConnection` in the Render dashboard.
