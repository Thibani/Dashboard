# Dashboard — Stack Audit

## 1. Objective

This document compares three candidate options each for frontend, backend, and database, and justifies the final choice against the project's actual constraints rather than popularity alone.

Each comparison uses the same four criteria: **fit for this project's specific needs**, **ecosystem maturity for what we need** (OAuth, polling/timers, plugin-style extensibility), **team familiarity** (time-boxed school project — ramp-up cost matters), and **license**.

---

## 2. Frontend: React vs. Vue vs. Angular

| Criterion | React + TypeScript | Vue 3 + TypeScript | Angular |
|---|---|---|---|
| Fit for a widget-plugin UI | Function components + hooks make a per-widget `Display`/`ConfigForm` pair trivial; `import.meta.glob` (Vite) gives free auto-discovery | Similar component model, same Vite auto-discovery works | Module-based DI system fights a "drop a folder in, it just works" plugin pattern — components need explicit module registration |
| Polling / Timer ecosystem | TanStack Query is the de facto standard; `refetchInterval` per query maps 1:1 onto "each widget has its own refresh rate" | TanStack Query has an official Vue adapter, same capability | RxJS `interval()` + `switchMap` works but is more boilerplate per widget |
| OAuth / form ecosystem | Largest ecosystem (Passport-adjacent client libs, React Hook Form, shadcn/ui) | Smaller but solid (VeeValidate, PrimeVue) | Full-featured but heavier (Angular Material, reactive forms) |
| Learning curve for this team | Already proficient (React/Next.js in current toolkit) | Would need ramp-up | Steepest curve (TypeScript decorators, RxJS, DI) for the smallest project payoff |
| License | MIT | MIT | MIT |

**Verdict: React + TypeScript.** The plugin-folder pattern maps directly onto React's component model with no framework-specific ceremony, and it's the option the team already has production experience with — removing ramp-up risk from a project with a hard deadline.

---

## 3. Backend: Node.js/Express vs. Python/FastAPI vs. Java/Spring Boot

| Criterion | Node.js + Express + TypeScript | Python + FastAPI | Java + Spring Boot |
|---|---|---|---|
| Fit for a service-plugin registry | A `ServiceDefinition`/`WidgetDefinition` object literal per folder, aggregated in one `Map` — minimal ceremony | Equivalent via Pydantic models + a registry dict; comparable ergonomics | Requires `@Component`/`@Service` annotations and Spring's DI container to achieve the same auto-registration — more framework machinery for the same result |
| `/about.json`-style dynamic JSON generation | Native `JSON.stringify` of a typed object — no extra layer | Pydantic models serialize cleanly too | Needs Jackson configuration to avoid over/under-serializing nested DTOs |
| OAuth 2.0 support | Passport has ready-made strategies for nearly every candidate service (GitHub, Discord, Twitch, Google) | `authlib` covers this well too | Spring Security OAuth2 client is powerful but has the steepest configuration surface of the three |
| Same-language frontend/backend validation | `zod` schemas can be shared verbatim between the Express backend and the React frontend (single source of truth for a widget's config shape) | Would require duplicating validation logic in TypeScript on the frontend (Pydantic doesn't cross the JS boundary) | Same duplication problem, worse — Java DTOs have no frontend equivalent at all |
| Performance under this workload (I/O-bound: proxying external APIs, not CPU-bound) | Node's event loop is a strong fit for an app that's mostly "wait on external HTTP calls" | Comparable (ASGI + async/await) | Comparable, but JVM startup/memory footprint is heavier for a project this size |
| Team familiarity | Already in active use (current toolkit) | Used for NLP/ML work previously, not web backends | Not part of current toolkit |
| License | MIT | MIT (FastAPI) | Apache 2.0 (Spring) |

**Verdict: Node.js + Express + TypeScript.** The deciding factor beyond familiarity is **shared validation**: `zod` schemas defined once in the widget plugin can be reused as-is on the frontend, which directly serves the "widgets must be addable with minimal changes elsewhere" requirement — a schema written for the backend plugin doesn't need a parallel Pydantic/Java DTO maintained in lockstep.

---

## 4. Database: PostgreSQL vs. MySQL vs. MongoDB

| Criterion | PostgreSQL | MySQL / MariaDB | MongoDB |
|---|---|---|---|
| Fit for widget `config` (variable shape per widget type) | `JSONB` column gives schemaless flexibility per widget *inside* a relational schema — best of both | JSON type exists but with weaker indexing/query support than Postgres's `JSONB` | Native fit for variable-shape documents, but the rest of the data (users, service subscriptions, OAuth tokens) is strictly relational and fights a document model |
| Relational integrity for users/services/instances | Strong (foreign keys, constraints) — matters for cascading deletes (remove a user → remove their instances) | Equally strong | Requires manual integrity enforcement in application code |
| Migration tooling simplicity | Plain `.sql` files + a small runner (already implemented) is enough; no ORM lock-in | Same approach works | Schema-less by design, so "migrations" become data-shape conventions enforced only in code — harder to audit |
| OAuth token storage, deadlines, timestamps | First-class `TIMESTAMP`, `BOOLEAN`, enum-like `CHECK` constraints | Comparable | Possible but loses the constraint-level guarantees |
| Team familiarity | Already in active use (current toolkit) | Not part of current toolkit | Not part of current toolkit |
| License | PostgreSQL License (permissive) | GPL (MySQL) / BSL-adjacent terms depending on edition — more restrictive than Postgres for redistribution | SSPL (not OSI-approved; license risk for some uses) |

**Verdict: PostgreSQL.** The project's actual data is overwhelmingly relational (users → subscriptions → widget instances, all with real foreign-key relationships), with exactly one spot that wants flexible shape — widget `config`. `JSONB` solves that one spot without giving up relational integrity everywhere else, which a pure document database would. License terms also favor Postgres outright (MongoDB's SSPL carries real redistribution caveats; Postgres's license has none).

---

## 5. Final Decision

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL (with `JSONB` for widget config) |

This is not just "what the team already knows" — each comparison above shows a concrete technical reason tied to this project's specific shape (plugin extensibility, shared validation, mixed relational/flexible data) independent of familiarity. Familiarity is the tiebreaker where the technical case is otherwise close (frontend framework choice), not the sole justification.

## 6. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Widget `config` schema changes after instances already exist in the DB (observed during manual testing: an old `rss` instance missing a field after a form update) | Validate with `.default()` on optional zod fields at read time, not just write time, once instances are DB-backed |
| `JSONB` config could be abused to bypass the widget's declared `params` contract | `configSchema.parse()` runs server-side on every write, not just client-side form validation |
| OAuth token refresh failures for connected services | Centralize token refresh in one place per the `ServiceCredentials` contract already defined in `types/widget.ts`, rather than per-adapter |