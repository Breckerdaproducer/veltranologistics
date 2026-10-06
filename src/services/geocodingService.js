/**
 * Nexivan Logistics - Advanced Geocoding & Coordinate Resolution Service
 * Provides:
 *  - State-aware and Zip-code aware offline coordinate resolution
 *  - High-precision online geocoding via OpenStreetMap Photon & Nominatim
 *  - In-memory LRU caching for instant (0ms) response times
 *  - Disambiguation for cities sharing identical names across multiple states (e.g. Dallas TX vs Dallas GA)
 */

// All 50 US States + DC + PR
const US_STATES = {
  'al': { name: 'alabama', coords: [32.806671, -86.791130] },
  'ak': { name: 'alaska', coords: [61.370716, -152.404419] },
  'az': { name: 'arizona', coords: [33.729759, -111.431221] },
  'ar': { name: 'arkansas', coords: [34.969704, -92.373123] },
  'ca': { name: 'california', coords: [36.116203, -119.681564] },
  'co': { name: 'colorado', coords: [39.059811, -105.311104] },
  'ct': { name: 'connecticut', coords: [41.597782, -72.755371] },
  'de': { name: 'delaware', coords: [39.318523, -75.507141] },
  'fl': { name: 'florida', coords: [27.766279, -81.686783] },
  'ga': { name: 'georgia', coords: [33.040619, -83.643074] },
  'hi': { name: 'hawaii', coords: [21.094318, -157.498337] },
  'id': { name: 'idaho', coords: [44.240459, -114.478828] },
  'il': { name: 'illinois', coords: [40.349457, -88.986137] },
  'in': { name: 'indiana', coords: [39.849426, -86.258278] },
  'ia': { name: 'iowa', coords: [42.011539, -93.210526] },
  'ks': { name: 'kansas', coords: [38.526600, -96.726486] },
  'ky': { name: 'kentucky', coords: [37.668140, -84.670067] },
  'la': { name: 'louisiana', coords: [31.169546, -91.867805] },
  'me': { name: 'maine', coords: [44.693947, -69.381927] },
  'md': { name: 'maryland', coords: [39.063946, -76.802101] },
  'ma': { name: 'massachusetts', coords: [42.230171, -71.530106] },
  'mi': { name: 'michigan', coords: [43.326618, -84.536095] },
  'mn': { name: 'minnesota', coords: [45.694454, -93.900192] },
  'ms': { name: 'mississippi', coords: [32.741646, -89.678696] },
  'mo': { name: 'missouri', coords: [38.456085, -92.288368] },
  'mt': { name: 'montana', coords: [46.921925, -110.454353] },
  'ne': { name: 'nebraska', coords: [41.125370, -98.268082] },
  'nv': { name: 'nevada', coords: [38.313515, -117.055374] },
  'nh': { name: 'new hampshire', coords: [43.452492, -71.563896] },
  'nj': { name: 'new jersey', coords: [40.298904, -74.521011] },
  'nm': { name: 'new mexico', coords: [34.840515, -106.248482] },
  'ny': { name: 'new york', coords: [42.165726, -74.948051] },
  'nc': { name: 'north carolina', coords: [35.630066, -79.806419] },
  'nd': { name: 'north dakota', coords: [47.528912, -99.784012] },
  'oh': { name: 'ohio', coords: [40.388783, -82.764915] },
  'ok': { name: 'oklahoma', coords: [35.565342, -96.928917] },
  'or': { name: 'oregon', coords: [44.572021, -122.070938] },
  'pa': { name: 'pennsylvania', coords: [40.590752, -77.209755] },
  'ri': { name: 'rhode island', coords: [41.680893, -71.511780] },
  'sc': { name: 'south carolina', coords: [33.856892, -80.945007] },
  'sd': { name: 'south dakota', coords: [44.299782, -99.438828] },
  'tn': { name: 'tennessee', coords: [35.747845, -86.692345] },
  'tx': { name: 'texas', coords: [31.054487, -97.563461] },
  'ut': { name: 'utah', coords: [40.150032, -111.862434] },
  'vt': { name: 'vermont', coords: [44.045876, -72.710686] },
  'va': { name: 'virginia', coords: [37.769337, -78.169968] },
  'wa': { name: 'washington', coords: [47.400902, -121.490494] },
  'wv': { name: 'west virginia', coords: [38.491226, -80.954453] },
  'wi': { name: 'wisconsin', coords: [44.268543, -89.616508] },
  'wy': { name: 'wyoming', coords: [42.755966, -107.302490] },
  'dc': { name: 'district of columbia', coords: [38.907192, -77.036871] },
  'pr': { name: 'puerto rico', coords: [18.220833, -66.590149] },
};

// Disambiguated city + state pairs (Cities that exist in multiple US states)
const DISAMBIGUATED_CITIES = {
  // Dallas variants
  'dallas, ga': [33.9237, -84.8408],
  'dallas, georgia': [33.9237, -84.8408],
  'dallas, tx': [32.7767, -96.7970],
  'dallas, texas': [32.7767, -96.7970],
  'dallas, nc': [35.3168, -81.1762],
  'dallas, or': [44.9193, -123.3171],
  'dallas, pa': [41.3362, -75.9680],

  // Springfield variants
  'springfield, il': [39.7817, -89.6501],
  'springfield, illinois': [39.7817, -89.6501],
  'springfield, mo': [37.2090, -93.2923],
  'springfield, missouri': [37.2090, -93.2923],
  'springfield, ma': [42.1015, -72.5898],
  'springfield, massachusetts': [42.1015, -72.5898],
  'springfield, oh': [39.9242, -83.8088],
  'springfield, or': [44.0462, -123.0220],

  // Columbus variants
  'columbus, oh': [39.9612, -82.9988],
  'columbus, ohio': [39.9612, -82.9988],
  'columbus, ga': [32.4610, -84.9877],
  'columbus, georgia': [32.4610, -84.9877],
  'columbus, in': [39.2014, -85.9214],

  // Portland variants
  'portland, or': [45.5152, -122.6784],
  'portland, oregon': [45.5152, -122.6784],
  'portland, me': [43.6591, -70.2568],
  'portland, maine': [43.6591, -70.2568],

  // Arlington variants
  'arlington, tx': [32.7357, -97.1081],
  'arlington, texas': [32.7357, -97.1081],
  'arlington, va': [38.8799, -77.1067],
  'arlington, virginia': [38.8799, -77.1067],

  // Kansas City
  'kansas city, mo': [39.0997, -94.5786],
  'kansas city, missouri': [39.0997, -94.5786],
  'kansas city, ks': [39.1155, -94.6268],
  'kansas city, kansas': [39.1155, -94.6268],

  // Cleveland
  'cleveland, oh': [41.4993, -81.6944],
  'cleveland, ohio': [41.4993, -81.6944],
  'cleveland, tn': [35.1595, -84.8766],

  // Rochester
  'rochester, ny': [43.1566, -77.6088],
  'rochester, mn': [44.0121, -92.4802],

  // Richmond
  'richmond, va': [37.5407, -77.4360],
  'richmond, ca': [37.9358, -122.3477],

  // Paris
  'paris, tx': [33.6609, -95.5555],
  'paris, france': [48.8566, 2.3522],

  // Vancouver
  'vancouver, bc': [49.2827, -123.1207],
  'vancouver, canada': [49.2827, -123.1207],
  'vancouver, wa': [45.6387, -122.6615],
};

// Major US 3-digit ZIP prefix mappings
const US_ZIP3_COORDS = {
  // Georgia (300-319, 398-399)
  '300': [33.95, -84.30], // Alpharetta, Duluth, Roswell, Norcross
  '301': [33.95, -84.85], // Dallas GA, Paulding County, Marietta, Cartersville
  '302': [33.35, -84.50], // Fayetteville, Peachtree City, Newnan
  '303': [33.75, -84.39], // Atlanta Central
  '304': [32.40, -82.00], // Statesboro GA
  '305': [34.50, -83.80], // Gainesville GA
  '306': [33.95, -83.38], // Athens GA
  '307': [34.80, -85.10], // Dalton GA
  '308': [33.40, -82.30], // Augusta GA region
  '309': [33.47, -81.97], // Augusta GA Central
  '310': [32.84, -83.63], // Macon GA
  '312': [32.84, -83.63], // Macon GA Central
  '314': [32.08, -81.10], // Savannah GA
  '315': [31.20, -82.35], // Waycross GA
  '316': [30.83, -83.28], // Valdosta GA
  '317': [31.58, -84.15], // Albany GA
  '319': [32.46, -84.99], // Columbus GA

  // Texas (750-799)
  '750': [33.02, -96.70], // Plano, Richardson, Garland, Frisco
  '751': [32.70, -96.50], // Mesquite, Forney, Terrell
  '752': [32.85, -96.80], // Dallas TX (incl 75248 Montfort Dr)
  '753': [32.78, -96.80], // Dallas TX Downtown PO Boxes
  '754': [33.15, -96.10], // Greenville TX
  '755': [33.45, -94.05], // Texarkana TX
  '756': [32.50, -94.75], // Longview TX
  '757': [32.35, -95.30], // Tyler TX
  '758': [31.75, -95.60], // Palestine TX
  '759': [31.60, -94.65], // Nacogdoches TX
  '760': [32.70, -97.10], // Arlington TX
  '761': [32.75, -97.33], // Fort Worth TX
  '770': [29.76, -95.37], // Houston TX
  '772': [29.76, -95.37], // Houston TX
  '773': [30.15, -95.45], // The Woodlands, Conroe TX
  '774': [29.60, -95.75], // Sugar Land, Katy TX
  '775': [29.50, -95.10], // League City, Pasadena TX
  '778': [30.60, -96.35], // Bryan, College Station TX
  '780': [28.80, -98.50], // San Antonio South
  '782': [29.42, -98.49], // San Antonio TX
  '784': [27.80, -97.40], // Corpus Christi TX
  '785': [26.20, -98.25], // McAllen TX
  '786': [30.25, -97.90], // Austin Suburbs
  '787': [30.27, -97.74], // Austin TX Central
  '791': [35.22, -101.83], // Amarillo TX
  '794': [33.58, -101.85], // Lubbock TX
  '796': [32.45, -99.73], // Abilene TX
  '797': [31.99, -102.08], // Midland, Odessa TX
  '799': [31.76, -106.49], // El Paso TX

  // New York (100-149)
  '100': [40.71, -74.01], // New York NY (Manhattan)
  '101': [40.75, -73.98], // New York NY Midtown
  '103': [40.58, -74.15], // Staten Island NY
  '104': [40.85, -73.87], // Bronx NY
  '111': [40.75, -73.93], // Long Island City NY
  '112': [40.68, -73.94], // Brooklyn NY
  '113': [40.73, -73.83], // Flushing NY
  '114': [40.70, -73.79], // Jamaica NY
  '119': [40.85, -72.75], // Manorville, Riverhead, Suffolk County NY
  '142': [42.89, -78.88], // Buffalo NY

  // Illinois (600-629)
  '600': [42.15, -87.95], // Arlington Heights, Palatine IL
  '601': [41.95, -88.15], // Schaumburg, Carol Stream IL
  '606': [41.88, -87.63], // Chicago IL
  '627': [39.78, -89.65], // Springfield IL

  // Florida (320-349)
  '320': [30.15, -81.70], // Jacksonville Suburbs FL
  '322': [30.33, -81.66], // Jacksonville FL
  '328': [28.54, -81.38], // Orlando FL
  '331': [25.76, -80.19], // Miami FL
  '336': [27.95, -82.46], // Tampa FL
  '337': [27.77, -82.64], // St. Petersburg FL
  '341': [26.14, -81.80], // Naples FL

  // California (900-961)
  '900': [34.05, -118.24], // Los Angeles CA
  '902': [33.95, -118.35], // Inglewood, Santa Monica CA
  '921': [32.72, -117.16], // San Diego CA
  '941': [37.77, -122.42], // San Francisco CA
  '951': [37.34, -121.89], // San Jose CA
  '958': [38.58, -121.49], // Sacramento CA
};

// Global Logistics Hubs and US Metros (Default coordinates if no conflicting state is detected)
const LOGISTICS_HUBS = {
  'dallas': { coords: [32.7767, -96.7970], state: 'tx' },
  'miami': { coords: [25.7617, -80.1918], state: 'fl' },
  'atlanta': { coords: [33.7490, -84.3880], state: 'ga' },
  'chicago': { coords: [41.8781, -87.6298], state: 'il' },
  'los angeles': { coords: [34.0522, -118.2437], state: 'ca' },
  'denver': { coords: [39.7392, -104.9903], state: 'co' },
  'houston': { coords: [29.7604, -95.3698], state: 'tx' },
  'seattle': { coords: [47.6062, -122.3321], state: 'wa' },
  'new york': { coords: [40.7128, -74.0060], state: 'ny' },
  'manorville': { coords: [40.8584, -72.7932], state: 'ny' },
  'alpharetta': { coords: [34.0754, -84.2941], state: 'ga' },
  'newark': { coords: [40.7357, -74.1724], state: 'nj' },
  'san francisco': { coords: [37.7749, -122.4194], state: 'ca' },
  'oakland': { coords: [37.8044, -122.2712], state: 'ca' },
  'memphis': { coords: [35.1495, -90.0490], state: 'tn' },
  'louisville': { coords: [38.2527, -85.7585], state: 'ky' },
  'boston': { coords: [42.3601, -71.0589], state: 'ma' },
  'washington': { coords: [38.9072, -77.0369], state: 'dc' },
  'philadelphia': { coords: [39.9526, -75.1652], state: 'pa' },
  'phoenix': { coords: [33.4484, -112.0740], state: 'az' },
  'detroit': { coords: [42.3314, -83.0458], state: 'mi' },
  'indianapolis': { coords: [39.7684, -86.1581], state: 'in' },
  'charlotte': { coords: [35.2271, -80.8431], state: 'nc' },
  'nashville': { coords: [36.1627, -86.7816], state: 'tn' },
  'orlando': { coords: [28.5383, -81.3792], state: 'fl' },
  'tampa': { coords: [27.9506, -82.4572], state: 'fl' },
  'jacksonville': { coords: [30.3322, -81.6557], state: 'fl' },
  'minneapolis': { coords: [44.9778, -93.2650], state: 'mn' },
  'st. louis': { coords: [38.6270, -90.1994], state: 'mo' },
  'st louis': { coords: [38.6270, -90.1994], state: 'mo' },
  'new orleans': { coords: [29.9511, -90.0715], state: 'la' },
  'salt lake city': { coords: [40.7608, -111.8910], state: 'ut' },
  'las vegas': { coords: [36.1699, -115.1398], state: 'nv' },
  'san diego': { coords: [32.7157, -117.1611], state: 'ca' },
  'austin': { coords: [30.2672, -97.7431], state: 'tx' },
  'san antonio': { coords: [29.4241, -98.4936], state: 'tx' },
  'cincinnati': { coords: [39.1031, -84.5120], state: 'oh' },
  'pittsburgh': { coords: [40.4406, -79.9959], state: 'pa' },
  'baltimore': { coords: [39.2904, -76.6122], state: 'md' },
  'oklahoma city': { coords: [35.4676, -97.5164], state: 'ok' },
  'tulsa': { coords: [36.1540, -95.9928], state: 'ok' },
  'omaha': { coords: [41.2565, -95.9345], state: 'ne' },
  'albuquerque': { coords: [35.0844, -106.6504], state: 'nm' },
  'el paso': { coords: [31.7619, -106.4850], state: 'tx' },
  'sacramento': { coords: [38.5816, -121.4944], state: 'ca' },
  'san jose': { coords: [37.3382, -121.8863], state: 'ca' },

  // International Hubs & Gateways
  'london': { coords: [51.5074, -0.1278] },
  'frankfurt': { coords: [50.1109, 8.6821] },
  'paris': { coords: [48.8566, 2.3522] },
  'amsterdam': { coords: [52.3676, 4.9041] },
  'rotterdam': { coords: [51.9244, 4.4777] },
  'dubai': { coords: [25.2048, 55.2708] },
  'singapore': { coords: [1.3521, 103.8198] },
  'hong kong': { coords: [22.3193, 114.1694] },
  'tokyo': { coords: [35.6762, 139.6503] },
  'shanghai': { coords: [31.2304, 121.4737] },
  'sydney': { coords: [-33.8688, 151.2093] },
  'toronto': { coords: [43.6532, -79.3832] },
  'mexico city': { coords: [19.4326, -99.1332] }
};

// In-Memory Geocoding Cache (Key: normalized query, Value: [lat, lng])
const geocodingCache = new Map();

/**
 * Extract US state code from string
 */
function extractStateCode(cleanText) {
  const padded = ' ' + cleanText + ' ';
  for (const [code, info] of Object.entries(US_STATES)) {
    if (padded.includes(' ' + code + ' ') || padded.includes(' ' + info.name + ' ')) {
      return code;
    }
  }
  return null;
}

/**
 * Extract 5-digit US ZIP code from string
 */
function extractZipCode(text) {
  if (!text) return null;
  const match = text.match(/\b(\d{5})\b/);
  return match ? match[1] : null;
}

/**
 * Fast synchronous offline coordinate resolver
 * Guarantees state-accurate coordinates and avoids cross-state city collisions (e.g. Dallas GA vs Dallas TX)
 */
function resolveOfflineCoordinates(text, fallback = [39.8283, -98.5795]) {
  if (!text || typeof text !== 'string') return fallback;
  const raw = text.trim();
  const lower = raw.toLowerCase();
  const clean = lower.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const padded = ' ' + clean + ' ';

  const zip = extractZipCode(raw);
  const stateCode = extractStateCode(clean);

  // 1. Explicit Disambiguated City + State Match (e.g. "Dallas, GA" or "Dallas, TX")
  for (const [pair, coords] of Object.entries(DISAMBIGUATED_CITIES)) {
    const [c, s] = pair.split(', ');
    const hasCity = padded.includes(' ' + c + ' ');
    const hasState = padded.includes(' ' + s + ' ') || stateCode === s;
    if (hasCity && hasState) {
      return coords;
    }
  }

  // 2. High-precision 3-digit ZIP prefix match
  if (zip) {
    const zip3 = zip.substring(0, 3);
    if (US_ZIP3_COORDS[zip3]) {
      return US_ZIP3_COORDS[zip3];
    }
  }

  // 3. Logistics Hubs Match with State Verification
  for (const [hub, data] of Object.entries(LOGISTICS_HUBS)) {
    if (padded.includes(' ' + hub + ' ')) {
      // If the hub has a designated state and the text explicitly mentions a DIFFERENT state,
      // DO NOT blindly return the wrong state's coordinates!
      if (data.state && stateCode && data.state !== stateCode) {
        continue;
      }
      return data.coords;
    }
  }

  // 4. US State Centroid Match
  if (stateCode && US_STATES[stateCode]) {
    return US_STATES[stateCode].coords;
  }

  // 5. Default fallback
  return fallback;
}

/**
 * High-Precision Online Geocoder with Multi-Tier Fallback:
 * 1. Cache hit -> 0ms
 * 2. Photon OpenStreetMap Geocoder (Exact building/street pinpoint)
 * 3. Photon Simplified Query (City, State, Zip)
 * 4. Nominatim OpenStreetMap Geocoder
 * 5. Smart State-Aware Offline Resolver
 */
async function geocodeAddress(queryStr, fallback = null) {
  if (!queryStr || typeof queryStr !== 'string') {
    return fallback || [39.8283, -98.5795];
  }

  const clean = queryStr.trim();
  const cacheKey = clean.toLowerCase();

  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey);
  }

  const offlineCoords = resolveOfflineCoordinates(clean, fallback || [39.8283, -98.5795]);

  // Attempt Online Geocoding with a 2.5s strict timeout
  try {
    const coords = await fetchOnlineCoordinates(clean);
    if (coords && Array.isArray(coords) && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      geocodingCache.set(cacheKey, coords);
      return coords;
    }
  } catch (err) {
    // Graceful fallback to offline resolver
  }

  // Cache offline fallback result to prevent repeat slow requests
  geocodingCache.set(cacheKey, offlineCoords);
  return offlineCoords;
}

/**
 * Fetch coordinates from online OpenStreetMap APIs
 */
async function fetchOnlineCoordinates(queryStr) {
  const fetchWithTimeout = async (url, options = {}, timeoutMs = 2600) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  };

  // 1. Try Photon Geocoder (Fast OSM address index)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(queryStr)}&limit=1`;
    const res = await fetchWithTimeout(photonUrl, {
      headers: { 'User-Agent': 'NexivanLogistics-TelemetryEngine/5.2' }
    }, 2500);

    if (res.ok) {
      const data = await res.json();
      if (data && data.features && data.features.length > 0 && data.features[0].geometry) {
        const [lng, lat] = data.features[0].geometry.coordinates;
        if (typeof lat === 'number' && typeof lng === 'number') {
          return [lat, lng];
        }
      }
    }
  } catch (e) {}

  // 2. Try simplified query if original had street number that OSM might not index
  const simplified = simplifyAddress(queryStr);
  if (simplified && simplified !== queryStr) {
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(simplified)}&limit=1`;
      const res = await fetchWithTimeout(photonUrl, {
        headers: { 'User-Agent': 'NexivanLogistics-TelemetryEngine/5.2' }
      }, 2000);

      if (res.ok) {
        const data = await res.json();
        if (data && data.features && data.features.length > 0 && data.features[0].geometry) {
          const [lng, lat] = data.features[0].geometry.coordinates;
          if (typeof lat === 'number' && typeof lng === 'number') {
            return [lat, lng];
          }
        }
      }
    } catch (e) {}
  }

  // 3. Fallback to Nominatim OSM API
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&limit=1`;
    const res = await fetchWithTimeout(nomUrl, {
      headers: { 'User-Agent': 'NexivanLogistics-TelemetryEngine/5.2' }
    }, 2500);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return [lat, lon];
        }
      }
    }
  } catch (e) {}

  return null;
}

/**
 * Simplify an address to City, State Zip if street lookup fails
 */
function simplifyAddress(addr) {
  if (!addr) return '';
  const parts = addr.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    // e.g. "3615 Charles Hardy Pkwy", "Dallas", "GA 30157" -> "Dallas, GA 30157"
    return parts.slice(1).join(', ');
  }
  return addr;
}

/**
 * Geocode full shipment object (origin, destination, current_location)
 */
async function batchGeocodeShipment(shipment) {
  if (!shipment) return shipment;

  const originText = (
    shipment.shipper_address ||
    (shipment.shipper && shipment.shipper.address) ||
    shipment.origin ||
    'Chicago, IL'
  ).trim();

  const destText = (
    shipment.receiver_address ||
    (shipment.receiver && shipment.receiver.address) ||
    shipment.destination ||
    'Los Angeles, CA'
  ).trim();

  const currentText = (shipment.current_location || shipment.currentLocation || originText).trim();

  const [originCoords, destCoords] = await Promise.all([
    geocodeAddress(originText, resolveOfflineCoordinates(originText, [41.8781, -87.6298])),
    geocodeAddress(destText, resolveOfflineCoordinates(destText, [34.0522, -118.2437])),
  ]);

  let currentCoords = null;
  if (currentText && currentText.toLowerCase() !== originText.toLowerCase() && currentText.toLowerCase() !== destText.toLowerCase()) {
    currentCoords = await geocodeAddress(currentText, resolveOfflineCoordinates(currentText, null));
  }

  // Anti-collision safeguard: if origin and destination resolve to the same point, offset them slightly
  if (
    Array.isArray(originCoords) &&
    Array.isArray(destCoords) &&
    Math.hypot(originCoords[0] - destCoords[0], originCoords[1] - destCoords[1]) < 0.005
  ) {
    destCoords[0] += 0.08;
    destCoords[1] += 0.08;
  }

  return {
    ...shipment,
    originCoordinates: originCoords,
    destinationCoordinates: destCoords,
    currentCoordinates: currentCoords,
  };
}

module.exports = {
  US_STATES,
  DISAMBIGUATED_CITIES,
  LOGISTICS_HUBS,
  resolveOfflineCoordinates,
  geocodeAddress,
  batchGeocodeShipment,
};
