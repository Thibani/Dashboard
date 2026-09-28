# Dashboard

A customizable dashboard that gathers information from several sources in one place. Create an account, pick widgets from different services (weather, RSS…), configure them, and arrange them on a personal page that refreshes itself automatically.

## Features

- Account creation with **email confirmation**, then login
- A personal dashboard **saved with your account**: you get the same widgets on any browser or device
- Widgets with their **own configuration and refresh rate**: two instances of the same widget can show different data at the same time
- Add, reconfigure, remove and **drag & drop** widgets
- Responsive interface with light and dark themes (follows your system setting)
- The server describes its services and widgets at `GET /about.json`

## Services and widgets

| Service | Widget | Parameters | What it shows |
| --- | --- | --- | --- |
| `weather` | `city_temperature` | `city` (string) | Temperature and precipitation for a city |
| `rss` | `article_list` | `link` (string), `number` (integer) | The latest articles of an RSS feed |

## Tech stack

| Part | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, React Router, TanStack Query, dnd-kit |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| Auth | bcrypt (password hashing), JSON Web Tokens, email confirmation with Nodemailer |
| Infrastructure | Docker Compose, nginx (serves the built frontend) |

The reasons behind these choices are in the [Developer guide](docs/DEVELOPER_GUIDE.md#technology-choices).

## Quick start

**Prerequisites:** [Docker](https://docs.docker.com/get-docker/) with Compose (`docker compose version` should print a version).

```bash
git clone <repository-url>
cd Dashboard (repository name)
```

**1. Configure.** The server refuses to start without a secret used to sign login tokens. Create a `.env` file at the project root:

```bash
# generate a value with: openssl rand -hex 32
JWT_SECRET=replace-with-a-long-random-string
```

Other settings are optional; see [Configuration](docs/DEVELOPER_GUIDE.md#configuration).

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

**4. Create an account.** In this development setup the confirmation email goes to a test mailbox rather than a real inbox. The confirmation link is printed in the server logs:

```bash
docker compose logs server | grep "Preview URL"
```

Open the printed URL, click the confirmation link in the message, then log in.

**Stop:** `docker compose down`. Add `-v` to also delete the database.

## Documentation

| Guide | For |
| --- | --- |
| [User guide](docs/USER_GUIDE.md) | Using the application: account, widgets, troubleshooting |
| [Developer guide](docs/DEVELOPER_GUIDE.md) | Architecture, API, database, adding a widget, Docker commands |

## Project structure

```text
Dashboard/
├── frontend/            React application
├── backend/             Express API
├── docker-compose.yml
└── README.md
```