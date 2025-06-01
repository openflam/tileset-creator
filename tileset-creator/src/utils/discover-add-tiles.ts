import { MapsDiscovery } from "@openflam/dnsspatialdiscovery";
import { Viewer } from "cesium";
import { discoverMaps } from "./openflame/discover";
import { addTilesetFromMapInfo } from "./cesium/add-tiles";

function discoverAndAddTiles(viewer: Viewer,
    mapsDiscoveryObj: MapsDiscovery,
    minLat: number, minLon: number,
    maxLat: number, maxLon: number,
    mapTilesLoadedRef: React.RefObject<MapTilesLoaded>,
    setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>) {

    // Disover maps in the current view.
    discoverMaps(mapsDiscoveryObj, minLat, minLon, maxLat, maxLon).then((mapInfos: MapInfo[]) => {

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

export { discoverAndAddTiles };