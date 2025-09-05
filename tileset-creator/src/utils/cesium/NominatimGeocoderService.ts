import { Rectangle, Credit, Resource } from 'cesium';
import CONFIG from '../../config';

const CREDIT_HTML = `<a href="https://nominatim.openstreetmap.org/" target="_blank">© OpenStreetMap contributors</a>`;

/**
 * Provides geocoding through OpenStreetMap's Nominatim API.
 * This service follows Cesium's GeocoderService interface and supports multiple Nominatim servers.
 */
function NominatimGeocoderService(this: any, serverIndex: number = 0) {
  const apiUrls = CONFIG.NOMINATIM_API_URLS;
  const selectedUrl = apiUrls[serverIndex] || apiUrls[0]; // Fallback to first URL if index is out of bounds
  
  this._serverIndex = serverIndex;
  this._apiUrls = apiUrls;
  this._resource = new Resource({
    url: selectedUrl,
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
  if (!query || query.trim().length === 0) {
    return [];
  }

  const resource = this._resource.getDerivedResource({
    queryParameters: {
      ...this._resource.queryParameters,
      q: query.trim(),
    },
  });

  try {
    const response = await resource.fetchJson();

    if (!Array.isArray(response) || response.length === 0) {
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
        // Additional metadata about which server provided this result
        serverInfo: {
          serverIndex: this._serverIndex,
          serverUrl: this._resource.url,
          source: 'nominatim'
        },
      };
    });

    // Store the results for later access (for altitude data)
    this._lastResults = results;
    
    return results;
  } catch (error) {
    console.error('Nominatim geocoding error:', error);
    return [];
  }
};

/**
 * Get the number of configured Nominatim servers
 */
NominatimGeocoderService.getServerCount = function() {
  return CONFIG.NOMINATIM_API_URLS.length;
};

/**
 * Get all configured Nominatim server URLs
 */
NominatimGeocoderService.getServerUrls = function() {
  return [...CONFIG.NOMINATIM_API_URLS];
};

export default NominatimGeocoderService; 