


export function calculateValue(item) {
    return (item.nutrition.calories + (10 * item.nutrition.protein)) / item.price;
}

export function calculateDietaryScore(nutrition) {
 return(
    nutrition.protein *10 + nutrition.fiber * 10 + nutrition.carbs * 10 - nutrition.sodium / 1000 - nutrition.fat * 10 - nutrition.calories
 );
}