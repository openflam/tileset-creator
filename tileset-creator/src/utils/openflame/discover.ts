import {
  MapsDiscovery,
  MapServer,
  Services as OpenFLAMEServices,
} from "@openflam/dnsspatialdiscovery";
import { LocationToGeoDomain } from "@openflam/dnsspatialdiscovery";
import type { MapServerServiceDescription } from "@openflam/dnsspatialdiscovery";
import { Viewer } from "cesium";
import { getPolygonFromViewer } from "../cesium/camera-view";
import { consoleLog } from "../log";
import CONFIG from "../../config";
import customMapLogo from "../../assets/customMap.svg";

const getTileSetService = async (
  mapServer: MapServer,
): Promise<MapServerServiceDescription | null> => {
  if (Object.keys(mapServer.capabilities).length === 0) {
    await mapServer.queryCapabilities();
  }
  if (!mapServer.capabilities || !mapServer.capabilities.services) {
    return null;
  }
  for (const service of mapServer.capabilities.services) {
    if (service.name === "tileserver") {
      return service;
    }
  }
  return null;
};

const checkAuthentication = async (mapServer: MapServer): Promise<boolean> => {
  if (Object.keys(mapServer.capabilities).length === 0) {
    await mapServer.queryCapabilities();
  }
  if (!mapServer.capabilities || !mapServer.capabilities.services) {
    return true; // No capabilities means no authentication required.
  }

  if (
    !mapServer.capabilities.auth ||
    !mapServer.capabilities.auth.authCheckUrl
  ) {
    return true; // No auth URL means no authentication required.
  }
  const authCheckUrl = getFullUrl(
    mapServer.capabilities.auth.authCheckUrl,
    mapServer.name,
  )!;
  const response = await fetch(authCheckUrl, {
    method: "GET",
    credentials: "include",
  });
  const responseJson = await response.json();
  return responseJson.is_authenticated;
};

const getFullUrl = (
  url: string | undefined,
  mapName: string,
): string | undefined => {
  if (!url) {
    return undefined;
  } else if (!url.startsWith("http")) {
    return "https://" + mapName + url;
  }
  return url;
};

async function mapServersToMapInfos(mapsDiscovered: {
  [key: string]: MapServer;
}): Promise<MapInfo[]> {
  let mapInfos: MapInfo[] = [];

  const mapNames = Object.keys(mapsDiscovered);

  // Check for authentication of all map servers
  const authCheckPromises = mapNames.map((mapName) =>
    checkAuthentication(mapsDiscovered[mapName]),
  );
  const authResults = await Promise.all(authCheckPromises);

  // Get tile services for all discovered map servers.
  const tileServicePromises = mapNames.map((mapName) =>
    getTileSetService(mapsDiscovered[mapName]),
  );
  const tileServices = await Promise.all(tileServicePromises);

  for (let i = 0; i < mapNames.length; i++) {
    const mapName = mapNames[i];
    const mapServer = mapsDiscovered[mapName];

    const mapInfo: MapInfo = {
      commonName: mapServer.capabilities.commonName!,
      name: mapServer.name,
      type: "default", // All discovered maps are default maps.
      mapServer: mapServer,
      authenticated: authResults[i], // This is changed later based on the authentication check done earlier.
      mapIconUrl:
        getFullUrl(mapServer.capabilities.iconURL, mapName) || customMapLogo,
    };

    // If tile service is available, populate mapInfo with its details.
    const tileService = tileServices[i];
    if (tileService) {
      mapInfo.url = getFullUrl(tileService.url, mapName)!;
      mapInfo.key = tileService.key;
      mapInfo.creditImageUrl = getFullUrl(
        tileService.creditImageUrl || mapServer.capabilities.iconURL,
        mapName,
      );
      mapInfo.credentialsCookiesRequired =
        tileService.credentialsCookiesRequired || false;
    }

    mapInfos.push(mapInfo);
  }

  return mapInfos;
}

async function discoverMapsDNS(
  viewer: Viewer,
  mapsDiscoveryObj: MapsDiscovery,
): Promise<MapInfo[]> {
  let mapInfos: MapInfo[] = [];

  // Add Google photorealistic tileset as a default map.
  const defaultMapInfo: MapInfo = CONFIG.GOOGLE_3D_TILES;
  mapInfos.push(defaultMapInfo);

  // Disocver maps in the current view.
  const polygonGeometry = getPolygonFromViewer(viewer);
  if (!polygonGeometry) {
    return mapInfos;
  }

  const mapsDiscovered = await mapsDiscoveryObj.discoverMapServers(
    polygonGeometry,
    { useDiscoveryService: false },
  );

  if (import.meta.env.MODE === "development") {
    consoleLog("Polygon geometry:");
    consoleLog(polygonGeometry);
    consoleLog("Maps discovered (DNS):");
    consoleLog(mapsDiscovered);

    const geoDomainsGenerated =
      await LocationToGeoDomain.getBaseGeoDomains(polygonGeometry);
    consoleLog("Base geodomains generated:");
    consoleLog(
      geoDomainsGenerated.map((domain) => domain.join(".")).join("\n"),
    );
  }

  mapInfos = await mapServersToMapInfos(mapsDiscovered);
  return mapInfos;
}

async function discoverMapsServices(
  viewer: Viewer,
  mapTilesLoadedRef: React.RefObject<MapTilesLoaded>,
): Promise<MapInfo[]> {
  let mapInfos: MapInfo[] = [];
  let allDiscoveredMapServers: { [key: string]: MapServer } = {};

  // Discover maps from the custom discovery services.
  const mapServers = Object.values(mapTilesLoadedRef.current)
    .map((mapInfo: MapInfo) => mapInfo.mapServer)
    .filter((mapServer): mapServer is MapServer => mapServer !== undefined);

  // Keep only servers that have a discovery service
  const serversWithDiscovery = mapServers.filter((mapServer) =>
    mapServer.getService("discovery"),
  );

  // Get the polygon once
  const polygonGeometry = getPolygonFromViewer(viewer);
  if (!polygonGeometry) {
    return mapInfos;
  }

  // Iterate through all MapServers and query their discovery services.
  const discoveryQueryPromises = serversWithDiscovery.map((mapServer) =>
    OpenFLAMEServices.queryDiscoveryService(mapServer, polygonGeometry),
  );

  const discoveredMapServers = await Promise.all(discoveryQueryPromises);
  for (const mapServerDict of discoveredMapServers) {
    allDiscoveredMapServers = {
      ...allDiscoveredMapServers,
      ...mapServerDict,
    };
  }

  consoleLog("Maps discovered (Discovery Services):");
  consoleLog(discoveredMapServers);

  mapInfos = await mapServersToMapInfos(allDiscoveredMapServers);

  consoleLog("Maps Infos (Discovery Services):");
  consoleLog(mapInfos);

  return mapInfos;
}

export {
  discoverMapsDNS,
  discoverMapsServices,
  getTileSetService,
  getFullUrl,
  checkAuthentication,
};
