import { MapsDiscovery } from "@openflam/dnsspatialdiscovery";
import { Viewer } from "cesium";
import { discoverMaps } from "./openflame/discover";
import { addTilesetFromMapInfo } from "./cesium/add-tiles";

function discoverAndAddTiles(
    viewer: Viewer,
    mapsDiscoveryObj: MapsDiscovery,
    mapTilesLoadedRef: React.RefObject<MapTilesLoaded>,
    setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>) {

    // Disover maps in the current view.
    discoverMaps(viewer, mapsDiscoveryObj).then((mapInfos: MapInfo[]) => {

        // Loop through the discovered maps and add them to the viewer if they are not already loaded.
        for (const mapInfo of mapInfos) {
            const { url } = mapInfo;
            if (mapTilesLoadedRef.current && url in mapTilesLoadedRef.current) {
                continue;
            }
            addTilesetFromMapInfo(viewer, mapInfo, setMapTilesLoaded);
        }
    });
}

function addDefaultTiles(viewer: Viewer, setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>) {
    // Add Google photorealistic tileset as a default map.
    const defaultMapInfo: MapInfo = {
        'name': 'Google',
        'url': 'https://tile.googleapis.com/v1/3dtiles/root.json',
        'key': 'AIzaSyAX6sorU_jmEEGIWbbuRN329qEvgseHVl8',
        'type': 'default',
        'creditImageUrl': 'https://assets.ion.cesium.com/google-credit.png',
        'mapIconUrl': 'https://upload.wikimedia.org/wikipedia/commons/1/13/Googlelogo_color_272x92dp.png',
    }
    addTilesetFromMapInfo(viewer, defaultMapInfo, setMapTilesLoaded);
}

export { discoverAndAddTiles, addDefaultTiles };