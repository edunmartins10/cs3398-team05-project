# Backend Guide

Bitewise's backend is a small Express API that handles authentication and
account persistence through Supabase. It also serves the built frontend when
started with `NODE_ENV=production`.

## Run locally

Use Node.js 20.12 or newer. From the repository root:

```bash
npm install
npm run dev
```

The development command starts the API and Vite together. To run only the API,
use `npm run start`; it listens on `API_PORT`, then `PORT`, then port 3001. The
root `.env` file is loaded by the development launcher and server. In local
development, keep `API_PORT` aligned with Vite's `/api` proxy setting.

For production static hosting, first run `npm run build`, then start the server
with `NODE_ENV=production`. The server serves files from `dist/` and falls back
to `dist/index.html` for client-side routes.

## Structure

- `Backend/server.js` creates the Express app, configures CORS, JSON parsing,
  cookie parsing, API route mounts, and optional production static hosting.
- `Backend/routes/auth.js` implements signup, login, logout, profile reads and
  updates, signup-policy checks, and recommendation preference operations.
- `Backend/routes/account/orders.js` reads and writes completed order history.
- `Backend/routes/account/saved-orders.js` reads, adds, and removes favorite
  order snapshots.
- `Backend/services/supabase.js` creates Supabase clients, validates session
  tokens, and provides a client that forwards the signed-in user's token for
  row-level security.

Express enables JSON request bodies and cookies globally. The development CORS
origin is fixed to `http://localhost:5173`. Vite proxies `/api` requests to the
API server; the API listens on port 3001 unless configured otherwise.

## API routes

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/auth/signup-policy` | Public | Read signup username and ZIP rules from Supabase. |
| `POST` | `/api/auth/signup-policy/username-availability` | Public | Check username availability. |
| `GET` | `/api/auth/preferences/options` | Public | Read enabled recommendation goals and dietary restrictions. |
| `POST` | `/api/auth/register` | Public | Create a Supabase Auth account and set a session cookie when a session is returned. |
| `POST` | `/api/auth/login` | Public | Authenticate with Supabase Auth and set a session cookie. |
| `POST` | `/api/auth/logout` | Public | Clear the session cookie. |
| `GET` | `/api/auth/me` | Optional session | Return the current profile, or `{ "profile": null }` when signed out. |
| `PUT` | `/api/auth/me` | Signed in | Update supported profile fields: username, ZIP code, or phone. |
| `PUT` | `/api/auth/me/preferences` | Signed in | Save recommendation and distance preferences. |
| `GET` | `/api/auth/orders` | Signed in | Read up to 100 recent completed orders. |
| `POST` | `/api/auth/orders` | Signed in | Save a completed order and its item details. |
| `GET` | `/api/auth/saved-orders` | Signed in | Read saved order snapshots. |
| `POST` | `/api/auth/saved-orders` | Signed in | Add a favorite order; matching favorites are treated idempotently. |
| `DELETE` | `/api/auth/saved-orders/:id` | Signed in | Remove a saved order owned by the current user. |

Unknown `/api` paths return JSON with a 404 status. The server currently has
no `/api/geo/:zip` route; the frontend's ZIP-assisted menu import calls that
path, so it needs an implementation before that flow can succeed.

## Authentication and data access

On login or signup with an active session, the backend puts the Supabase access
token in an HTTP-only `bitewise_session` cookie. The cookie uses `SameSite=Lax`
and is marked `Secure` in production. Protected routes validate the token with
Supabase Auth, then query the database using that user's token so Supabase row
level security remains in force. The backend does not use a service-role key
for customer data operations.

Supabase URL and the publishable key are currently configured in
`Backend/services/supabase.js`; they are not read from environment variables.
The external Supabase project must have the tables, functions, triggers, and
row-level security policies expected by the routes. In particular, account
preferences and signup validation depend on the configuration described in
[`Backend/README.md`](../Backend/README.md). Order history also expects the
`create_order_with_item` RPC, and saved orders require the `saved_orders` table
and its per-user policies and uniqueness constraint.

The username availability route is public and can disclose whether a username
is registered. Rate limiting should be considered before a public launch.

## Configuration notes

- `API_PORT` sets the API port and is also used by the Vite proxy.
- `PORT` is a backend fallback when `API_PORT` is unset; prefer `API_PORT` for
  local development so the proxy follows it.
- `NODE_ENV=production` enables serving the built frontend and secure cookies.
- Supabase schema and Auth settings are managed in the Supabase project, not
  provisioned by this repository's npm scripts.