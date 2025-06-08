import { MapsDiscovery, MapServer } from "@openflam/dnsspatialdiscovery";
import { LocationToGeoDomain } from "@openflam/dnsspatialdiscovery";
import type { MapServerServiceDescription } from "@openflam/dnsspatialdiscovery";
import { Viewer } from "cesium";
import { getPolygonFromViewer } from "../cesium/camera-view";
import { consoleLog } from "../log";
import CONFIG from "../../config";

const getTileSetService = (mapServer: MapServer): MapServerServiceDescription | null => {
    if (!mapServer.capabilities || !mapServer.capabilities.services) {
        return null;
    }
    for (const service of mapServer.capabilities.services) {
        if (service.name === 'tileserver') {
            return service;
        }
    }
    return null;
};

const getFullUrl = (url: string | undefined, mapName: string): string | undefined => {
    if (!url) {
        return undefined;
    }
    else if (!url.startsWith('http')) {
        return 'https://' + mapName + url;
    }
    return url;
};

async function discoverMaps(viewer: Viewer, mapsDiscoveryObj: MapsDiscovery): Promise<MapInfo[]> {

    let mapInfos: MapInfo[] = [];

    // Add Google photorealistic tileset as a default map.
    const defaultMapInfo: MapInfo = CONFIG.GOOGLE_3D_TILES;
    mapInfos.push(defaultMapInfo);

    // Disocver maps in the current view.
    const polygonGeometry = getPolygonFromViewer(viewer);
    if (!polygonGeometry) {
        return mapInfos;
    }

    const mapsDiscovered = await mapsDiscoveryObj.discoverMapServers(polygonGeometry);

    if (import.meta.env.MODE === 'development') {
        consoleLog('Polygon geometry:');
        consoleLog(polygonGeometry);
        consoleLog('Maps discovered:');
        consoleLog(mapsDiscovered);

        const geoDomainsGenerated = await LocationToGeoDomain.getBaseGeoDomains(polygonGeometry);
        consoleLog('Base geodomains generated:');
        consoleLog(geoDomainsGenerated.map(domain => domain.join('.')).join('\n'));
    }

    for (const mapName in mapsDiscovered) {
        const map = mapsDiscovered[mapName];
        const tileService = getTileSetService(map);
        if (tileService) {
            const mapInfo: MapInfo = {
                name: map.capabilities.commonName!,
                url: getFullUrl(tileService.url, mapName)!,
                type: 'default', // All disocvered maps are default maps.
                key: tileService.key,
                creditImageUrl: getFullUrl(tileService.creditImageUrl || map.capabilities.iconURL, mapName),
                mapIconUrl: getFullUrl(map.capabilities.iconURL, mapName),
            };
            mapInfos.push(mapInfo);
        }
    }

    return mapInfos;
}

export { discoverMaps };
