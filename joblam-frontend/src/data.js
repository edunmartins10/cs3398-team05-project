// Sample menu data (placeholder prices/nutrition, same as the original demo)
export const sampleMenu = [
  ["McDonald's", "McDouble", 3.29, 400, 22],
  ["McDonald's", "McChicken", 2.99, 400, 14],
  ["McDonald's", "Small fries", 2.49, 230, 3],
  ["Taco Bell", "Bean burrito", 1.99, 360, 13],
  ["Taco Bell", "Cheesy bean & rice burrito", 1.49, 420, 9],
  ["Taco Bell", "Chicken quesadilla", 5.49, 510, 26],
  ["Wendy's", "Jr. bacon cheeseburger", 3.49, 370, 18],
  ["Wendy's", "Crispy chicken sandwich", 2.49, 330, 14],
  ["Wendy's", "Small chili", 3.29, 240, 16],
  ["Chick-fil-A", "Chicken sandwich", 5.49, 420, 29],
  ["Chick-fil-A", "8-count nuggets", 5.29, 250, 27],
  ["Chick-fil-A", "Medium waffle fries", 2.99, 420, 5],
  ["Chipotle", "Chicken burrito bowl", 9.25, 660, 45],
  ["Chipotle", "Veggie burrito bowl", 8.75, 620, 17],
  ["Whataburger", "Whataburger", 5.79, 590, 29],
  ["Whataburger", "Justaburger", 3.29, 310, 14],
  ["Whataburger", "Small fries", 2.39, 280, 3],
];

// Turns the raw list above into objects our components can use
export function buildMenu(raw) {
  return raw.map((x, i) => ({
    id: i,
    restaurant: x[0],
    name: x[1],
    price: Math.round(x[2] * 100), // store price in cents
    calories: x[3],
    protein: x[4],
    source: "sample",
  }));
}

export function money(cents) {
  return "$" + (cents / 100).toFixed(2);
}

// Builds every possible single item and 2-item combo that fits the budget/calories
export function buildOrders(items, budgetCents, minCalories, allowCombos) {
  const all = [];
  const add = (a, b) => {
    const price = a.price + (b?.price || 0);
    const calories = a.calories + (b?.calories || 0);
    const protein = a.protein + (b?.protein || 0);
    if (price <= budgetCents && calories >= minCalories) {
      all.push({
        restaurant: a.restaurant,
        name: b ? (a.id === b.id ? "2 × " + a.name : a.name + " + " + b.name) : a.name,
        price,
        calories,
        protein,
        source: a.source,
        cpd: calories / (price / 100), // calories per dollar
        ppd: protein / (price / 100),  // protein per dollar
      });
    }
  };
  items.forEach((a, i) => {
    add(a);
    if (allowCombos) {
      items.slice(i).forEach((b) => {
        if (a.restaurant === b.restaurant) add(a, b);
      });
    }
  });
  return all;
}

// Scores and sorts the orders based on what the user cares about
export function rankOrders(all, goal) {
  const maxCpd = Math.max(1, ...all.map((x) => x.cpd));
  const maxPpd = Math.max(1, ...all.map((x) => x.ppd));
  all.forEach((x) => {
    x.score =
      goal === "price"
        ? -x.price
        : goal === "protein"
        ? x.ppd
        : goal === "calories"
        ? x.cpd
        : 50 * (x.cpd / maxCpd + x.ppd / maxPpd);
  });
  return all.sort((a, b) => b.score - a.score || a.price - b.price || a.name.localeCompare(b.name));
}