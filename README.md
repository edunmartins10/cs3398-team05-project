# Bitewise

Find restaurant orders that fit your budget. Compare meal value and analyze your own menu prices.

This is a Vite + React version of published Bitewise v1.

## Run

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

- `src/App.jsx`: filters, ranking state, and menu import
- `src/lib/value.js`: combinations, scoring, and pasted-menu parsing
- `src/data/sampleMenu.js`: illustrative sample items
- `src/index.css`: layout, colors, and responsive styles
- `public/food.jpg`: hero image

## Data and behavior

Sample menu prices and nutrition are illustrative, not verified current restaurant offers. Prices are stored as integer cents. Calories and protein (grams) are numeric. Imported menus stay in memory and reset on reload.

Balanced value gives equal weight to normalized calories per dollar and protein per dollar among eligible orders. Combinations contain up to two items from the same restaurant, including duplicates. Prices exclude tax and fees.
