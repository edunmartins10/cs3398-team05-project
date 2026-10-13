

export function hasAllergen(mealAllergens, excluded) {
    for (const allergen of mealAllergens) {
        if(excluded.includes(allergen)) {
            return true;
        }
    }
    return false;
}