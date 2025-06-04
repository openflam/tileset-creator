import { MapsDiscovery, MapServer } from "@openflam/dnsspatialdiscovery";
import { LocationToGeoDomain } from "@openflam/dnsspatialdiscovery";
import type { MapServerServiceDescription } from "@openflam/dnsspatialdiscovery";
import type { Geometry } from "@openflam/dnsspatialdiscovery";

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

async function discoverMaps(mapsDiscoveryObj: MapsDiscovery, minLat: number, minLon: number, maxLat: number, maxLon: number): Promise<MapInfo[]> {

    const polygonGeometry: Geometry = {
        type: 'Polygon',
        coordinates: [[
            [minLon, minLat],
            [maxLon, minLat],
            [maxLon, maxLat],
            [minLon, maxLat],
            [minLon, minLat]
        ]]
    }

    const mapsDiscovered = await mapsDiscoveryObj.discoverMapServers(polygonGeometry);
    const geodomainsGenerated = await LocationToGeoDomain.getBaseGeoDomains(polygonGeometry);

    // Temporary logging for debugging
    console.log('Discovered maps:', mapsDiscovered);
    let geodomains: string[] = [];
    for (const domain of geodomainsGenerated) {
        geodomains.push(domain.join('.'));
    }
    console.log('Geo domains generated:');
    console.log(geodomains.join('\n'));

    console.log('Polygon geometry:', polygonGeometry);
    // -- End of temporary logging

    let mapInfos: MapInfo[] = [];
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

    // Add Google photorealistic tileset
    const defaultMapInfo: MapInfo = {
        'name': 'Google',
        'url': 'https://tile.googleapis.com/v1/3dtiles/root.json',
        'key': 'AIzaSyAX6sorU_jmEEGIWbbuRN329qEvgseHVl8',
        'type': 'default',
        'creditImageUrl': 'https://assets.ion.cesium.com/google-credit.png',
        'mapIconUrl': 'https://upload.wikimedia.org/wikipedia/commons/1/13/Googlelogo_color_272x92dp.png',
    }
    mapInfos.push(defaultMapInfo);

    return mapInfos;
}

export { discoverMaps };
