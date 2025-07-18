import { Rectangle, Credit, Resource } from 'cesium';

const API_URL = "https://nominatim.openstreetmap.org/search";
const CREDIT_HTML = `<a href="https://nominatim.openstreetmap.org/" target="_blank">© OpenStreetMap contributors</a>`;

/**
 * Provides geocoding through OpenStreetMap's Nominatim API.
 * This service follows Cesium's GeocoderService interface.
 */
function NominatimGeocoderService(this: any) {
  console.log('🌍 [NominatimGeocoderService] Initializing OpenStreetMap geocoder service...');
  
  this._resource = new Resource({
    url: API_URL,
    queryParameters: {
      format: "json",
      addressdetails: 1,
      limit: 5,
      "accept-language": "en", // Force English language results
    },
    headers: {
      "Accept-Language": "en-US,en;q=0.9", // Force English language preference
    },
  });

  this._credit = new Credit(CREDIT_HTML, true);
  this._lastResults = []; // Store last results to access altitude data
  
  console.log('🌍 [NominatimGeocoderService] Service ready! Using OpenStreetMap Nominatim API');
}

Object.defineProperties(NominatimGeocoderService.prototype, {
  credit: {
    get: function (this: any) {
      return this._credit;
    },
  },
});

/**
 * Get a list of possible locations that match a search string.
 *
 * @function
 * @param {string} query The search string
 * @returns {Promise<GeocoderService.Result[]>}
 */
NominatimGeocoderService.prototype.geocode = async function (query: string) {
  console.log('🌍 [NominatimGeocoderService] Searching for:', query);
  
  if (!query || query.trim().length === 0) {
    console.log('🌍 [NominatimGeocoderService] Empty query, skipping search');
    return [];
  }

  const resource = this._resource.getDerivedResource({
    queryParameters: {
      ...this._resource.queryParameters,
      q: query.trim(),
    },
  });

  try {
    console.log('🌍 [NominatimGeocoderService] Making request to OpenStreetMap Nominatim API...');
    const response = await resource.fetchJson();

    if (!Array.isArray(response) || response.length === 0) {
      console.log('🌍 [NominatimGeocoderService] No results found for:', query);
      return [];
    }
    
    const results = response.map((result: any) => {
      const west = parseFloat(result.boundingbox[2]);
      const south = parseFloat(result.boundingbox[0]);
      const east = parseFloat(result.boundingbox[3]);
      const north = parseFloat(result.boundingbox[1]);

      // Check if altitude exists in the API response, if not add default value
      const altitude = result.altitude || 1000; // Default altitude of 100 meters

      return {
        displayName: result.display_name,
        destination: Rectangle.fromDegrees(west, south, east, north),
        altitude: altitude, // Add altitude to the result
        attribution: {
          html: CREDIT_HTML,
          collapsible: false,
        },
      };
    });

    // Store the results for later access (for altitude data)
    this._lastResults = results;
    
    console.log(`🌍 [NominatimGeocoderService] Found ${results.length} results for "${query}"`);
    console.log('🌍 [NominatimGeocoderService] Results:', results.map(r => r.displayName));
    
    return results;
  } catch (error) {
    console.error('🌍 [NominatimGeocoderService] Geocoding error:', error);
    return [];
  }
};

export default NominatimGeocoderService; 