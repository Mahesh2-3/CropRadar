/**
 * Base32 Geohash Implementation
 * Used for geospatial indexing in Firestore to enable coarse spatial queries
 * before applying exact Haversine distance filtering.
 */

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export function encodeGeohash(latitude: number, longitude: number, precision: number = 6): string {
  let latMin = -90.0;
  let latMax = 90.0;
  let lonMin = -180.0;
  let lonMax = 180.0;

  let geohash = '';
  let bits = 0;
  let charIndex = 0;
  let isEven = true;

  while (geohash.length < precision) {
    if (isEven) {
      const mid = (lonMin + lonMax) / 2;
      if (longitude >= mid) {
        charIndex = (charIndex << 1) | 1;
        lonMin = mid;
      } else {
        charIndex = (charIndex << 1) | 0;
        lonMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (latitude >= mid) {
        charIndex = (charIndex << 1) | 1;
        latMin = mid;
      } else {
        charIndex = (charIndex << 1) | 0;
        latMax = mid;
      }
    }

    isEven = !isEven;
    bits++;

    if (bits === 5) {
      geohash += BASE32.charAt(charIndex);
      bits = 0;
      charIndex = 0;
    }
  }

  return geohash;
}

export function decodeGeohash(geohash: string): { latitude: number; longitude: number } {
  let latMin = -90.0;
  let latMax = 90.0;
  let lonMin = -180.0;
  let lonMax = 180.0;

  let isEven = true;

  for (let i = 0; i < geohash.length; i++) {
    const c = geohash[i];
    const cd = BASE32.indexOf(c);
    if (cd === -1) continue;

    for (let mask = 16; mask > 0; mask >>= 1) {
      if (isEven) {
        const mid = (lonMin + lonMax) / 2;
        if ((cd & mask) !== 0) {
          lonMin = mid;
        } else {
          lonMax = mid;
        }
      } else {
        const mid = (latMin + latMax) / 2;
        if ((cd & mask) !== 0) {
          latMin = mid;
        } else {
          latMax = mid;
        }
      }
      isEven = !isEven;
    }
  }

  return {
    latitude: (latMin + latMax) / 2,
    longitude: (lonMin + lonMax) / 2,
  };
}

/**
 * Returns the surrounding 8 neighbor geohashes plus the center geohash (total 9 cells)
 */
export function getGeohashNeighbors(latitude: number, longitude: number, precision: number = 6): string[] {
  // Approximate delta in degrees for precision 6 (~1.2km lat, ~0.6km lon)
  const latDelta = 0.01;
  const lonDelta = 0.01;

  const neighbors = new Set<string>();

  for (let dLat of [-latDelta, 0, latDelta]) {
    for (let dLon of [-lonDelta, 0, lonDelta]) {
      neighbors.add(encodeGeohash(latitude + dLat, longitude + dLon, precision));
    }
  }

  return Array.from(neighbors);
}
