import { MapsDiscovery } from "@openflam/dnsspatialdiscovery";
import { Viewer } from "cesium";
import { discoverMapsDNS, discoverMapsServices } from "./openflame/discover";
import { addTilesetFromMapInfo } from "./cesium/add-tiles";
import CONFIG from "../config";

function addMapInfosToViewer(
  viewer: Viewer,
  mapInfos: MapInfo[],
  mapTilesLoadedRef: React.RefObject<MapTilesLoaded>,
  setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>,
) {
  // Loop through the discovered maps and add them to the viewer if they are not already loaded.
  for (const mapInfo of mapInfos) {
    const { url } = mapInfo;
    if (mapTilesLoadedRef.current && url in mapTilesLoadedRef.current) {
      continue;
    }
    addTilesetFromMapInfo(viewer, mapInfo, setMapTilesLoaded);
  }
}

function discoverAndAddTiles(
  viewer: Viewer,
  mapsDiscoveryObj: MapsDiscovery,
  mapTilesLoadedRef: React.RefObject<MapTilesLoaded>,
  setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>,
) {
  // Disover maps in the current view using DNS.
  discoverMapsDNS(viewer, mapsDiscoveryObj).then((mapInfos: MapInfo[]) => {
    addMapInfosToViewer(viewer, mapInfos, mapTilesLoadedRef, setMapTilesLoaded);
  });

  // Query the discovery services in mapInfos that have the discovery service
  discoverMapsServices(viewer, mapTilesLoadedRef).then(
    (mapInfos: MapInfo[]) => {
      addMapInfosToViewer(
        viewer,
        mapInfos,
        mapTilesLoadedRef,
        setMapTilesLoaded,
      );
    },
  );
}

function addDefaultTiles(
  viewer: Viewer,
  setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>,
) {
  // Add Google photorealistic tileset as a default map.
  const defaultMapInfo: MapInfo = CONFIG.GOOGLE_3D_TILES;
  addTilesetFromMapInfo(viewer, defaultMapInfo, setMapTilesLoaded);
}

export { discoverAndAddTiles, addDefaultTiles };
