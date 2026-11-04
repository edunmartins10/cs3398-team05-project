export function convertMeals(restaurants) {
    const meals = [];

    for (const restaurant of restaurants) {
        for (const item of restaurant.menu_items ?? []) {
            const nutrition = item.nutrition ?? {};

            meals.push({
                id: item.id,
                name: item.name,
                restaurantName: restaurant.name,
                price: item.price,
                category: item.category,

                nutrition: {
                    calories: nutrition.calories ?? 0,
                    protein: nutrition.protein_g ?? 0,
                    carbs: nutrition.carbs_g ?? 0,
                    fat: nutrition.fat_g ?? 0,
                    fiber: nutrition.fiber_g ?? 0,
                    sodium: nutrition.sodium_mg ?? 0
                },

                allergens: (item.tags ?? [])
                    .filter(tag => tag.tag_type === "allergens")
                    .map(tag => tag.name)
            });
        }
    }

    return meals;
}

export function convertFrontendMeals(menu) {
    return menu.map(item => ({
        id: item.id,
        name: item.name,
        restaurantName: item.restaurant,

        // Bitewise stores prices in cents; our algorithm uses dollars
        price: item.price / 100,

        // Sample menus do not provide meal categories
        category: null,

       nutrition: {
  calories: item.calories ?? null,
  protein: item.protein ?? null,
  carbs: item.carbs ?? null,
  fat: item.fat ?? null,
  fiber: item.fiber ?? null,
  sodium: item.sodium ?? null
},

        // Unknown, not confirmed allergen-free
        allergens: null
    }));
}