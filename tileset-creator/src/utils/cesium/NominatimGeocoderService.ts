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
      format: "jsonv2", // Use jsonv2 format which might include more data
      addressdetails: 1,
      extratags: 1, // Include OSM tags in the response
      namedetails: 1, // Include name details
      dedupe: 0, // Don't dedupe results
      polygon_geojson: 1, // Include polygon data
      polygon_kml: 0,
      polygon_svg: 0,
      polygon_text: 0,
      limit: 5,
      "accept-language": "en", // Force English language results
    },
    headers: {
      "Accept-Language": "en-US,en;q=0.9", // Force English language preference
    },
  });

  this._credit = new Credit(CREDIT_HTML, true);
  this._lastResults = []; // Store last results to access altitude data
  this._lastRawResponse = []; // Store last raw response from API
  
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

    // Store the raw response for later access when results are selected
    this._lastRawResponse = response;

    if (!Array.isArray(response) || response.length === 0) {
      return [];
    }
    
    const results = response.map((result: any) => {
      const west = parseFloat(result.boundingbox[2]);
      const south = parseFloat(result.boundingbox[0]);
      const east = parseFloat(result.boundingbox[3]);
      const north = parseFloat(result.boundingbox[1]);

      // Extract altitude from OSM tags or result data
      let altitude = 1000; // Default altitude
      
      // Store the raw result data for later access
      result._rawNominatimData = result;

      // Extract height from various sources
      if (result.altitude) {
        altitude = parseFloat(result.altitude);
      } else if (result.extratags && result.extratags.height) {
        altitude = parseFloat(result.extratags.height);
        console.log('📏 Found height in extratags:', altitude);
      } else if (result.osm_type && result.osm_id) {
        // Mark for details lookup if no height found
        result._needsDetailsLookup = true;
      }

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
        // Store raw Nominatim data for debugging
        _rawNominatimData: result._rawNominatimData
      };
    });

    // Store the results for later access (for altitude data)
    this._lastResults = results;
    
    // Try to fetch details for results that need height data
    const resultsWithDetails = await this._enrichResultsWithDetails(results);
    
    return resultsWithDetails;
  } catch (error) {
    console.error('Nominatim geocoding error:', error);
    return [];
  }
};

/**
 * Enrich search results with detailed OSM tag data if needed
 */
NominatimGeocoderService.prototype._enrichResultsWithDetails = async function(results: any[]) {
  const enrichedResults = [];
  
  for (const result of results) {
    if (result._needsDetailsLookup && result.osm_type && result.osm_id) {
      try {
        // Create details API request
        const detailsResource = this._resource.getDerivedResource({
          url: this._resource.url.replace('/search', '/details.php'),
          queryParameters: {
            format: 'json',
            osmtype: result.osm_type.charAt(0).toUpperCase(),
            osmid: result.osm_id,
            addressdetails: 1,
            extratags: 1,
            namedetails: 1
          }
        });
        
        const detailsResponse = await detailsResource.fetchJson();
        
        if (detailsResponse && detailsResponse.extratags) {
          // Update altitude if height data is found
          if (detailsResponse.extratags.height) {
            result.altitude = parseFloat(detailsResponse.extratags.height);
            console.log('📏 Found height in details:', result.altitude);
          }
          
          result.extratags = detailsResponse.extratags;
        }
      } catch (error) {
        // Silently continue if details fetch fails
      }
    }
    
    // Clean up the temporary flag
    delete result._needsDetailsLookup;
    enrichedResults.push(result);
  }
  
  return enrichedResults;
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