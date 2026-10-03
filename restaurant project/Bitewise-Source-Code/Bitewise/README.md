# Bitewise source code

Source for published version 1 of https://bitewise-meal-value.windsorj-aaron.chatgpt.site

## Run
Extract the ZIP, then open index.html in your browser. No installation or build step is required. You can also open the folder in VS Code and use Live Server.

## Files
- index.html: page structure and controls
- style.css: layout, colors, and responsive styles
- app.js: menu data, ranking, filters, combinations, and menu import
- food.jpg: hero image

## Data and behavior
This published version uses illustrative sample menu prices and nutrition, not verified current San Marcos prices or a live menu feed. The unfinished local restaurant research changes are not part of this published version.

Edit the menu array in app.js to change items. Prices are integer cents. Calories and protein (grams) are numeric. Imported menus are held in memory and reset on reload.

Balanced value gives equal weight to normalized calories per dollar and protein per dollar among eligible orders. It is a value comparison, not an overall health rating. Combinations contain up to two items from the same restaurant, including duplicates. Prices exclude tax and fees.

Source commit: 978bccb94b2fb394caeca882b2b84b9e9230fe05
