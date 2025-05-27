import { MapsDiscovery, MapServer } from "@openflam/dnsspatialdiscovery";
import type { MapServerServiceDescription } from "@openflam/dnsspatialdiscovery";

// Given a bounding box, returns the center and radius of the largest circle that fits within the box
const getRadiusForBounds = (minLat: number, minLon: number,
    maxLat: number, maxLon: number): { center: { lat: number, lon: number }, radius: number } => {
    const center = {
        lat: (minLat + maxLat) / 2,
        lon: (minLon + maxLon) / 2
    };

    // TODO: Calculate the radius.
    const radius = 20;
    return { center: center, radius: radius };
};

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

    const errorCircle = getRadiusForBounds(minLat, minLon, maxLat, maxLon);
    console.log('errorCircle', errorCircle);

    const mapsDiscovered = await mapsDiscoveryObj.discoverMapServers(
        errorCircle.center.lat,
        errorCircle.center.lon,
        errorCircle.radius,
    );

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

    console.log('discovered maps:', mapInfos);

    return mapInfos;
}

export { discoverMaps };
