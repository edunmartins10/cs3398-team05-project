# Bitewise

Find restaurant orders that fit your budget. Compare meal value and analyze your own menu prices.

This is a Vite + React version of published Bitewise v1.

## Run

The backend requires Node.js 20.12 or newer, `g++`, and the `nlohmann/json.hpp`
header. The server compiles `restaurant project/Price_value.cpp` when it starts.
On Debian/Ubuntu, install the C++ prerequisites with:

```bash
sudo apt install g++ nlohmann-json3-dev
```

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

```bash
npm run build
npm run preview
```

## Source layout

- `src/App.jsx`: filters, database menu loading, and menu import
- `src/lib/value.js`: pasted-menu parsing and ranking display formatting
- `restaurant project/Price_value.cpp`: C++ ranking engine used by the API server
- `src/index.css`: layout, colors, and responsive styles
- `public/food.jpg`: hero image

## Data and behavior

Restaurant names, menu prices, and available nutrition values are loaded from
the hosted restaurant database API through the local `/api/restaurants` route.
The local server caches that catalog for up to one minute and returns an
explicit error if the upstream API is unavailable; it does not substitute
sample menu data. The server sends filters and any user-entered items to
`Price_value.cpp` through `/api/rank`; balanced ranking uses
`(calories + 10 × protein grams) ÷ price in dollars`.

Menu items without a usable price, calories, or protein value are excluded from
rankings. Pasted menus are still kept in browser memory and reset on reload.
Restaurant coordinates are not currently supplied by the catalog API, so
account distance limits are unavailable for database restaurants. A location
entered with a pasted menu can be used for that menu's distance estimate.
