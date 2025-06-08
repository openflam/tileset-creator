import { MapsDiscovery } from "@openflam/dnsspatialdiscovery";
import { Viewer } from "cesium";
import { discoverMaps } from "./openflame/discover";
import { addTilesetFromMapInfo } from "./cesium/add-tiles";
import CONFIG from "../config";

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
    const defaultMapInfo: MapInfo = CONFIG.GOOGLE_3D_TILES;
    addTilesetFromMapInfo(viewer, defaultMapInfo, setMapTilesLoaded);
}

export { discoverAndAddTiles, addDefaultTiles };