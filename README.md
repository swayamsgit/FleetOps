# FleetOps
React maintenance dashboard, REST API, parameterized SQL, and explainable risk ranking. The hosted private app uses Cloudflare D1. The portable Node.js API uses SQLite with the same request handlers and schema.

## Running
- Hosted full-stack development: `npm install`, then `npm run dev`. Provision the local D1 schema before use.
- Portable API: Node 24, then `node server/node.mjs` (port 3001).
- Docker API: `docker compose up --build`. SQLite persists in a named volume.
- Tests: `node --test tests/*.test.mjs`.

REST endpoints: GET /api/aircraft, GET /api/analytics, GET/POST /api/tasks, PUT/DELETE /api/tasks/:id, POST /api/seed, GET /api/health.

Aircraft inventory is a fixed six-aircraft demo catalog. Demo tasks are added only when requested in the UI. Risk uses severity points [10,25,45,65,80] plus 5 per overdue UTC day (maximum 20 additional), capped at 100. Completed work scores zero. This demonstration is not certified aviation maintenance software.

Docker runs the API only. The React frontend and hosted API are deployed together through Sites. The CI workflow runs the eleven API tests and builds the API container when pushed to GitHub. The Node API is intended for local use and has no application authentication. The hosted site is protected by private Sites access.

## Workspace pages
- `/login`: ChatGPT sign-in/session page. Hosted private access remains enforced by Sites.
- `/maintenance`, `/aircraft`, `/aircraft/VT-ALN`, `/analytics`: fleet work and detail pages.
- `/schedule`, `/alerts`, `/activity`, `/settings`: monthly schedule, derived alerts, immutable task change history, and persisted workspace settings.

The application display name defaults to Swayams Mohanty. The SVG logo lives in `public/fleetops-mark.svg` and is also used as the favicon. Task audit history starts when migration 0001 is applied, with events written atomically by SQL triggers. Existing records are preserved. Hosted pages and APIs require authenticated identity. Development mode bypasses identity for local QA only.

## Public Vercel edition

The production Vercel app is a public **read-only** viewer. Its API rejects POST,
PUT, PATCH and DELETE before forwarding any request. The private Sites deployment
remains the owner's editable workspace. Never disable protection on legacy writable
deployment URLs; use Vercel Standard Protection to keep them protected while making
the current production domain public.

Generate the Next.js deployment source with `node scripts/prepare-vercel.mjs`.
Then run `cd outputs/vercel`, `npm install`, and `npm run build`.
Configure these **server-only** environment variables in your own Vercel project:
- `FLEETOPS_BACKEND_URL`: URL of your own deployed backend.
- `FLEETOPS_BACKEND_ACCESS`: your backend's access bearer token.
- `FLEETOPS_SERVICE_SECRET`: shared service secret, also configured in the backend.

No credentials or database contents are included in this source package. Set up
your own database using the SQL files in `drizzle/`. Deploying to Sites also requires
your own project identity in `.openai/hosting.json`.

Tests: `node --test tests/*.test.mjs` (Node.js 24 or later).
