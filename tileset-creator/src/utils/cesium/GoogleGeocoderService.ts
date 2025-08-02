import { Rectangle, Credit, Resource } from 'cesium';
import CONFIG from '../../config';

const API_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const CREDIT_HTML = `<a href="https://developers.google.com/maps" target="_blank">© Google Maps</a>`;

/**
 * Provides geocoding through Google Maps Geocoding API.
 * This service follows Cesium's GeocoderService interface.
 */
function GoogleGeocoderService(this: any) {
  console.log('🗺️ [GoogleGeocoderService] Initializing Google Maps geocoder service...');
  
  this._resource = new Resource({
    url: API_URL,
    queryParameters: {
      key: CONFIG.GOOGLE_3D_TILES.key,
      language: "en", // Force English language results
    },
  });

  this._credit = new Credit(CREDIT_HTML, true);
  this._lastResults = []; // Store last results to access altitude data
  
  console.log('🗺️ [GoogleGeocoderService] Service ready! Using Google Maps Geocoding API');
}

Object.defineProperties(GoogleGeocoderService.prototype, {
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
GoogleGeocoderService.prototype.geocode = async function (query: string) {
  console.log('🗺️ [GoogleGeocoderService] Searching for:', query);
  
  if (!query || query.trim().length === 0) {
    console.log('🗺️ [GoogleGeocoderService] Empty query, skipping search');
    return [];
  }

  const resource = this._resource.getDerivedResource({
    queryParameters: {
      ...this._resource.queryParameters,
      address: query.trim(),
    },
  });

  try {
    console.log('🗺️ [GoogleGeocoderService] Making request to Google Maps Geocoding API...');
    const response = await resource.fetchJson();

    if (response.status !== 'OK' || !response.results || response.results.length === 0) {
      console.log('🗺️ [GoogleGeocoderService] No results found for:', query);
      return [];
    }
    
    const results = response.results.slice(0, 5).map((result: any) => {
      const location = result.geometry.location;
      const viewport = result.geometry.viewport;
      
      // Create a rectangle from the viewport or a small area around the point
      let rectangle;
      if (viewport) {
        rectangle = Rectangle.fromDegrees(
          viewport.southwest.lng,
          viewport.southwest.lat,
          viewport.northeast.lng,
          viewport.northeast.lat
        );
      } else {
        // Create a small rectangle around the point if no viewport
        const lat = location.lat;
        const lng = location.lng;
        const offset = 0.01; // About 1km
        rectangle = Rectangle.fromDegrees(
          lng - offset,
          lat - offset,
          lng + offset,
          lat + offset
        );
      }

      // Default altitude for Google results
      const altitude = 1000; // Default altitude of 1000 meters

      return {
        displayName: result.formatted_address,
        destination: rectangle,
        altitude: altitude,
        attribution: {
          html: CREDIT_HTML,
          collapsible: false,
        },
        // Additional Google-specific data
        googleData: {
          placeId: result.place_id,
          types: result.types,
          addressComponents: result.address_components,
        },
      };
    });

    // Store the results for later access (for altitude data)
    this._lastResults = results;
    
    console.log(`🗺️ [GoogleGeocoderService] Found ${results.length} results for "${query}"`);
    console.log('🗺️ [GoogleGeocoderService] Results:', results.map((r: any) => r.displayName));
    
    return results;
  } catch (error) {
    console.error('🗺️ [GoogleGeocoderService] Geocoding error:', error);
    return [];
  }
};

export default GoogleGeocoderService; 