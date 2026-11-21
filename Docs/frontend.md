# Frontend Guide

Bitewise's frontend is a React single-page application built with Vite. It lets
users explore menu items, apply filters, compare meal value, and manage account
features through the backend API.

## Run and build

Use Node.js 20.12 or newer, then run these commands from the repository root:

```bash
npm install
npm run dev
```

`npm run dev` starts both the Express API and Vite development server. Open the
URL printed by Vite, normally `http://localhost:5173`. Vite forwards `/api`
requests to the backend on port 3001 by default. Set `API_PORT` in the root
`.env` file to change the backend port; the Vite proxy uses the same setting.

To create and preview a production build:

```bash
npm run build
npm run preview
```

## App structure

- `Frontend/main.jsx` mounts the React app and global stylesheet.
- `Frontend/App.jsx` defines routes, theme selection, and the shared page shell.
- `Frontend/pages/Home.jsx` owns homepage state and connects filters, results,
  menu import, location display, sign-in state, order history, and saved orders.
- `Frontend/pages/Account.jsx` loads and updates the signed-in user's account,
  preferences, order history, and saved orders.
- `Frontend/pages/FAQ.jsx`, `Frontend/pages/EmailVerified.jsx`, and
  `Frontend/pages/NotFound.jsx` provide supporting routes.
- `Frontend/components/` contains the reusable UI, including filters, result
  lists, dialogs, account panels, and the restaurant map.
- `Frontend/lib/api.js` is the shared fetch wrapper. It sends same-origin
  requests, parses JSON responses, and exposes helpers for POST and PUT.
- `Frontend/data/sampleMenu.js` supplies the example restaurant menu.
- `Frontend/index.css` and `Frontend/darkMode.css` define global layout and
  theme styles.

The routes are `/` (home), `/account`, `/faq`, and `/email-verified`; unknown
paths show the not-found page.

## Recommendation flow

The homepage starts with the sample menu. Filters select restaurants, budget,
minimum calories, whether to include two-item combinations, recommendation
goal, and dietary restrictions. `Frontend/lib/value.js` parses imported text,
builds eligible one- and two-item orders, and ranks the results. Dietary scoring
is implemented in `Frontend/lib/dietaryScore.js`.

Menu prices are represented as integer cents in the frontend. The menu import
dialog accepts one item per line in this format:

```text
Name | 5.49 | 460 | 28
```

The fields are item name, price in dollars, calories, and protein in grams.
Imported menus live only in browser memory and are lost on reload. Sample menu
prices, nutrition values, allergen tags, and restaurant coordinates are
illustrative; verify them before using them as current restaurant information.

Available recommendation goals and dietary restriction choices come from the
backend's Supabase-backed options endpoint. Adding an option in Supabase does
not automatically implement its ranking or filtering behavior: the matching
key must also be supported by the frontend logic. See
[`Backend Guide`](backend.md) and [`Backend/README.md`](../Backend/README.md)
for the database-side setup and synchronization details.

## Account and API behavior

The frontend calls `/api/auth/*` for signup, login, account data, preferences,
order history, and saved orders. The API wrapper uses same-origin credentials;
the browser does not persist the Supabase access token itself. Successful
authentication changes are broadcast through `AUTH_CHANGED_EVENT` so pages can
reload account state.

For detailed routes and required backend configuration, see the
[`Backend Guide`](backend.md). Account and saved data require the Supabase
schema, RPCs, and row-level security policies described in
[`Backend/README.md`](../Backend/README.md).

## Current limitation

Importing a menu with a ZIP code currently requests `/api/geo/:zip`, but the
Express server does not register that route. ZIP-assisted menu imports therefore
fail unless a geocoding route is added or the frontend behavior is changed.