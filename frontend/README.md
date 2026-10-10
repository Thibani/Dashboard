# Dashboard — frontend

React + TypeScript application built with Vite. It talks to the Express API in `../backend`.

```bash
npm install
npm run dev          # development server on http://localhost:5173
npm run build        # type-check and production build (dist/)
npx vitest run       # tests (npm test for watch mode)
npm run lint         # ESLint
```

The API address comes from `VITE_API_URL` (default `http://localhost:8080`) and is inlined at build time.

Architecture, the widget system, styling and how to add a widget are described in the [Developer guide](../docs/dev-doc.md#frontend).
