# Herba Admin

Admin dashboard for the Herba project. A React + TypeScript SPA for managing site content — blog posts, products, categories, testimonials, and more.

## Tech stack

- **React 19** + **TypeScript**
- **Vite 8** — build tool and dev server
- **React Router 7** — client-side routing
- **JWT**-based authentication
- **ESLint** — code quality

## Features

- Email/password login with JWT-based session handling (`src/auth`)
- Protected routes via the `RequireAuth` component
- Multi-language content support (configurable through the `VITE_SUPPORTED_LANGUAGES` env variable, e.g. `az,en`)
- Full CRUD management for:
  - Hero section
  - About section
  - Blog posts and blog categories
  - Footer categories
  - Testimonials
  - Aims
  - Analysis results
  - Products and product categories
  - Featured products

## Project structure

```
src/
├── api/            # API requests to the backend (fetch-based client)
├── auth/           # Auth context, JWT handling, protected routes
├── config/         # Global config such as supported languages
├── layouts/        # Dashboard layout component
├── pages/          # List/Form pages for each module
├── App.tsx         # Route definitions
└── main.tsx        # App entry point
```

## Getting started

### Requirements

- Node.js (LTS recommended)
- npm

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables — copy `.env.example` to `.env.local` and fill in the values for your environment:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Description | Example |
   |---|---|---|
   | `VITE_API_URL` | Backend API base URL | `https://localhost:5001` |
   | `VITE_SUPPORTED_LANGUAGES` | Comma-separated list of supported languages | `az,en` |

3. Start the development server:

   ```bash
   npm run dev
   ```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server (with HMR) |
| `npm run build` | Type-checks and creates a production build |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Lints the codebase with ESLint |

## Authentication

On successful login, the JWT token returned by the backend is stored in `localStorage` and attached to every API request as an `Authorization: Bearer <token>` header. The user is automatically logged out once the token expires.
