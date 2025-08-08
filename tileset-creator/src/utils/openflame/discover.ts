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
  const tileServicePromises = mapNames.map((mapName) =>
    getTileSetService(mapsDiscovered[mapName]),
  );

  const tileServices = await Promise.all(tileServicePromises);

  for (let i = 0; i < mapNames.length; i++) {
    const mapName = mapNames[i];
    const map = mapsDiscovered[mapName];
    const tileService = tileServices[i];
    if (tileService) {
      const mapInfo: MapInfo = {
        name: map.capabilities.commonName!,
        url: getFullUrl(tileService.url, mapName)!,
        type: "default", // All discovered maps are default maps.
        key: tileService.key,
        creditImageUrl: getFullUrl(
          tileService.creditImageUrl || map.capabilities.iconURL,
          mapName,
        ),
        mapIconUrl:
          getFullUrl(map.capabilities.iconURL, mapName) || customMapLogo,
        credentialsCookiesRequired:
          tileService.credentialsCookiesRequired || false,
      };
      mapInfos.push(mapInfo);
    }
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

  const mapsDiscovered =
    await mapsDiscoveryObj.discoverMapServers(polygonGeometry);

  if (import.meta.env.MODE === "development") {
    consoleLog("Polygon geometry:");
    consoleLog(polygonGeometry);
    consoleLog("Maps discovered:");
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
  customDiscoveryServices: MapServer[],
): Promise<MapInfo[]> {
  let mapInfos: MapInfo[] = [];
  let allDiscoveredMapServers: { [key: string]: MapServer } = {};

  // Discover maps from the custom discovery services.
  for (const mapServer of customDiscoveryServices) {
    const polygonGeometry = getPolygonFromViewer(viewer);
    if (!polygonGeometry) {
      return mapInfos;
    }

    const discoveredMapServers = await OpenFLAMEServices.queryDiscoveryService(
      mapServer,
      polygonGeometry,
    );

    consoleLog(`Discovered map servers from ${mapServer.name}:`);
    consoleLog(discoveredMapServers);

    allDiscoveredMapServers = {
      ...allDiscoveredMapServers,
      ...discoveredMapServers,
    };
  }

  mapInfos = await mapServersToMapInfos(allDiscoveredMapServers);
  return mapInfos;
}

export { discoverMapsDNS, discoverMapsServices, getTileSetService, getFullUrl };
