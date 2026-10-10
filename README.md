# Dashboard

A customizable dashboard that gathers information from several sources in one place. Create an account (or sign in with GitHub or Google), pick widgets from different services (weather, RSS, GitHub, Google Calendar…), configure them, and arrange them on a personal page that refreshes itself automatically.

## Features

- Account creation with **email confirmation**, or **sign in with GitHub / Google**
- **Connected accounts**: link your GitHub or Google account to use their widgets, and disconnect it at any time
- A personal dashboard **saved with your account**: you get the same widgets, positions and sizes on any browser or device
- Widgets with their **own configuration and refresh rate**: two instances of the same widget can show different data at the same time
- Add, reconfigure, remove, **drag & drop** and **resize** widgets
- Full-width, responsive interface (desktop, tablet, phone) with light and dark themes (follows your system setting)
- The server describes its services and widgets at `GET /about.json`

## Services and widgets

| Service | Widget | Parameters | What it shows | Account needed |
| --- | --- | --- | --- | --- |
| `weather` | `city_temperature` | `city` (string) | Temperature and precipitation for a city | — |
| `weather` | `city_weather_summary` | `city` (string) | Current weather, today's min/max, rain and wind | — |
| `weather` | `city_weather_detailed` | `city` (string) | Current conditions, next 24 hours and 7-day forecast | — |
| `rss` | `article_list` | `link` (string), `number` (integer, 1–50) | The latest articles of an RSS feed | — |
| `github` | `repositories` | `number` (integer, 1–30) | Your most recently updated repositories | GitHub |
| `github` | `notifications` | `number` (integer, 1–50) | Your unread GitHub notifications | GitHub |
| `google` | `calendar_events` | `number` (integer, 1–25) | The next events of your Google Calendar | Google |

## Tech stack

| Part | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, React Router, TanStack Query, dnd-kit |
| Backend | Node.js, Express, TypeScript, zod |
| Database | PostgreSQL |
| Auth | bcrypt (password hashing), JSON Web Tokens, email confirmation (Nodemailer + Resend), GitHub and Google OAuth 2.0 |
| Tests | Jest (backend), Vitest + Testing Library (frontend) |
| Infrastructure | Docker Compose, nginx (serves the built frontend) |

The reasons behind these choices are in the [Developer guide](docs/dev-doc.md#technology-choices).

## Quick start

**Prerequisites:** [Docker](https://docs.docker.com/get-docker/) with Compose (`docker compose version` should print a version).

```bash
git clone https://github.com/Thibani/Dashboard.git
cd Dashboard
```

**1. Configure.** Copy the example configuration and set at least a secret used to sign login tokens (the server refuses to start without it):

```bash
cp .env.example .env
# then set JWT_SECRET, for example with the output of: openssl rand -hex 32
```

To send confirmation emails, also set `RESEND_API_KEY`. To enable GitHub / Google sign-in and widgets, set their client IDs and secrets. See [Configuration](docs/dev-doc.md#configuration) and [GitHub / Google (OAuth)](docs/dev-doc.md#github--google-oauth).

**2. Build and run.**

```bash
docker compose up --build
```

`docker-compose` (with a hyphen, Compose v1) works the same way.

**3. Open the app.**

| What | URL |
| --- | --- |
| Web application | http://localhost:3000 |
| API | http://localhost:8080 |
| Services and widgets (JSON) | http://localhost:8080/about.json |

**4. Create an account.** Register, open the confirmation link sent by email, then log in. With Resend's test sender (`onboarding@resend.dev`), emails are only delivered to the address of the Resend account that owns the API key; see [Email confirmation](docs/dev-doc.md#email-confirmation). If GitHub or Google is configured, you can also skip this and use **Continue with GitHub / Google**.

**Stop:** `docker compose down`. Add `-v` to also delete the database.

## Tests

```bash
cd backend && npm test          # Jest
cd frontend && npx vitest run   # Vitest
```

## Documentation

| Guide | For |
| --- | --- |
| [User guide](docs/usr-doc.md) | Using the application: account, widgets, connected accounts, troubleshooting |
| [Developer guide](docs/dev-doc.md) | Architecture, API, database, OAuth, adding a widget, tests, Docker commands |
| [Stack audit](docs/stack-audit.md) | Why React, Express and PostgreSQL were chosen |
| [Proof of concept](docs/POC.md) | The architectural risks validated at the start of the project |
| [Contributing](CONTRIBTUING.md) | Branches, commit convention, review process |

## Project structure

```text
Dashboard/
├── frontend/            React application
├── backend/             Express API
├── docs/                User and developer guides
├── docker-compose.yml
├── .env.example         Configuration template
└── README.md
```
