# Database Schema

This document describes the SQLite database structure used by the restaurant/menu API.

The database stores restaurants, their operating hours, menu items, nutrition information, and normalized tags.

## Database

* **Database engine:** SQLite
* **Database file:** `menu.db`
* **Foreign keys:** Enabled
* **Primary keys:** Integer IDs, generally using `AUTOINCREMENT`
* **Current availability:** Represented by `menu_items.is_active`
* **Current restaurant open status:** Calculated by the API from `restaurant_hours`

---

# Tables

## `restaurants`

Stores the restaurants available through the API.

| Column        | Type    | Constraints               | Description                   |
| ------------- | ------- | ------------------------- | ----------------------------- |
| `id`          | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique restaurant ID          |
| `name`        | TEXT    | NOT NULL, UNIQUE          | Restaurant name               |
| `website_url` | TEXT    | —                         | Restaurant's official website |

### Relationships

A restaurant can have:

* Multiple menu items
* Multiple operating-hour records
* Multiple restaurant tags

Deleting a restaurant cascades to its menu items, hours, and restaurant tags.

---

## `restaurant_hours`

Stores the regular operating hours for each restaurant.

| Column          | Type    | Constraints               | Description                               |
| --------------- | ------- | ------------------------- | ----------------------------------------- |
| `id`            | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique hours record                       |
| `restaurant_id` | INTEGER | NOT NULL, FOREIGN KEY     | Restaurant                                |
| `day_of_week`   | INTEGER | NOT NULL                  | Day represented by the record             |
| `open_time`     | TEXT    | NOT NULL                  | Opening time in `HH:MM` format            |
| `close_time`    | TEXT    | NOT NULL                  | Closing time in `HH:MM` format            |
| `is_closed`     | BOOLEAN | DEFAULT 0                 | Whether the restaurant is closed that day |

### `day_of_week`

| Value | Day       |
| ----: | --------- |
|   `1` | Monday    |
|   `2` | Tuesday   |
|   `3` | Wednesday |
|   `4` | Thursday  |
|   `5` | Friday    |
|   `6` | Saturday  |
|   `7` | Sunday    |

### Constraints

Each restaurant can have only one hours record per day:

```sql
UNIQUE(restaurant_id, day_of_week)
```

### Relationships

```text
restaurants
    |
    └── restaurant_hours
```

Deleting a restaurant deletes its hours records.

### Overnight hours

The schema allows an opening time later than the closing time, such as:

```text
open_time  = 22:00
close_time = 02:00
```

The API handles these as hours that continue past midnight.

---

# Menu

## `menu_items`

Stores individual, independently orderable menu items.

| Column          | Type    | Constraints               | Description                             |
| --------------- | ------- | ------------------------- | --------------------------------------- |
| `id`            | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique menu item ID                     |
| `restaurant_id` | INTEGER | NOT NULL, FOREIGN KEY     | Restaurant offering the item            |
| `name`          | TEXT    | NOT NULL                  | Menu item name                          |
| `category`      | TEXT    | NOT NULL                  | Restaurant's own menu category          |
| `price`         | REAL    | NOT NULL                  | Current item price                      |
| `is_active`     | INTEGER | NOT NULL, DEFAULT 1       | Whether the item is currently available |

### Unique item names

Menu item names must be unique within a restaurant.

This is enforced by:

```sql
CREATE UNIQUE INDEX idx_menu_items_restaurant_name
ON menu_items (restaurant_id, name);
```

The same item name can still exist at different restaurants.

For example:

```text
McDonald's → Cheeseburger
Wendy's    → Cheeseburger
```

are valid because they belong to different restaurants.

### `category`

`category` represents the restaurant's own menu organization.

Examples:

```text
Breakfast
Burgers
Chicken & Fish Sandwiches
Desserts & Shakes
```

Categories should generally be kept as they appear on the restaurant's source menu rather than being converted into the project's normalized tag system.

### `is_active`

`is_active` represents whether an item should currently be considered available.

```text
1 = active/available
0 = inactive/unavailable
```

This can be used for items that are temporarily unavailable or no longer currently offered.

Seasonal and limited-time items may be excluded from the database entirely depending on the project's data-collection rules.

### Relationships

```text
restaurants
    |
    └── menu_items
            |
            ├── item_nutrition
            └── item_tags
```

Deleting a restaurant deletes its menu items and their related nutrition/tag records.

---

## `item_nutrition`

Stores nutritional information for menu items.

| Column         | Type    | Constraints              | Description                     |
| -------------- | ------- | ------------------------ | ------------------------------- |
| `item_id`      | INTEGER | PRIMARY KEY, FOREIGN KEY | Menu item                       |
| `calories`     | INTEGER | —                        | Calories per serving            |
| `protein_g`    | REAL    | —                        | Protein in grams                |
| `carbs_g`      | REAL    | —                        | Carbohydrates in grams          |
| `fat_g`        | REAL    | —                        | Fat in grams                    |
| `fiber_g`      | REAL    | —                        | Fiber in grams                  |
| `sodium_mg`    | REAL    | —                        | Sodium in milligrams            |
| `serving_size` | TEXT    | —                        | Source serving-size description |

### Relationship

Each menu item can have at most one nutrition record.

```text
menu_items
    |
    └── item_nutrition
```

The relationship is one-to-zero-or-one.

Deleting a menu item deletes its nutrition record.

### Example

```text
Big Mac
├── calories: 580
├── protein_g: 25
├── carbs_g: 45
├── fat_g: 34
├── fiber_g: 3
├── sodium_mg: 1060
└── serving_size: 1 sandwich
```

Nutrition values should be sourced from the restaurant whenever possible.

---

# Tags

Tags provide normalized, cross-restaurant filtering.

Unlike `menu_items.category`, tags are controlled by this project and are intended to provide consistent filtering across different restaurants.

For example, two restaurants may organize their menus differently but both sell burgers. Both items can therefore receive:

```text
food_type → burger
```

Tags are stored separately from the records they describe so that the same tag can be reused across many restaurants or menu items.

---

## `tags`

Stores the project's normalized tag vocabulary.

| Column     | Type    | Constraints                 | Description               |
| ---------- | ------- | --------------------------- | ------------------------- |
| `id`       | INTEGER | PRIMARY KEY AUTOINCREMENT   | Unique tag ID             |
| `name`     | TEXT    | NOT NULL, UNIQUE            | Machine-readable tag name |
| `tag_type` | TEXT    | NOT NULL, DEFAULT 'general' | Type/category of tag      |

### Tag names

Tag names use normalized machine-readable names such as:

```text
fast_food
american
burger
chicken
vegan
gluten
```

The API can use these values for filtering while a frontend can display more user-friendly labels.

### Tag types

The current tag types include:

```text
venue_type
cuisines
features
dietary
allergens
food_type
protein
```

The complete tag taxonomy is documented separately in [`tags.md`](tags.md).

### Important constraint

`name` is globally unique.

Therefore, this is **not** currently allowed:

```text
seafood → cuisines
seafood → protein
```

if both records use the exact same `name`.

When the same concept would conflict with an existing tag name, the normalized tag name must be different. For example:

```text
seafood_protein → protein
seafood          → cuisines
```

The database currently enforces uniqueness on `name`, not on `(name, tag_type)`.

---

## `restaurant_tags`

Associates restaurants with tags.

| Column          | Type    | Constraints           | Description |
| --------------- | ------- | --------------------- | ----------- |
| `restaurant_id` | INTEGER | NOT NULL, FOREIGN KEY | Restaurant  |
| `tag_id`        | INTEGER | NOT NULL, FOREIGN KEY | Tag         |

### Primary key

```sql
PRIMARY KEY(restaurant_id, tag_id)
```

This prevents the same tag from being assigned to the same restaurant more than once.

### Relationship

This is a many-to-many relationship:

```text
restaurants
     |
     | many
     |
restaurant_tags
     |
     | many
     |
    tags
```

A restaurant can have many tags, and the same tag can apply to many restaurants.

### Example

A restaurant might have:

```text
fast_food
american
burgers
breakfast_brunch
drive_thru
mobile_ordering
delivery
catering
dine_in
rewards_program
```

---

## `item_tags`

Associates menu items with tags.

| Column    | Type    | Constraints           | Description |
| --------- | ------- | --------------------- | ----------- |
| `item_id` | INTEGER | NOT NULL, FOREIGN KEY | Menu item   |
| `tag_id`  | INTEGER | NOT NULL, FOREIGN KEY | Tag         |

### Primary key

```sql
PRIMARY KEY(item_id, tag_id)
```

This prevents the same tag from being assigned to the same menu item more than once.

### Relationship

This is a many-to-many relationship:

```text
menu_items
     |
     | many
     |
 item_tags
     |
     | many
     |
    tags
```

A menu item can have multiple tags.

For example:

```text
McChicken
├── food_type → sandwich
└── protein   → chicken
```

Another item could have:

```text
Chicken Caesar Salad
├── food_type → salad
└── protein   → chicken
```

This allows filters to be combined without creating a separate tag for every possible combination.

---

# Tagging Model

Tags describe properties that are useful for filtering and searching.

They are **not intended to be a complete ingredient database or food ontology**.

For example, an item containing bacon does not necessarily need a `bacon` tag. If its primary protein is beef, it can simply be tagged:

```text
protein → beef
food_type → burger
```

Similarly, a chicken sandwich should not require a special:

```text
chicken_sandwich
```

tag.

Instead:

```text
food_type → sandwich
protein → chicken
```

This allows users to perform searches such as:

```text
Chinese + noodles
chicken + sandwich
vegan + burger
Italian + pasta
```

without requiring combination-specific tags.

The detailed tagging rules and vocabulary are documented in [`tags.md`](tags.md).

---

# Foreign-Key Relationships

The database uses foreign keys with cascading deletes to keep related data synchronized.

```text
restaurants
│
├── restaurant_hours
│
├── restaurant_tags
│       │
│       └── tags
│
└── menu_items
        │
        ├── item_nutrition
        │
        └── item_tags
                │
                └── tags
```

### Cascade behavior

Deleting a restaurant removes:

```text
restaurant_hours
restaurant_tags
menu_items
```

Deleting a menu item removes:

```text
item_nutrition
item_tags
```

Deleting a tag removes its associations from:

```text
restaurant_tags
item_tags
```

The database/API connection must have SQLite foreign-key enforcement enabled:

```sql
PRAGMA foreign_keys = ON;
```

For the PHP API, this should also be enabled on the PDO connection:

```php
$pdo->exec('PRAGMA foreign_keys = ON');
```

SQLite foreign-key enforcement is connection-specific, so enabling it in one database session does not automatically enable it for other connections.

---

# Current Schema SQL

The canonical executable schema should be maintained in:

```text
database/schema.sql
```

This file is the source of truth for creating the database structure.

This document explains the structure and design decisions; it should be updated whenever the schema or its intended behavior changes.

---

# Data Entry Rules

When adding data:

1. Every actual, independently orderable menu item gets a `menu_items` row.
2. Menu section headings are not menu items.
3. `category` should use the restaurant's own menu category.
4. Size variants should be separate menu items when their price or nutritional information differs.
5. Bundles/meals should not be duplicated as individual menu items when they are compositions of existing items.
6. Nutrition belongs in `item_nutrition`.
7. Normalized filtering information belongs in `item_tags`.
8. Restaurant-level characteristics belong in `restaurant_tags`.
9. Do not manually assume a `menu_items.id` when inserting related data.
10. Related records should be found using the restaurant and exact item name when necessary.

For example:

```sql
INSERT INTO item_nutrition
(item_id, calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, serving_size)
SELECT id, 580, 25, 45, 34, 3, 1060, '1 sandwich'
FROM menu_items
WHERE restaurant_id = 1
  AND name = 'Big Mac';
```

This avoids relying on the current numeric ID assigned to the menu item.

---

# Related Documentation
* ['README.me'](README.md) - Project overview
* [`docs/tags.md`](tags.md) — Tag vocabulary and tagging rules
* [`docs/api.md`](api.md) — API structure and response format
