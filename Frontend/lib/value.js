import { calculateDietaryScore } from './dietaryScore.js';
import {getMealRole} from './mealRoles.js';

export const money = (cents) => '$' + (cents / 100).toFixed(2);

export function restaurantNames(menu) {
  return [...new Set(menu.map((x) => x.restaurant))];
}

export function orders(items, budget, min, combos) {
  const all = [];
  const add = (mealItems) => {
    const price = mealItems.reduce((sum, item) => sum + item.price, 0);
    const calories = mealItems.reduce((sum, item) => sum + item.calories, 0);
    const protein = mealItems.reduce((sum, item) => sum + item.protein, 0);
    const combineNutrient = (field) => {
  if (mealItems.some((item) => item[field] == null)) {
    return null;
  }
  return mealItems.reduce((sum, item) => sum + item[field], 0);
};

const carbs = combineNutrient('carbs');
const fat = combineNutrient('fat');
const fiber = combineNutrient('fiber');
const sodium = combineNutrient('sodium');
    if (price <= budget && calories >= min) {
      all.push({
        restaurant: mealItems[0].restaurant,
        name: mealItems.map((item) => item.name).join(' + '),
        items: mealItems.map((item) => ({
          name: item.name,
          price: item.price,
          calories: item.calories,
          protein: item.protein,
        })),
        price,
        calories,
        protein,
        carbs,
        fat,
        fiber,
        sodium,
        source: mealItems[0].source,
        budgetUtilization: budget > 0 ? price / budget : 0,
        cpd: calories / (price / 100),
        ppd: protein / (price / 100),
      });
    }
  };

  const restaurants = new Map();
  items.forEach((item) => {
    if (!restaurants.has(item.restaurant)) {
      restaurants.set(item.restaurant, []);
    }
    restaurants.get(item.restaurant).push(item);
  });

  for (const restaurantItems of restaurants.values()) {
  const mains = [];
  const sides = [];
  const drinks = [];
  const addons = [];

  restaurantItems.forEach((item) => {
    const role = getMealRole(item);

    if (role === 'main') {
      mains.push(item);
    } else if (role === 'side') {
      sides.push(item);
    } else if (role === 'drink') {
      drinks.push(item);
    } else if (role === 'addon') {
      addons.push(item);
    }
  });

  for(const main of mains) {
    if(main.price <= 0 || main.price > budget) {
      continue;
    }

    add([main]);
    if(combos){

      // Main + side
for (const side of sides) {
  if (side.price <= 0 || main.price + side.price > budget) {
    continue;
  }

  add([main, side]);

  // Main + side + drink
  for (const drink of drinks) {
    const totalPrice = main.price + side.price + drink.price;

    if (drink.price > 0 && totalPrice <= budget) {
      add([main, side, drink]);
    }
  }
}

// Main + drink (when a side isn't selected)
for (const drink of drinks) {
  if (drink.price > 0 && main.price + drink.price <= budget) {
    add([main, drink]);
  }
}

// Prioritized duplicate: second main item
if (main.price * 2 <= budget) {
  add([main, main]);

  for (const side of sides) {
    const totalPrice = main.price * 2 + side.price;

    if (side.price <= 0 || totalPrice > budget) {
      continue;
    }

    add([main, main, side]);

    for (const drink of drinks) {
      if (drink.price > 0 && totalPrice + drink.price <= budget) {
        add([main, main, side, drink]);
      }
    }
  }

  for (const drink of drinks) {
    if (drink.price > 0 && main.price * 2 + drink.price <= budget) {
      add([main, main, drink]);
    }
  }
}

    }
  }
}


if (combos) {
  const existingMeals = [...all];

  for (const meal of existingMeals) {
    const restaurantItems = restaurants.get(meal.restaurant) || [];

    const addons = restaurantItems.filter(
      (item) => getMealRole(item) === 'addon'
    );

    for (const addon of addons) {
      if (addon.price > 0 && meal.price + addon.price <= budget) {
        const originalItems = meal.items.map((entry) =>
          restaurantItems.find((item) => item.name === entry.name)
        );

        if (originalItems.every(Boolean)) {
          add([...originalItems, addon]);
        }
      }
    }
  }
}


  return all;
}

export function historyScore(order, orderHistory = []) {
  let score = 0;

  for (const previous of orderHistory) {
    if (order.restaurant === previous.restaurantName) {
      score += 5;
    }

    if (order.name === previous.mealName) {
      score += 15;
    }
  }

  return Math.min(score, 60);
}

export function rank(all, goal, orderHistory = []) {
  const mc = Math.max(1, ...all.map((x) => x.cpd));
  const mp = Math.max(1, ...all.map((x) => x.ppd));

  all.forEach((x) => {
    const baseScore = 50 * (x.cpd / mc + x.ppd / mp);

    const dietaryScore = calculateDietaryScore({
      calories: x.calories,
      protein: x.protein,
      carbs: x.carbs,
      fat: x.fat,
      fiber: x.fiber,
      sodium: x.sodium
    });

    x.score =
      goal === 'personalized'
        ? baseScore + historyScore(x, orderHistory)
        : goal === 'dietary'
          ? dietaryScore ?? -Infinity
            : goal === 'protein'
              ? x.ppd
              : goal === 'calories'
                ? x.cpd
                : baseScore;
  });

  const eligible = goal === 'dietary'
  ? all.filter((x) => Number.isFinite(x.score))
  : all;

return eligible.sort(
  (a, b) => b.score - a.score || b.budgetUtilization - a.budgetUtilization || a.name.localeCompare(b.name)
);
}

export function parseMenu(text, restaurant, start) {
  const lines = text.split('\n').map((x) => x.trim()).filter(Boolean);
  if (!lines.length) throw Error('Add at least one menu item.');
  if (lines.length > 100) throw Error('Please analyze up to 100 items at a time.');
  return lines.map((line, i) => {
    const p = line.split('|').map((x) => x.trim());
    if (
      p.length !== 4 ||
      !p[0] ||
      !/^\$?\d+(\.\d{1,2})?$/.test(p[1]) ||
      !/^\d+(\.\d+)?$/.test(p[2]) ||
      !/^\d+(\.\d+)?$/.test(p[3])
    ) {
      throw Error('Line ' + (i + 1) + ': use Name | 5.49 | 460 | 28 (all four fields are required).');
    }
    const price = Math.round(Number(p[1].replace('$', '')) * 100);
    const calories = Number(p[2]);
    const protein = Number(p[3]);
    if (price <= 0 || price > 100000 || calories > 10000 || protein > 1000 || p[0].length > 150) {
      throw Error('Line ' + (i + 1) + ': check the price, nutrition, or item-name length.');
    }
    return { id: start + i, restaurant, name: p[0], price, calories, protein, allergens: [], source: 'custom' };
  });
}

function itemMatchesRestrictions(item, selectedAllergens = []) {
  if (!selectedAllergens.length) return true;
  const allergens = new Set(item.allergens || []);
  return !selectedAllergens.some((restriction) => {
    if (restriction === 'lactose') return allergens.has('dairy');
    if (restriction === 'vegetarian') return allergens.has('red-meat') || allergens.has('fish') || allergens.has('shellfish');
    if (restriction === 'vegan') return allergens.has('dairy') || allergens.has('egg') || allergens.has('red-meat') || allergens.has('fish') || allergens.has('shellfish');
    return allergens.has(restriction);
  });
}

export function rankedOrders(menu, selected, budgetDollars, minimum, combos, goal, selectedAllergens = []) {
  const raw = Number(budgetDollars);
  const budget = Number.isFinite(raw) ? Math.max(0, Math.round(raw * 100)) : 0;
  const items = menu
    .filter((x) => selected.has(x.restaurant))
    .filter((x) => itemMatchesRestrictions(x, selectedAllergens));
  return rank(orders(items, budget, Number(minimum), combos), goal);
}

export function ratioLabel(x, goal) {
  if (goal === 'protein') return x.ppd.toFixed(1) + 'g protein / $';
  if (goal === 'calories') return Math.round(x.cpd) + ' cal / $';
  if (goal === 'personalized') {
  return Math.round(x.score) + ' personalized score';
}
  return Math.round(x.score) + '/100 value score';
}

export const WINNER_LABELS = {
  balanced: 'BEST BALANCED VALUE',
  protein: 'MOST PROTEIN PER DOLLAR',
  calories: 'MOST CALORIES PER DOLLAR',
  personalized: 'RECOMMENDED FOR YOU',
  dietary: 'BEST DIETARY SCORE',
};

export function winnerMetric(w, goal) {
  if (goal === 'dietary') {
  return {
    value: Number(w.score).toFixed(1),
    label: 'dietary score'
  };
}

  if (goal === 'protein') return { value: w.ppd.toFixed(1) + 'g', label: 'protein per dollar' };
  if (goal === 'calories') return { value: Math.round(w.cpd), label: 'calories per dollar' };
  if (goal === 'personalized') {
  return {
    value: Math.round(w.score),
    label: 'personalized score'
  };
}
  return { value: Math.round(w.score) + '/100', label: 'balanced value score' };
}
