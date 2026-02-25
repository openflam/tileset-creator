import { Rectangle, Credit, Resource } from "cesium";

const CREDIT_HTML = `<a href="https://nominatim.openstreetmap.org/" target="_blank">© OpenStreetMap contributors</a>`;

/**
 * Provides geocoding through a Nominatim-compatible API.
 * Accepts a search URL directly so backends can be discovered at runtime.
 */
function NominatimGeocoderService(this: any, url: string) {
  this._url = url;
  this._resource = new Resource({
    url,
    queryParameters: {
      format: "jsonv2",
      addressdetails: 1,
      extratags: 1,
      namedetails: 1,
      dedupe: 0,
      polygon_geojson: 1,
      limit: 5,
      "accept-language": "en",
    },
    headers: {
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  this._credit = new Credit(CREDIT_HTML, true);
  this._lastResults = [];
  this._lastRawResponse = [];
}

Object.defineProperties(NominatimGeocoderService.prototype, {
  credit: {
    get: function (this: any) {
      return this._credit;
    },
  },
});

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

    this._lastRawResponse = response;

    if (!Array.isArray(response) || response.length === 0) {
      return [];
    }

    const results = response.map((result: any) => {
      const west = parseFloat(result.boundingbox[2]);
      const south = parseFloat(result.boundingbox[0]);
      const east = parseFloat(result.boundingbox[3]);
      const north = parseFloat(result.boundingbox[1]);

      let altitude = 1000;
      result._rawNominatimData = result;

      if (result.altitude) {
        altitude = parseFloat(result.altitude);
      } else if (result.extratags && result.extratags.height) {
        altitude = parseFloat(result.extratags.height);
      } else if (result.osm_type && result.osm_id) {
        result._needsDetailsLookup = true;
      }

      return {
        displayName: result.display_name,
        destination: Rectangle.fromDegrees(west, south, east, north),
        altitude,
        attribution: {
          html: CREDIT_HTML,
          collapsible: false,
        },
        serverInfo: {
          serverUrl: this._url,
          source: "nominatim",
        },
        _rawNominatimData: result._rawNominatimData,
      };
    });

    this._lastResults = results;

    const resultsWithDetails = await this._enrichResultsWithDetails(results);
    return resultsWithDetails;
  } catch (error) {
    console.error("Nominatim geocoding error:", error);
    return [];
  }
};

/**
 * Enrich search results with detailed OSM tag data if needed
 */
NominatimGeocoderService.prototype._enrichResultsWithDetails = async function (
  results: any[],
) {
  const enrichedResults = [];

  for (const result of results) {
    if (result._needsDetailsLookup && result.osm_type && result.osm_id) {
      try {
        const detailsResource = this._resource.getDerivedResource({
          url: this._resource.url.replace("/search", "/details.php"),
          queryParameters: {
            format: "json",
            osmtype: result.osm_type.charAt(0).toUpperCase(),
            osmid: result.osm_id,
            addressdetails: 1,
            extratags: 1,
            namedetails: 1,
          },
        });

        const detailsResponse = await detailsResource.fetchJson();

        if (detailsResponse && detailsResponse.extratags) {
          if (detailsResponse.extratags.height) {
            result.altitude = parseFloat(detailsResponse.extratags.height);
          }
          result.extratags = detailsResponse.extratags;
        }
      } catch (error) {
        // Silently continue if details fetch fails
      }
    }

    delete result._needsDetailsLookup;
    enrichedResults.push(result);
  }

  return enrichedResults;
};

export default NominatimGeocoderService;
