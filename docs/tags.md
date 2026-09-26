# Tag Taxonomy

This document defines the normalized tag taxonomy used by the restaurant/menu database.

Tags provide **cross-restaurant classification and filtering**. They are separate from a restaurant's own menu categories.

For example:

* A restaurant's menu may categorize an item as `Burgers`.
* The normalized tags might classify that same item as `burger` and `beef`.
* A restaurant may have a cuisine tag such as `american`.
* A restaurant may have venue/features such as `fast_food`, `drive_thru`, and `mobile_ordering`.

The goal of the taxonomy is to provide useful filters without attempting to describe every possible characteristic of a restaurant or menu item.

---

## Tag Types

| `tag_type`   | Purpose                                                                                | Applies to                    |
| ------------ | -------------------------------------------------------------------------------------- | ----------------------------- |
| `venue_type` | General type/style of restaurant or food venue                                         | Restaurants                   |
| `cuisines`   | Cuisine or culinary tradition represented by a restaurant                              | Restaurants                   |
| `features`   | Restaurant services, amenities, or operational features                                | Restaurants                   |
| `dietary`    | Dietary classifications                                                                | Restaurants and/or menu items |
| `allergens`  | Allergens and other allergen-related ingredients or substances tracked by the database | Menu items                    |
| `protein`    | Primary protein or protein-source category in a menu item                              | Menu items                    |
| `food_type`  | Recognizable food or beverage category                                                 | Menu items                    |

---

# `venue_type`

Describes the general type of establishment.

```text
fast_food
fast_casual
café_bakery
juice_smoothie
casual_dining
premium_casual
fine_dining
diner
food_truck
buffet
grab_n_go
virtual_restaurant
```

---

# `cuisines`

Describes the restaurant's cuisine or broader culinary tradition.

```text
american
tex-mex
mexican
southern
bbq
cajun
caribbean
chinese
japanese
korean
thai
vietnamese
filipino
italian
mediterranean
middle_eastern
indian
seafood
breakfast_brunch
```

### Taxonomy notes

Cuisine tags describe a restaurant's broader culinary tradition or style, rather than individual dishes that happen to appear on its menu.

A cuisine tag should represent a meaningful aspect of the restaurant's overall food identity. Individual dishes and food categories should generally be represented through `food_type` tags instead.

For example, a restaurant may be classified as:

```text
cuisines = japanese
```

while an individual menu item from that restaurant may be classified as:

```text
food_type = ramen
```

A restaurant may have multiple cuisine tags when it genuinely represents multiple culinary traditions. However, specific dishes should not automatically be treated as cuisines simply because they are strongly associated with a particular culinary tradition.

Cuisine tags should remain broad enough to be useful for finding restaurants, while `food_type` tags provide more specific classification for individual menu items.

---

# `features`

Describes restaurant services, amenities, and operational features.

```text
drive_thru
curbside_pickup
mobile_ordering
delivery
self_order_kiosk
catering
late_night
24_7
breakfast_all_day
dine_in
outdoor_seating
free_wifi
kids_zone
student_discount
rewards_program
```

---

# `dietary`

Describes dietary classifications.

```text
vegetarian
vegan
pescatarian
keto
low-carb
high_protein
low-calorie
low-sodium
gluten_friendly
dairy-free
organic
non-GMO
halal
kosher
```

These tags should describe meaningful dietary characteristics rather than individual ingredients.

Dietary tags describe suitability or dietary characteristics, while allergen tags describe ingredients or substances that may trigger an allergic reaction.

---

# `allergens`

Describes allergens and other allergen-related ingredients or substances tracked by the database.

```text
milk
eggs
wheat
soy
peanuts
tree_nuts
fish
shellfish
sesame
msg
sulfites
gluten
```

These names are intentionally distinct from the `protein` taxonomy where necessary.

For example, `fish` exists as an allergen tag, while seafood protein classifications use `seafood_protein`.

---

# `protein`

Describes the primary protein or protein-source category of a menu item.

```text
beef
pork
chicken
turkey
lamb
goat
seafood_protein
shellfish_protein
egg
plant_based
```

### Protein taxonomy principles

Protein tags describe the **protein source or protein category**, not the preparation or specific product.

For example:

```text
protein = chicken
```

rather than separate protein tags such as:

```text
chicken_breast
fried_chicken
grilled_chicken
chicken_nugget
```

Those distinctions belong elsewhere, usually in `food_type`.

Likewise, `bacon`, `pepperoni`, and `sausage` should not automatically become protein categories. `sausage`, for example, can be represented as a `food_type`.

`seafood_protein` and `shellfish_protein` are deliberately named this way because `seafood` and `shellfish` already exist as globally unique tag names under other tag types.

---

# `food_type`

Describes recognizable food and beverage categories that users may reasonably want to search or filter for across restaurants.

The taxonomy intentionally does **not** attempt to represent every individual dish, ingredient, preparation, or menu variation.

New `food_type` tags should be added only when they provide a useful cross-restaurant classification rather than simply representing a more specific version or preparation of an existing tag.

## Handhelds & Main Dishes

```text
burger
sandwich
wrap
sub
panini
taco
burrito
quesadilla
pizza
flatbread
pita
```

## Pasta, Noodles & Rice

```text
pasta
noodles
ramen
udon
soba
pho
rice_dish
fried_rice
risotto
paella
```

Distinct noodle and rice dishes such as `ramen`, `udon`, `soba`, and `pho` are retained because they represent recognizable dishes associated with distinct culinary traditions rather than merely minor variations.

## Bowls

```text
bowl
poke_bowl
```

`bowl` provides a broad category, while `poke_bowl` is retained as a distinct, recognizable dish.

More specific combinations such as `rice_bowl`, `grain_bowl`, and `noodle_bowl` are not separately represented.

## Soups, Salads & Similar

```text
salad
soup
chowder
stew
chili
bisque
```

## International Dishes

```text
dumplings
bao
spring_roll
egg_roll
sushi
sashimi
tempura
teriyaki
stir_fry
curry
kebab
shawarma
falafel
hummus
gyro
```

Cuisine-specific dishes are included when they represent broadly recognizable food categories that users may reasonably search for independently.

The taxonomy does not attempt to include every dish from every cuisine.

For example, individual Mexican dishes such as enchiladas, tamales, and chimichangas are not currently represented as `food_type` tags. Users interested in those foods can generally use cuisine or menu search to find appropriate restaurants.

## Meat & Protein-Centered Foods

```text
steak
ribs
chicken_wings
chicken_tenders
chicken_nuggets
meatballs
sausage
hot_dog
corn_dog
```

`steak` and `ribs` are retained because they are recognizable standalone menu categories that users may specifically seek.

More generic or cuisine-overlapping categories such as `roast` and `brisket` are not included. For example, brisket is strongly associated with the existing `bbq` cuisine classification.

`fish`, `seafood`, and `shellfish` are also not `food_type` tags. Seafood classification is handled through the `protein` taxonomy where appropriate, while `fish` and `shellfish` already exist as allergen tags.

## Breakfast

```text
pancakes
waffles
french_toast
crepes
oatmeal
cereal
omelet
egg_dish
breakfast_sandwich
breakfast_burrito
hash
```

`egg_dish` provides a broad category rather than creating separate tags for every egg preparation.

## Sides & Snack Foods

```text
fries
nachos
onion_rings
mozzarella_sticks
breadsticks
garlic_bread
pretzel
```

Generic `chips` are intentionally excluded because they are usually an accompaniment or side rather than a particularly useful cross-restaurant food filter.

## Bakery

```text
bagel
croissant
muffin
donut
pastry
biscuit
```

The bakery taxonomy is intentionally reduced.

Generic `bread` and `roll` are excluded because they are too broad and commonly function as ingredients or accompaniments.

More specific bakery varieties such as `scone` and `danish` are also not currently represented separately; `pastry` provides a broader category.

## Pies & Desserts

```text
sweet_pie
savory_pie
ice_cream
sundae
frozen_yogurt
gelato
sorbet
cake
cheesecake
tart
cookie
brownie
pudding
custard
cannoli
```

Pies are intentionally divided into:

```text
sweet_pie
savory_pie
```

This distinction is useful because sweet and savory pies are substantially different food categories and may be offered by different types of restaurants.

The taxonomy does not go down to individual pie varieties such as apple pie, pecan pie, or chicken pot pie.

## Drinks

```text
coffee
tea
iced_tea
lemonade
juice
smoothie
shake
soft_drink
energy_drink
hot_chocolate
```

Specific coffee preparations such as:

```text
espresso
latte
cappuccino
americano
```

are intentionally excluded. These are considered preparations or varieties within the broader `coffee` category rather than useful global food-type classifications.

Likewise, `milk` is not a `food_type`; it already exists as an allergen tag.

---

# Tagging Philosophy

The taxonomy follows several principles.

## 1. Restaurant Categories and Normalized Tags Are Different

A restaurant's menu category should remain the restaurant's own organization.

For example:

```text
category = "Chicken & Fish Sandwiches"
```

A normalized item could have:

```text
food_type = sandwich
protein = chicken
```

Do not replace the restaurant's category with the normalized classification.

## 2. Tags Should Provide Useful Filtering

A tag should generally satisfy at least one of these conditions:

* Users could realistically search or filter for it.
* It occurs across multiple restaurants.
* It represents a recognizable food category.
* It provides useful information that another tag cannot reasonably provide.

The system should avoid becoming an exhaustive food ontology.

## 3. Avoid Redundant Taxonomy

Do not create separate tags merely because a food can be described in several ways.

For example:

```text
burger
beef
```

is preferable to creating:

```text
beef_burger
cheeseburger
beef_patty
```

Similarly:

```text
ramen
```

is useful, while individual ramen preparations do not necessarily need their own global tags.

## 4. Cuisine Should Not Duplicate Food Type

A food being strongly associated with a cuisine does not automatically make it a cuisine tag.

For example:

```text
cuisines = japanese
food_type = ramen
```

rather than treating `ramen` itself as a cuisine.

Likewise:

```text
cuisines = bbq
food_type = ribs
```

is preferable to making `ribs` a cuisine.

## 5. Protein Describes Composition

Protein tags describe what primary protein or protein source an item contains.

For example:

```text
food_type = sandwich
protein = chicken
```

or:

```text
food_type = burger
protein = beef
```

An item may have multiple protein tags when genuinely necessary, although most items will have one primary protein classification.

## 6. Food Type Describes the Form or Category of the Item

Food type and protein are compositional classifications.

Examples:

```text
McChicken

    food_type = sandwich
    protein = chicken
```

```text
Big Mac

    food_type = burger
    protein = beef
```

```text
Chicken Caesar Salad

    food_type = salad
    protein = chicken
```

```text
Chicken Burrito

    food_type = burrito
    protein = chicken
```

This allows users to search for a food category independently of the restaurant's menu organization.

---

# Tag IDs

Tag IDs are database-generated identifiers and are not part of the taxonomy.

`tags.id` uses SQLite `INTEGER PRIMARY KEY AUTOINCREMENT`. IDs are intended to remain stable once assigned, and deleted IDs are not reused.

Gaps in the ID sequence are therefore expected and should not be manually filled or renumbered.

Tag IDs should not be used to determine the meaning, ordering, or category of a tag. The tag's `name` and `tag_type` define its taxonomy classification.

# Related Documentation

* [`README.md`](../README.md) — Project overview
* [`docs/api.md`](api.md) — API structure and response format
* [`docs/schema.mds`](../database/schema.md) — Database schema
