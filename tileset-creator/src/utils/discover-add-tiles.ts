import { MapsDiscovery } from "@openflam/dnsspatialdiscovery";
import { Viewer } from "cesium";
import {
  discoverMapsDNS,
  discoverMapsServices,
  checkAuthentication,
} from "./openflame/discover";
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
    const { name } = mapInfo;
    if (mapTilesLoadedRef.current && name in mapTilesLoadedRef.current) {
      continue;
    }
    addTilesetFromMapInfo(viewer, mapInfo, setMapTilesLoaded);
  }
}

async function checkAuthenticationDiscovered(
  mapTilesLoadedRef: React.RefObject<MapTilesLoaded>,
  setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>,
) {
  // Check if any of the previously discovered maps have been authenticated
  const unauthenticatedMapNames = Object.keys(mapTilesLoadedRef.current || {})
    .filter((name) => !mapTilesLoadedRef.current![name].authenticated)
    .filter((name) => mapTilesLoadedRef.current![name].type === "default");

  const authCheckPromises = unauthenticatedMapNames.map((mapName) => {
    const mapInfo = mapTilesLoadedRef.current![mapName];
    return checkAuthentication(mapInfo.mapServer);
  });

  const authResults = await Promise.all(authCheckPromises);
  for (let i = 0; i < unauthenticatedMapNames.length; i++) {
    if (authResults[i]) {
      setMapTilesLoaded((prev) => ({
        ...prev,
        [unauthenticatedMapNames[i]]: {
          ...prev[unauthenticatedMapNames[i]],
          authenticated: true,
        },
      }));
    }
  }
}

function discoverAndAddTiles(
  viewer: Viewer,
  mapsDiscoveryObj: MapsDiscovery,
  mapTilesLoadedRef: React.RefObject<MapTilesLoaded>,
  setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>,
) {
  // Check if any of the previously discovered maps have been authenticated
  checkAuthenticationDiscovered(mapTilesLoadedRef, setMapTilesLoaded);

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
