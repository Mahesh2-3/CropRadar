/**
 * High-Precision Haversine Spherical Distance Calculator
 * Calculates great-circle distance between two points on the Earth's surface in kilometers.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_KM = 6371.0088; // WGS84 mean earth radius

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = EARTH_RADIUS_KM * c;
  // Round to 2 decimal places (10-meter precision)
  return Math.round(distance * 100) / 100;
}

/**
 * Quantize / Fuzz coordinates to ~1km grid to preserve farmer privacy.
 */
export function fuzzCoordinatesToGrid(lat: number, lon: number): { latitude: number; longitude: number } {
  // 0.01 degrees latitude is ~1.11 km
  const fuzzedLat = Math.round(lat * 100) / 100;
  const fuzzedLon = Math.round(lon * 100) / 100;
  return { latitude: fuzzedLat, longitude: fuzzedLon };
}
