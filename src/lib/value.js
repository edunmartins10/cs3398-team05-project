export const money = (cents) => '$' + (cents / 100).toFixed(2);

export function restaurantNames(menu) {
  return [...new Set(menu.map((x) => x.restaurant))];
}

export function orders(items, budget, min, combos) {
  const all = [];
  const add = (a, b) => {
    const price = a.price + (b?.price || 0);
    const calories = a.calories + (b?.calories || 0);
    const protein = a.protein + (b?.protein || 0);
    if (price <= budget && calories >= min) {
      all.push({
        restaurant: a.restaurant,
        name: b ? (a.id === b.id ? '2 × ' + a.name : a.name + ' + ' + b.name) : a.name,
        price,
        calories,
        protein,
        source: a.source,
        cpd: calories / (price / 100),
        ppd: protein / (price / 100),
      });
    }
  };
  items.forEach((a, i) => {
    add(a);
    if (combos) {
      items.slice(i).forEach((b) => {
        if (a.restaurant === b.restaurant) add(a, b);
      });
    }
  });
  return all;
}

export function rank(all, goal) {
  const mc = Math.max(1, ...all.map((x) => x.cpd));
  const mp = Math.max(1, ...all.map((x) => x.ppd));
  all.forEach((x) => {
    x.score =
      goal === 'price'
        ? -x.price
        : goal === 'protein'
          ? x.ppd
          : goal === 'calories'
            ? x.cpd
            : 50 * (x.cpd / mc + x.ppd / mp);
  });
  return all.sort((a, b) => b.score - a.score || a.price - b.price || a.name.localeCompare(b.name));
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
    return { id: start + i, restaurant, name: p[0], price, calories, protein, source: 'custom' };
  });
}

export function rankedOrders(menu, selected, budgetDollars, minimum, combos, goal) {
  const raw = Number(budgetDollars);
  const budget = Number.isFinite(raw) ? Math.max(0, Math.round(raw * 100)) : 0;
  const items = menu.filter((x) => selected.has(x.restaurant));
  return rank(orders(items, budget, Number(minimum), combos), goal);
}

export function ratioLabel(x, goal) {
  if (goal === 'protein') return x.ppd.toFixed(1) + 'g protein / $';
  if (goal === 'calories') return Math.round(x.cpd) + ' cal / $';
  if (goal === 'price') return money(x.price) + ' total';
  return Math.round(x.score) + '/100 value score';
}

export const WINNER_LABELS = {
  balanced: 'BEST BALANCED VALUE',
  protein: 'MOST PROTEIN PER DOLLAR',
  calories: 'MOST CALORIES PER DOLLAR',
  price: 'LOWEST PRICE',
};

export function winnerMetric(w, goal) {
  if (goal === 'protein') return { value: w.ppd.toFixed(1) + 'g', label: 'protein per dollar' };
  if (goal === 'calories') return { value: Math.round(w.cpd), label: 'calories per dollar' };
  if (goal === 'price') return { value: money(w.price), label: 'order total' };
  return { value: Math.round(w.score) + '/100', label: 'balanced value score' };
}
