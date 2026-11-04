import { hasAllergen } from  "./allergenFilter.js";
import {  calculateValue } from "./PriceValue.js";
import { calculateDietaryScore } from "./dietaryScore.js";

function calculateHistoryScore(meal, orderHistory) {
    let score = 0;

    for (const order of orderHistory) {
        if (meal.category === order.category) {
            score += 10;
        }

        if (meal.restaurantName === order.restaurantName) {
            score += 5;
        }

        if (meal.name === order.mealName) {
            score += 15;
        }
    }

    return score;
}




export function recommendMeals (meals, preferences) {
    const { budget, excludedAllergens, goal = "value", orderHistory = [] } = preferences;
    const recommended = meals.filter(meal => {
        const withinBudget = meal.price <= budget;
        const containsAllergen = hasAllergen(meal.allergens, excludedAllergens);

        return withinBudget && !containsAllergen;
    });
    return recommended.filter(meal => meal.price > 0).map(meal => ({
        ...meal,
        valueScore: calculateValue(meal),
        dietaryScore: calculateDietaryScore(meal.nutrition),
        historyScore: calculateHistoryScore(meal, orderHistory)
    }))
    .sort((a,b) => {
        if (goal  === "personalized") {
            const scoreA = a.valueScore + a.historyScore;
            const scoreB = b.valueScore + b.historyScore;
            return scoreB - scoreA;
     }
        if (goal === "dietary") {
            return b.dietaryScore - a.dietaryScore;
        }
        return b.valueScore - a.valueScore;
    });
}