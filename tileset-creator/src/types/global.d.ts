import { Cesium3DTileset, Model as CesiumModel } from "cesium";

declare global {
  // Type returned by the discoverMaps function
  type MapInfo = {
    name: string;
    url: string;
    type: "default" | "custom";
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
  };

  // Dictionary to store the global state of the application
  type MapTilesLoaded = {
    [url: string]: MapInfo;
  };
}
