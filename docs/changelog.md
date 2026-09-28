# 2026-09-30
## Tags
* Updated `cafe_bakery` tag classification/name.

## Cedar & Stone Kitchen
* Added fictional demonstration restaurant.
* Added 15 menu items.
* Added restaurant-level venue, cuisine, and feature tags.
* Added food type, protein, and other item tags.

## Sunrise Junction Cafe
* Added fictional demonstration restaurant.
* Added 18 menu items.
* Added restaurant-level venue, cuisine, and feature tags.
* Added food type, protein, and other item tags.

## Database Cleanup
* Reassociated synthetic menu items with their current restaurant IDs.
* Removed orphaned restaurant-tag relationships from deleted restaurants.
* Verified that no orphaned menu, item-tag, or nutrition records remain.
* Enabled foreign-key enforcement for the database connection.

# 2026-09-28
## McDonalds
- Added protein and food type item tags for all McDonalds items currently in the database.

## Burger King
- Added Whoppers & Burgers menu items.
- Added preliminary national-median prices from Fast Food Index.
- Prices are based on Burger King's ordering-system data collected September 20–26, 2026.
- Excluded The King of Wrap from this category because it is a wrap despite being listed under Whoppers & Burgers by the source.
- Classified all included items as food_type=burger.
- Classified Impossible Whopper variants as protein=plant_based; other included burgers as protein=beef.