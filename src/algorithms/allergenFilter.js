export function hasAllergen(mealAllergens, excluded) {
    // No excluded allergens means no allergen-based filtering
    if (!Array.isArray(excluded) || excluded.length === 0) {
        return false;
    }

    // Unknown allergen information: exclude the meal as a precaution
    if (!Array.isArray(mealAllergens) || mealAllergens.length === 0) {
        return true;
    }

    const excludedLower = excluded.map(allergen =>
        allergen.trim().toLowerCase()
    );

    for (const allergen of mealAllergens) {
        if (excludedLower.includes(allergen.trim().toLowerCase())) {
            return true;
        }
    }

    return false;
}