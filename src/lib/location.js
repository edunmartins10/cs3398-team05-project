export const restaurantLocations = {
  "McDonald's": { latitude: 29.8826, longitude: -97.9414, label: 'San Marcos, TX' },
  'Taco Bell': { latitude: 29.9898, longitude: -97.8774, label: 'Kyle, TX' },
  "Wendy's": { latitude: 29.7032, longitude: -98.1243, label: 'New Braunfels, TX' },
  'Chick-fil-A': { latitude: 29.8824, longitude: -97.9436, label: 'San Marcos, TX' },
  Chipotle: { latitude: 30.2672, longitude: -97.7431, label: 'Austin, TX' },
  Whataburger: { latitude: 29.8835, longitude: -97.9283, label: 'San Marcos, TX' },
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
