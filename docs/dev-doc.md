# Developer guide

This guide is for contributors. It explains how the application is built, how to run and configure it, and how to extend it. For end-user instructions, see the [User guide](usr-doc.md).

## Contents

1. [Architecture](#architecture)
2. [Technology choices](#technology-choices)
3. [Getting started](#getting-started)
4. [Configuration](#configuration)
5. [Project structure](#project-structure)
6. [Backend](#backend)
7. [GitHub / Google (OAuth)](#github--google-oauth)
8. [Frontend](#frontend)
9. [Adding a new widget](#adding-a-new-widget)
10. [Tests](#tests)
11. [Security notes](#security-notes)
12. [Docker cheat sheet](#docker-cheat-sheet)
13. [Troubleshooting](#troubleshooting)
14. [Known limitations](#known-limitations)

## Architecture

Three containers, started by Docker Compose:

| Container | Service | Role | Port on the host |
| --- | --- | --- | --- |
| `dashboard_client` | `client` | nginx serving the built React application | 3000 |
| `dashboard_server` | `server` | Express REST API | 8080 |
| `dashboard_postgres` | `postgres` | PostgreSQL 16 | 5433 (5432 inside the Docker network) |

```mermaid
flowchart LR
    Browser -->|"HTTP :3000"| Client["client (nginx, static React build)"]
    Browser -->|"REST + JWT :8080"| Server["server (Express API)"]
    Server --> DB[("PostgreSQL")]
    Server -->|SMTP| Mail["Resend (confirmation emails)"]
    Server -->|HTTP| Ext["Open-Meteo, RSS feeds"]
    Server -->|"OAuth 2.0 + REST"| Prov["GitHub, Google"]
```

The browser downloads the React application from `client`, then talks to `server` directly. The server owns all business logic: accounts, the per-user dashboard, OAuth, and fetching data for widgets from external sources. Widgets never call external APIs from the browser.

## Technology choices

The full comparison with the alternatives is in the [Stack audit](stack-audit.md).

| Technology | Why |
| --- | --- |
| **React + TypeScript** | A widget is a self-contained UI unit, which maps directly to a component. TypeScript makes the contract between a widget's config form, its display and the API explicit and checked at compile time. |
| **Vite** | Fast development server and simple production build. `import.meta.glob` discovers widget components by folder, with no registration code. |
| **React Router** | Client-side routing with a shared layout (header) and route guards. |
| **TanStack Query** | Handles loading, error and caching states for API calls, and each widget's refresh interval (`refetchInterval`), instead of hand-written `useEffect` logic. |
| **dnd-kit** | Small, headless drag-and-drop library that leaves the markup and styling to us. |
| **Node.js + Express** | Minimal, unopinionated HTTP layer with a large middleware ecosystem. The same language on both sides keeps tooling simple. |
| **zod** | Validates every request body and each widget's config with one schema per widget. |
| **PostgreSQL** | Relational integrity for users and linked accounts, plus `JSONB` to store each user's widget list without a rigid schema for widget configs. |
| **bcrypt** | Adaptive, salted password hashing. |
| **JWT** | Stateless authentication that suits a single-page app talking to a separate API. Trade-off: tokens cannot be revoked server-side before they expire. |
| **Nodemailer + Resend** | Standard SMTP client, sending through Resend's SMTP relay. |
| **Docker Compose** | One reproducible command to build and run the whole stack. |
| **nginx** | Serves the static frontend build in a very small image. |

## Getting started

**Prerequisites:** Docker with Compose. Check with `docker --version` and `docker compose version`. To run the tests or the dev servers outside Docker, you also need Node.js 20+.

```bash
git clone https://github.com/Thibani/Dashboard.git
cd Dashboard
cp .env.example .env
```

Set at least `JWT_SECRET` in `.env` (for example `openssl rand -hex 32`); see [Configuration](#configuration) for the rest. Then build and run:

```bash
docker compose up --build
```

Open http://localhost:3000. Check the API with `curl http://localhost:8080/about.json`.

At every start the server runs all the database migrations in order and logs `Migration executed : <file>` for each. They are written to be safe to run again.

### Email confirmation

Confirmation emails are sent by `backend/src/services/email.ts` through [Resend](https://resend.com)'s SMTP relay, using `RESEND_API_KEY`.

- The sender is Resend's test address `onboarding@resend.dev`. With it, Resend only delivers to the email address of the Resend account that owns the API key. To send to anyone, verify a domain in Resend and change the `from` address in `email.ts`.
- If sending fails (missing or wrong key, refused recipient), registration answers `502 Could not send the confirmation email` and the error is in the server logs.
- To confirm an account by hand during development:

```bash
docker exec dashboard_postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "UPDATE users SET is_confirmed = true WHERE email = '"'"'you@example.com'"'"';"'
```

GitHub and Google sign-in need no email confirmation: the provider has already verified the address.

### Running without Docker

```bash
docker compose up -d postgres                       # only the database
cd backend && npm install && npm run dev            # API on :8080, reloads on change
cd frontend && npm install && npm run dev           # app on :5173
```

The backend needs `DATABASE_URL=postgres://dashboard:dashboard@localhost:5433/dashboard` (plus `JWT_SECRET`) in its environment. When the app runs on `:5173`, set `FRONTEND_URL=http://localhost:5173` so email links and OAuth redirects come back to it.

### Resetting the database

Delete everything (containers and database volume), then start fresh:

```bash
docker compose down -v
docker compose up --build
```

Or keep the tables and empty them:

```bash
docker exec dashboard_postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "TRUNCATE users, dashboards, oauth_accounts RESTART IDENTITY CASCADE;"'
```

Delete only accounts that were never confirmed:

```bash
docker exec dashboard_postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DELETE FROM users WHERE is_confirmed = false;"'
```

After resetting the users, log out in the browser (or clear the `dashboard_auth` entry in localStorage): the old token stays valid client-side for up to 7 days.

## Configuration

All variables go in the `.env` file at the project root (start from `.env.example`). Compose passes it to the `server` and `client` services with `env_file`.

| Variable | Used by | Default | Description |
| --- | --- | --- | --- |
| `JWT_SECRET` | server | none (**required**) | Secret used to sign login tokens. The server refuses to start without it. |
| `RESEND_API_KEY` | server | none | Resend API key used to send confirmation emails. Without it, registration fails with a 502. |
| `FRONTEND_URL` | server | `http://localhost:3000` | Base URL of the frontend: confirmation email links and where GitHub/Google sign-in sends the browser back. |
| `API_URL` | server | `http://localhost:8080` | Public URL of the API, used to build the OAuth callback URL (`<API_URL>/api/oauth/<provider>/callback`). |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | server | none | GitHub OAuth app. Without them, GitHub sign-in is hidden and GitHub widgets cannot connect. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | server | none | Google OAuth client. Without them, Google sign-in is hidden and Google widgets cannot connect. |
| `TOKEN_ENCRYPTION_KEY` | server | `JWT_SECRET` | Key used to encrypt the GitHub/Google tokens stored in the database. Changing it invalidates stored tokens (users must reconnect). |
| `PORT` | server | `8080` | Port of the API. The subject requires 8080. |
| `VITE_API_URL` | client, **build time** | `http://localhost:8080` | API address used by the browser. Vite inlines it at build time, so changing it requires a rebuild (`docker compose up --build`). |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | server and database | `dashboard` | PostgreSQL credentials. Compose builds the server's `DATABASE_URL` from them. |
| `BUILD_TARGET` | Compose | `production` | `development` builds the hot-reload stages of the Dockerfiles instead. |

## Project structure

```text
Dashboard/
├── docker-compose.yml
├── .env.example
├── docs/                        User guide, developer guide, stack audit, POC
├── frontend/
│   ├── public/favicon.svg
│   └── src/
│       ├── main.tsx             Router and providers
│       ├── index.css            Global styles and design tokens (CSS variables)
│       ├── style/               One CSS file per component or widget
│       ├── routes/              Pages: Dashboard, Login, Register, Verify, OAuthCallback, Connections
│       ├── components/          Header, ServiceIcon (service logos), layout/ (Layout, RequireAuth)
│       ├── context/             AuthContext
│       ├── hooks/               useWidgetData, useOAuth
│       ├── lib/                 api.ts (every call to the backend), time.ts
│       ├── features/widgets/    Widget system (see below)
│       ├── features/services/   One folder per widget: <service>/<widget>/Display.tsx + ConfigForm.tsx
│       ├── features/oauth/      Sign-in buttons, Connect prompt, OAuth error messages
│       ├── test/setup.ts        Vitest setup
│       └── __tests__/           Frontend tests
└── backend/
    └── src/
        ├── index.ts             App setup and route mounting
        ├── db.ts                PostgreSQL pool and migrations runner
        ├── migrations/          SQL migrations, run in order at every start
        ├── routes/              URL to controller mapping (about, auth, dashboard, oauth, widgets)
        ├── controllers/         Request handling (auth, dashboard, oauth)
        ├── models/              Database queries (user, dashboard, oauth)
        ├── middleware/          requireAuth, validateBody, error handler
        ├── validation/          zod request schemas, widget config validation, SSRF guard
        ├── types/widget.ts      ServiceDefinition / WidgetDefinition contract
        ├── services/            One folder per dashboard service (weather, rss, github, google),
        │   ├── registry.ts      the list of all services,
        │   ├── oauth/           OAuth providers, token encryption and refresh,
        │   ├── safe-fetch.ts    download of user-given URLs, refusing internal addresses,
        │   └── email.ts         and the confirmation email
        ├── services-registry.ts Public /about.json view of the registry, used by config validation
        └── __tests__/           Backend tests
```

## Backend

### API

Protected routes need `Authorization: Bearer <token>`. They use the `requireAuth` middleware, which verifies the JWT and puts `userId` and `userEmail` on the request: the user id always comes from the token, never from the request body.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/about.json` | — | Client host, server time, and the list of services and widgets with their parameters, generated from the service registry. The subject requires it. |
| `GET` | `/health` | — | Returns `{ "status": "ok" }`. |
| `POST` | `/api/auth/register` | — | Body `{ email, password }` (password 8–72 characters). Creates the account and sends the confirmation email. If the email belongs to an **unconfirmed** account, replaces its password and sends a new email. 400 if the email belongs to a confirmed account, 502 if the email could not be sent. |
| `GET` | `/api/auth/verify?token=…` | — | Confirms the account. 400 if the token is unknown or expired. |
| `POST` | `/api/auth/login` | — | Body `{ email, password }`. Returns `{ token, user: { email } }`. 401 for bad credentials or an account that only uses GitHub/Google, 403 if the email is not confirmed. |
| `DELETE` | `/api/auth/account` | Bearer | Deletes the current user, their dashboard and linked accounts. 204. |
| `GET` | `/api/dashboard` | Bearer | Returns `{ instances }`, the current user's widgets. |
| `PUT` | `/api/dashboard` | Bearer | Body `{ instances }` (at most 50). Replaces the current user's widgets. Each instance's config is checked against the widget's parameters and its own rules; 400 otherwise. |
| `POST` | `/api/widgets/data` | Bearer | Body `{ service, widget, config }`. Returns `{ data }`, what the widget displays. For GitHub/Google widgets, uses the user's linked account; `409 { code: "provider_not_connected", provider }` if there is none. `400 { error: "This URL is not allowed: …" }` if a URL in the config (the RSS link) points to an internal address. |
| `POST` | `/widgets/preview` | — | Same as above, anonymously. Only works for services that need no account (weather, RSS). |
| `GET` | `/api/oauth/providers` | — | `{ providers: [{ name, label, configured, services }] }`: which sign-in buttons to show, and which services need which provider. |
| `GET` | `/api/oauth/connections` | Bearer | The providers the user has linked: `{ connections: [{ provider, needsReconnect }] }`. |
| `GET` | `/api/oauth/:provider` | — | Starts sign-in with GitHub or Google (browser navigation). With `?link=<ticket>`, links the account to the logged-in user instead. |
| `GET` | `/api/oauth/:provider/callback` | — | Where the provider sends the browser back. Redirects to the frontend's `/oauth/callback`. |
| `POST` | `/api/oauth/:provider/link` | Bearer | Returns `{ url }`: a 2-minute link that starts connecting this provider to the current user. |
| `DELETE` | `/api/oauth/:provider` | Bearer | Disconnects the provider. 400 if it is the user's only way to sign in. |

Errors from `validateBody` look like `{ message, errors: [{ field, message }] }`; the frontend shows `message`. Other errors go through `middleware/error-handler.ts` and look like `{ error }`: 400 for a zod error or a refused URL (`UnsafeUrlError`), 409 for a missing linked account, 500 otherwise.

### Email confirmation and login flow

```mermaid
sequenceDiagram
    actor U as User
    participant F as Frontend
    participant B as Backend
    participant M as Email (Resend)
    U->>F: Fill in the register form
    F->>B: POST /api/auth/register
    B->>B: Hash password, save user, generate token valid 24h
    B->>M: Send link FRONTEND_URL/verify?token=...
    B-->>F: 201
    F-->>U: Check your email
    U->>F: Open the link
    F->>B: GET /api/auth/verify?token=...
    B->>B: Set is_confirmed, delete token
    B-->>F: 200
    F-->>U: Account confirmed
    U->>F: Log in
    F->>B: POST /api/auth/login
    B-->>F: JWT valid 7 days
    F->>F: Store token, open dashboard
```

The email link points to the **frontend** (`/verify`), which then calls the API. This keeps the API a pure JSON service, and stops email link scanners from consuming the single-use token, since they do not run JavaScript.

### Database

Migrations are SQL files in `backend/src/migrations/`, run in order at **every** server start (there is no table recording which ones already ran). Write them to be idempotent (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`), and number them in sequence.

| File | Purpose |
| --- | --- |
| `001-users-table.sql` | `users` table |
| `002-add-role-to-users.sql` | `role` column |
| `003-add-verification-token.sql` | `token` and `date` (expiry) columns |
| `004-dashboard-table.sql` | `dashboards` table |
| `005-add-githubId.sql` | `github_id` column (first GitHub login, now replaced by `oauth_accounts`) |
| `006-make-password-nullable.sql` | `password` becomes optional, for GitHub/Google-only accounts |
| `007-oauth-table.sql` | `oauth_accounts` table, and copies the old `github_id` links into it |

**`users`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | serial, PK | |
| `email` | varchar, unique | Stored lowercase |
| `password` | varchar, nullable | bcrypt hash. `NULL` for accounts created with GitHub/Google |
| `is_confirmed` | boolean | Default `false`; `true` straight away for GitHub/Google accounts |
| `role` | varchar | Default `'user'` |
| `token` | varchar | Verification token, `NULL` once used |
| `date` | timestamp | Token expiry, `NULL` once used |
| `github_id` | integer | Legacy, no longer read or written |
| `created_at` | timestamp | |

**`dashboards`**: one row per user.

| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | integer, PK | Foreign key to `users(id)`, `ON DELETE CASCADE` |
| `instances` | jsonb | The user's list of widget instances (see [Widget system](#widget-system)) |
| `updated_at` | timestamp | |

**`oauth_accounts`**: one row per linked GitHub/Google account.

| Column | Type | Notes |
| --- | --- | --- |
| `provider` | varchar | `github` or `google`. PK with `provider_user_id` |
| `provider_user_id` | varchar | The provider's id for the user (text: Google ids do not fit in an integer) |
| `user_id` | integer | Foreign key to `users(id)`, `ON DELETE CASCADE`. Unique with `provider`: one account per provider per user |
| `access_token`, `refresh_token` | text | **Encrypted** (AES-256-GCM, see `services/oauth/token-crypto.ts`). `NULL` for links copied from `github_id`, which must reconnect to use widgets |
| `expires_at` | timestamp | When the access token expires, `NULL` if it never does (GitHub OAuth apps) |
| `scope` | text | Scopes granted by the user |
| `created_at` | timestamp | |

### Services and widgets

Each dashboard service is a folder in `backend/src/services/` exporting a `ServiceDefinition` (`types/widget.ts`), listed in `services/registry.ts`. Each widget is a `WidgetDefinition`:

| Field | Role |
| --- | --- |
| `name`, `description`, `params` | What `/about.json` shows. `params` types are `string` or `integer`. |
| `configSchema` | zod schema of the widget's config. Applied when the dashboard is saved and before every fetch. |
| `defaultRefreshRateSeconds` | Suggested refresh rate. |
| `fetchData(config, credentials)` | Returns the JSON the widget displays. `credentials` is `{ accessToken }` for OAuth services, `null` otherwise. |

A service with `authType: "oauth2"` names its provider in `oauthProvider`. The widget routes then load the user's token with `getProviderCredentials` (`services/oauth/credentials.ts`), refreshing it first if it expired. Widgets call the provider's API through `providerFetch`, which turns a `401`/`403` from the provider into "please reconnect".

Saving a dashboard checks every instance in two steps (`validation/widget-config.ts`): first against the parameters declared in `/about.json` (all present, right type, no extra keys, strings 1–2048 characters, integers 1–1000), then against the widget's own `configSchema` (for example the RSS link must be a URL, and at most 50 articles).

## GitHub / Google (OAuth)

GitHub and Google are used for two things with one consent: signing in, and giving the `github` / `google` widgets access to the user's data.

### Setting up the providers

1. Create the OAuth apps and register these callback URLs (they must match `API_URL` exactly):
   - **GitHub**: Settings → Developer settings → OAuth Apps → New OAuth App. Callback URL: `http://localhost:8080/api/oauth/github/callback`.
   - **Google**: [Cloud Console](https://console.cloud.google.com) → create a project → APIs & Services → Library → enable the **Google Calendar API** → OAuth consent screen (*External*, add yourself as a **test user**) → Credentials → Create OAuth client ID, type *Web application*, authorized redirect URI `http://localhost:8080/api/oauth/google/callback`.
2. Put the client IDs and secrets in `.env` (see [Configuration](#configuration)) and restart.

While the Google app is in *Testing* mode, only test users can sign in, and Google expires their access after 7 days: the calendar widget then asks to reconnect.

### Scopes

Each provider asks only for what its widgets need, so one consent covers both sign-in and widgets (`services/oauth/providers.ts`):

| Provider | Scopes | Used for |
| --- | --- | --- |
| GitHub | `read:user user:email` | Sign-in (id and verified email) |
| GitHub | `notifications` | `github.notifications` widget |
| Google | `openid email` | Sign-in |
| Google | `calendar.readonly` | `google.calendar_events` widget |

The `github.repositories` widget lists public repositories, plus private ones the token can already see; it does not request the broad `repo` scope.

### Flows

All in `backend/src/controllers/oauth.ts`:

- **Sign in**: `GET /api/oauth/<provider>` → provider consent → `/api/oauth/<provider>/callback` → frontend `/oauth/callback#token=...&email=...`. The user is found by provider account, then by verified email (an unconfirmed password account with that email is taken over and its password removed), else created.
- **Connect** (a logged-in user, from *Connected accounts* or a widget's **Connect** button): the frontend calls `POST /api/oauth/<provider>/link` and navigates to the returned URL. Its 2-minute ticket says which user is connecting, because a browser navigation cannot carry the `Authorization` header. The callback then attaches the provider account to that user and redirects to `/oauth/callback#linked=<provider>`. A provider account already linked to another user is refused (`already_linked`).
- **Errors** come back as `/oauth/callback#error=<code>&mode=login|link`; the frontend shows a message on the login or Connected accounts page.

Security of the flow:

- The `state` parameter is a JWT (signed with a key separate from login tokens) carrying a random nonce, also stored in an `httpOnly` cookie. The callback refuses a state whose nonce does not match the cookie, which blocks login CSRF and linking an attacker's account to a victim.
- The link ticket and the state cannot be used as login tokens, and login tokens cannot be used as tickets.
- Results go back in the URL **fragment** (`#…`), which browsers never send to servers or write in access logs. The callback page removes it from the history.

## Frontend

### Routing and layout

`main.tsx` wraps the app in `QueryClientProvider`, then `AuthProvider`, then the router. All routes are nested under `Layout`, which renders the `Header` and the current page.

| Route | Page | Access |
| --- | --- | --- |
| `/` | Dashboard | Logged in only (`RequireAuth` redirects to `/login`) |
| `/login`, `/register` | Auth forms, with **Continue with GitHub / Google** buttons | Public |
| `/verify` | Email confirmation result | Public |
| `/oauth/callback` | Receives the result of a GitHub/Google flow and redirects | Public |
| `/connections` | Connected accounts: connect, reconnect, disconnect | Logged in only |

### Authentication state

`AuthContext` keeps the JWT and the user's email, persisted in `localStorage` under the key `dashboard_auth`. It exposes `login`, `logout`, `isAuthenticated` and `isLoading`. `isLoading` is true until the stored session has been read, so `RequireAuth` does not redirect on the first render of a page refresh.

### Dashboard persistence

Each user's widgets live in the database (`dashboards` table), not in the browser:

1. `Dashboard` loads the list with `GET /api/dashboard`. The query key includes the user's email, so accounts never share cached data.
2. Only once loaded does the inner `DashboardContent` mount, so the first render cannot overwrite saved data with an empty list.
3. Every change (add, edit, remove, reorder, resize) triggers `PUT /api/dashboard` with the full list. A JSON comparison with the last saved list avoids redundant saves.
4. A 401 response logs the user out, since the token is expired or invalid.

### Widget system

Located in `features/widgets/`.

```ts
interface WidgetInstance {
  id: string;                    // crypto.randomUUID()
  service: string;               // e.g. "weather"
  widget: string;                // e.g. "city_temperature"
  config: Record<string, unknown>;
  refreshRateSeconds: number;    // 10 to 86400
  width?: number;                // columns, 1 to 5 (default 1)
  height?: number;               // rows, 1 to 8 (default 1)
}
```

| File | Role |
| --- | --- |
| `types.ts` | `WidgetInstance` and the `/about.json` response types |
| `registry.ts` | Finds each widget's display and config form by folder name with `import.meta.glob` (`getDisplay`, `getConfigForm`) |
| `widget-component-types.ts` | Props contract: `WidgetDisplayProps` (`data`, `isLoading`, `error`) and `WidgetConfigFormProps` (`value`, `onChange`) |
| `WidgetShell.tsx` | The card around every widget (logo, drag handle, edit and remove buttons, refresh footer). Fetches data with `useWidgetData`, and shows a **Connect** button instead of the display when the service's account is not linked |
| `AddWidgetDialog.tsx` | Add/edit dialog. Lists services and widgets from `/about.json`, renders the widget's config form and the refresh rate, and refuses to add a widget whose parameters are missing or invalid |
| `validate-config.ts` | The parameter check used by the dialog (same rules as the backend) |
| `CountConfigForm.tsx` | Shared config form for widgets whose only parameter is `number` |
| `../services/<service>/<widget>/` | One folder per widget with `Display.tsx` and `ConfigForm.tsx` |

`useWidgetData` calls `POST /api/widgets/data` (with the login token) with the instance's service, widget and config, and re-fetches on the instance's refresh interval.

### Layout and resizing

The grid has 5 columns on very wide screens (≥ 1800px), 4 by default, 3 below 1200px, 2 below 900px and 1 below 600px. A widget's size is passed to CSS as `--w` / `--h` variables, and its width is capped to the number of columns available, so a wide widget never overflows on a smaller screen. On phones, widgets are as tall as their content and cannot be resized.

### Styling

- Global design tokens are CSS variables in `index.css` (colors, `--page` / `--bg` / `--surface-2` backgrounds, `--radius`, `--gutter` side padding, shadows), with a dark variant under `prefers-color-scheme`.
- Each component or widget has its own file in `style/`, named after it, and uses those variables.
- Each widget card carries `data-service="<service>"`, which sets its `--service-color` (the line on top of the card). GitHub and Google widgets have their own look in `GitHubWidgets.css` (GitHub's Primer colors) and `GoogleWidgets.css` (Google Calendar's colors).
- Service logos are inline SVGs in `components/ServiceIcon.tsx`.

## Adding a new widget

Example: a `spotify` service with a `now_playing` widget.

**Backend**

1. Create `backend/src/services/spotify/index.ts` (a `ServiceDefinition`) and `widgets/now-playing.ts` (a `WidgetDefinition`: `name`, `description`, `params`, a zod `configSchema`, `defaultRefreshRateSeconds` and `fetchData`). A widget must have at least one parameter.
2. Add the service to `services/registry.ts`. `/about.json`, config validation and the widget routes pick it up automatically.
3. If it downloads a URL given by the user, use `safeFetchText` (`services/safe-fetch.ts`), never `fetch` directly.
4. If it needs the user's account on that service, set `authType: "oauth2"` and `oauthProvider`, add the provider (and the scopes the widget needs) in `services/oauth/providers.ts`, and call the API with `credentials.accessToken` through `providerFetch` (see `services/github/`).

**Frontend**

5. Create the folder `frontend/src/features/services/spotify/now_playing/` with:
   - `ConfigForm.tsx`: an input for each parameter, marked `required`. Keys in the `config` object must match the parameter names declared in step 1. If a parameter needs a default (like `number` in the RSS form), set it in a `useEffect`. For a single `number` parameter, reuse `makeCountConfigForm`.
   - `Display.tsx`: renders `data`, and handles `isLoading` and `error`.
6. Nothing to register: `registry.ts` finds them by folder name.
7. Add the service's logo to `components/ServiceIcon.tsx`, its color to `style/WidgetShell.css` (`.widget-card[data-service="spotify"]`), and a CSS file in `style/` if the widget needs styles.
8. Add tests in `backend/src/__tests__/` and `frontend/src/__tests__/`.

Then restart with `docker compose up --build` and check that the widget appears in `/about.json` and in the **Add widget** dialog.

## Tests

| Part | Tool | Location | Run |
| --- | --- | --- | --- |
| Backend | Jest + ts-jest | `backend/src/__tests__/` | `cd backend && npm test` |
| Frontend | Vitest + Testing Library (jsdom) | `frontend/src/__tests__/` | `cd frontend && npx vitest run` (`npm test` for watch mode) |

Backend tests mock the database and external APIs: they cover the auth and OAuth controllers (including CSRF and account takeover cases), request and widget config validation, token encryption, the SSRF protection (against a local server: internal URLs, redirects to internal addresses, DNS rebinding) and the RSS and GitHub notifications widgets. Frontend tests cover the API client, the auth context, pages, the widget shell and the add-widget dialog.

Both suites run in CI (`.github/workflows/CI.yml`) on every pull request and push to `main`: the `unit-tests` job for the frontend, and the `backend-unit-tests` job (type-check, then Jest) for the backend. The mirror to the Epitech repository only runs when both pass.

Also run before a pull request:

```bash
cd backend && npx tsc --noEmit
cd frontend && npx tsc -b && npx eslint src
```

## Security notes

What is in place:

- Passwords are hashed with bcrypt (cost 10) and never returned by the API. They are limited to 72 characters, the most bcrypt uses.
- Login returns the same error for an unknown email and a wrong password.
- Verification tokens are random (32 bytes), single-use, and expire after 24 hours.
- Accounts must be confirmed before they can log in with a password.
- Every request body is validated with zod, and unknown fields are dropped. Widget configs are checked against their widget's parameters and rules.
- Dashboard and widget routes derive the user from the signed token, so users can only access their own data.
- The server refuses to start without `JWT_SECRET`.
- OAuth: `state` tied to a cookie (login CSRF), short single-purpose link tickets, no takeover of an account linked to someone else, results in the URL fragment, minimal scopes.
- GitHub/Google tokens are encrypted at rest (AES-256-GCM) and refreshed automatically.
- URLs given by users (the RSS feed link) are downloaded with `safeFetchText` (`services/safe-fetch.ts`), which refuses internal addresses (`localhost`, private networks, other containers, cloud metadata `169.254.169.254`): the URL itself, every redirect, and the address actually connected to (against DNS rebinding) are all checked. Downloads also have a 10 s timeout and a 5 MB limit. Use it for any new widget that fetches a user-given URL.

Known trade-offs and gaps, to review before any real deployment:

- The JWT is stored in `localStorage`, readable by any script running on the page (XSS). An `HttpOnly` cookie is the safer alternative.
- Tokens are valid 7 days and cannot be revoked server-side.
- `cors()` allows every origin. Restrict it to the frontend's URL.
- Registration reveals whether an email belongs to a confirmed account.
- There is no rate limiting on login or registration.
- The stack serves plain HTTP. Put it behind TLS in production (the OAuth state cookie becomes `Secure` automatically when `API_URL` starts with `https://`).

## Docker cheat sheet

Run from the project root. `docker-compose` (Compose v1) accepts the same commands.

| Command | Description |
| --- | --- |
| `docker compose up --build` | Build images and start everything |
| `docker compose up -d` | Start in the background |
| `docker compose down` | Stop and remove the containers |
| `docker compose down -v` | Same, and delete the database volume |
| `docker compose ps` | List the project's containers |
| `docker compose logs -f server` | Follow the API logs (use `client` for the frontend) |
| `docker compose exec server sh` | Open a shell in the API container |
| `docker exec -it dashboard_postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'` | Open a `psql` session (`\q` to leave) |

Rebuild (`--build`) after changing code, a Dockerfile, a dependency, `VITE_API_URL` or a file in `frontend/public/`. `npm run build` is what the Dockerfiles run for both `frontend` and `backend`; other scripts are in each `package.json`.

## Troubleshooting

| Problem | Cause and fix |
| --- | --- |
| `server` exits with `JWT_SECRET is not set` | Add `JWT_SECRET` to `.env` and make sure Compose passes it to the `server` service. |
| Registration answers "Could not send the confirmation email" | `RESEND_API_KEY` is missing or wrong, or Resend refused the recipient: with the `onboarding@resend.dev` sender, only the Resend account's own address receives emails. See [Email confirmation](#email-confirmation). |
| Confirmation email never arrives | Check the spam folder and the server logs, or confirm the account by hand (see [Email confirmation](#email-confirmation)). |
| GitHub or Google shows `redirect_uri_mismatch` / "The redirect_uri is not associated with this application" | The callback URL registered with the provider must be exactly `<API_URL>/api/oauth/<provider>/callback`: check `http` vs `https`, the port, and that there is no trailing `/`. |
| "Continue with Google" is missing | `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` is not set, or the server was not restarted. Same for GitHub. |
| Google: "Access blocked" or "app not verified" | Add your address as a test user on the OAuth consent screen, then click **Continue** on the warning. |
| A GitHub/Google widget keeps asking to connect | The access was revoked, a scope was refused, or (Google in testing mode) 7 days passed. Click **Connect** again. |
| `service "…" is not running` with `docker compose exec` | The stack is not up (`docker compose up -d`), or the name is not a Compose service name. Check with `docker compose ps`, or use `docker exec <container_name>`. |
| Warning: `configured to build using Bake, but buildx isn't installed` | Harmless. |
| `permission denied while trying to connect to the Docker daemon` | Start Docker (`sudo systemctl start docker`) and add your user to the `docker` group: `sudo usermod -aG docker $USER`, then log out and back in. |
| `bind: address already in use` | Another program uses port 3000, 8080 or 5433. Find it with `sudo lsof -i :8080`, or change the port mapping in `docker-compose.yml`. |
| Frontend cannot reach the API after changing `VITE_API_URL` | It is inlined at build time. Rebuild with `docker compose up --build`. |
| The old favicon or title still shows | Rebuild the client image, then hard-refresh (Ctrl+Shift+R): browsers cache favicons. |
| A container keeps restarting | Read its logs: `docker compose logs <service>`. |

## Known limitations

- Users do not subscribe to services: every service is available to every logged-in user. GitHub/Google widgets ask the user to connect their account the first time.
- The GitHub service has repositories and notifications widgets; commits, contributors and security alerts are not done yet.
- Passwords cannot be changed or reset, and a GitHub/Google-only account cannot add a password.
- No administration section.
- No dedicated "resend confirmation email" endpoint: registering again with the same email does the same job.
