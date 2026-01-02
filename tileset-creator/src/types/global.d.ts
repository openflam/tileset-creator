import { Cesium3DTileset, Model as CesiumModel } from "cesium";

declare global {
  // Type returned by the discoverMaps function
  type MapInfo = {
    id?: number; // Map ID from the API
    building_id?: string | null;
    levels?: string[] | null;
    commonName: string; // "Common name" borrowed from MapServer
    name: string; // "Map name" borrowed from MapServer
    type: "default" | "custom";
    placement?: "placed" | "unplaced";

    // Tileset URL
    url?: string;

    // The MapServer object corresponding to this MapInfo
    mapServer?: MapServer;

    creditImageUrl?: string;
    mapIconUrl?: string;

    // Tile associated with the map
    tile?: Cesium3DTileset | CesiumModel;

    // Map authentication can be handled with a key or by logging in to the map server
    // separately so that the browser has session cookies.
    // If the map has a key, it is set in key field (e.g., Google Maps).
    // If not, the request to the map server will use the session cookies. In such cases, credentialsCookiesRequired is true
    // and all requests to the map server will include credentials (cookies).
    key?: string;
    credentialsCookiesRequired?: boolean;

    // False if the map needs authentication.
    authenticated?: boolean;
  };

  // Dictionary to store the global state of the application
  type MapTilesLoaded = {
    [url: string]: MapInfo;
  };
}
