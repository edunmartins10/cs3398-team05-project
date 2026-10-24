export function calculateDietaryScore(nutrition) {
  if (!nutrition) return null;

  const required = [
    'protein',
    'fiber',
    'carbs',
    'sodium',
    'fat',
    'calories'
  ];

  const complete = required.every(
    field =>
      typeof nutrition[field] === 'number' &&
      Number.isFinite(nutrition[field]) &&
      nutrition[field] >= 0
  );

  if (!complete) return null;

  return (
    nutrition.protein * 10 +
    nutrition.fiber * 10 +
    nutrition.carbs * 10 -
    nutrition.sodium / 1000 -
    nutrition.fat * 10 -
    nutrition.calories
  );
}