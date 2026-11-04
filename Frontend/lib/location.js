export const restaurantLocations = {
  "McDonald's": { latitude: 29.8826, longitude: -97.9414, label: 'San Marcos, TX' },
  "Taco Bell": { latitude: 29.8831, longitude: -97.9410, label: 'San Marcos, TX' },
  "Wendy's": { latitude: 29.8830, longitude: -97.9410, label: 'San Marcos, TX' },
  "Chick-fil-A": { latitude: 29.8824, longitude: -97.9436, label: 'San Marcos, TX' },
  Chipotle: { latitude: 29.8830, longitude: -97.9430, label: 'San Marcos, TX' },
  Whataburger: { latitude: 29.8835, longitude: -97.9283, label: 'San Marcos, TX' },
  "Raising Cane's": { latitude: 29.8788, longitude: -97.9360, label: 'San Marcos, TX' },
  "P. Terry's": { latitude: 29.8750, longitude: -97.9410, label: 'San Marcos, TX' },
  "In-N-Out Burger": { latitude: 29.8890, longitude: -97.9300, label: 'San Marcos, TX' },
  "Zaxby's": { latitude: 29.8750, longitude: -97.9350, label: 'San Marcos, TX' },
  "Shake Shack": { latitude: 29.8750, longitude: -97.9300, label: 'San Marcos, TX' },
  "Panera Bread": { latitude: 29.8750, longitude: -97.9260, label: 'San Marcos, TX' },
  Freebirds: { latitude: 29.8850, longitude: -97.9400, label: 'San Marcos, TX' },
  "Jersey Mike's": { latitude: 29.8750, longitude: -97.9300, label: 'San Marcos, TX' },
  "Hawaiian Bros": { latitude: 29.8850, longitude: -97.9350, label: 'San Marcos, TX' },
  "Bush's Chicken": { latitude: 29.8850, longitude: -97.9400, label: 'San Marcos, TX' },
  "Earth Burger": { latitude: 29.8750, longitude: -97.9300, label: 'San Marcos, TX' },
  "True Texas BBQ": { latitude: 29.8705, longitude: -97.9220, label: 'San Marcos, TX' },
  "Buddy's Burger": { latitude: 29.8850, longitude: -97.9400, label: 'San Marcos, TX' },
  Fresco: { latitude: 29.8850, longitude: -97.9400, label: 'San Marcos, TX' },
  "Slim Chickens": { latitude: 29.8700, longitude: -97.9250, label: 'San Marcos, TX' },
  "Gumby's Pizza": { latitude: 29.8880, longitude: -97.9400, label: 'San Marcos, TX' },
  "The Pita Shop": { latitude: 29.8890, longitude: -97.9400, label: 'San Marcos, TX' },
  "Palmer's Restaurant Bar & Courtyard": { latitude: 29.8830, longitude: -97.9410, label: 'San Marcos, TX' },
  "The Root Cellar Cafe": { latitude: 29.8830, longitude: -97.9410, label: 'San Marcos, TX' },
  Industry: { latitude: 29.8830, longitude: -97.9410, label: 'San Marcos, TX' },
};

export function distanceMiles(from, to) {
  if (!from || !to || !Number.isFinite(from.latitude) || !Number.isFinite(from.longitude)) return null;
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = radians(to.latitude - from.latitude);
  const dLon = radians(to.longitude - from.longitude);
  const lat1 = radians(from.latitude);
  const lat2 = radians(to.latitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function restaurantDistance(name, profile) {
  const location = restaurantLocations[name];
  if (!location || !profile?.latitude || !profile?.longitude) return null;
  return distanceMiles({ latitude: profile.latitude, longitude: profile.longitude }, location);
}

export function radiusLimit(profile) {
  if (!profile?.limitRecommendations) return Infinity;
  if (profile.radiusMiles === 'infinity') return Infinity;
  const value = Number(profile.radiusMiles);
  return Number.isFinite(value) ? value : 5;
}
