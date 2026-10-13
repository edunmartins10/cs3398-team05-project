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