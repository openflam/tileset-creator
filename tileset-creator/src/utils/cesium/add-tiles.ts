import {
  Cesium3DTileset,
  Resource,
  Credit,
  Viewer,
  Model as CesiumModel,
  Transforms as CesiumTransforms,
  TrustedServers,
} from "cesium";
import { consoleLog } from "../log";
import { getPositionInFrontOfCamera } from "./camera-view";

async function addTilesetFromMapInfo(
  viewer: Viewer,
  mapInfo: MapInfo,
  setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>,
): Promise<Cesium3DTileset | CesiumModel | null> {
  // "Default" maps are 3D Tilesets, while "Custom" maps are GLTF models.
  let tileset: Cesium3DTileset | CesiumModel | null = null;

  if (mapInfo.url) {
    if (mapInfo.type === "default") {
      if (mapInfo.placement === "unplaced") {
        tileset = await addUnplacedDefaultMapTiles(viewer, mapInfo);
      } else {
        tileset = await addDefaultMapTiles(viewer, mapInfo);
      }
    } else {
      tileset = await addCustomMapTiles(viewer, mapInfo);
    }
    mapInfo.tile = tileset ?? undefined;
  }

  // Update the mapTilesLoaded state
  setMapTilesLoaded((prev) => ({
    ...prev,
    [mapInfo.name]: mapInfo,
  }));

  return tileset;
}

// This function adds a default map tileset to the viewer.
async function addDefaultMapTiles(
  viewer: Viewer,
  mapInfo: MapInfo,
): Promise<Cesium3DTileset | null> {
  // Check if viewer is valid and not destroyed
  if (!viewer || !viewer.scene || viewer.isDestroyed()) {
    console.warn("Viewer is not available or has been destroyed");
    return null;
  }

  const { name, url, key, creditImageUrl, credentialsCookiesRequired } =
    mapInfo;
  let credits = undefined;
  if (creditImageUrl) {
    const creditObj = new Credit(
      `<img src="${creditImageUrl}" 
                style="vertical-align: -5px; max-width: 60px; max-height: 60px; width: auto; height: auto;" 
                alt="${name}"/>`,
      true,
    );
    credits = [creditObj];
  }

  // If the map has a key, it is added to the query parameters.
  // If credentialsCookiesRequired is true, the request to the map server will use the session cookies.

  if (credentialsCookiesRequired) {
    // Add the host to the TrustedServers list to make all requests to this host
    // with credentials (cookies).
    const host = new URL(url!).host;
    TrustedServers.add(host, 443);
    consoleLog(
      `Added ${host} to TrustedServers for credentials (cookies) access.`,
    );
  }

  const queryParameters: { [key: string]: string } = {};
  if (key) {
    queryParameters.key = key;
  }

  const resource = new Resource({
    url: url,
    queryParameters: queryParameters,
    credits: credits,
  } as any);

  const tileset = await Cesium3DTileset.fromUrl(resource);
  
  // Check again after async operation in case viewer was destroyed
  if (!viewer || !viewer.scene || viewer.isDestroyed()) {
    console.warn("Viewer was destroyed during tileset loading");
    return null;
  }
  
  viewer.scene.primitives.add(tileset);
  return tileset;
}

async function addUnplacedDefaultMapTiles(
  viewer: Viewer,
  mapInfo: MapInfo,
): Promise<Cesium3DTileset | null> {
  // Check if viewer is valid
  if (!viewer || !viewer.scene || viewer.isDestroyed()) {
    console.warn("Viewer is not available or has been destroyed");
    return null;
  }

  // Load the tileset as normal
  const tileset = await addDefaultMapTiles(viewer, mapInfo);
  
  if (!tileset) {
    return null;
  }

  // Place the model 10 meters in front of the camera using utility
  const { position } = getPositionInFrontOfCamera(viewer, 10.0);
  const modelMatrix = CesiumTransforms.eastNorthUpToFixedFrame(position);

  // Apply the transformation to the tileset
  tileset.modelMatrix = modelMatrix;

  return tileset;
}

// This function adds a custom map tileset (GLTF model) to the viewer.
async function addCustomMapTiles(
  viewer: Viewer,
  mapInfo: MapInfo,
): Promise<CesiumModel | null> {
  // Check if viewer is valid
  if (!viewer || !viewer.scene || viewer.isDestroyed()) {
    console.warn("Viewer is not available or has been destroyed");
    return null;
  }

  const { url } = mapInfo;

  // Place the model 10 meters in front of the camera using utility
  const { position } = getPositionInFrontOfCamera(viewer, 10.0);
  const modelMatrix = CesiumTransforms.eastNorthUpToFixedFrame(position);

  const model = await CesiumModel.fromGltfAsync({
    url: url!,
    modelMatrix: modelMatrix,
    scale: 1.0,
    scene: viewer.scene,
  });

  // Check again after async operation
  if (!viewer || !viewer.scene || viewer.isDestroyed()) {
    console.warn("Viewer was destroyed during model loading");
    return null;
  }

  viewer.scene.primitives.add(model);

  return model;
}

export { addTilesetFromMapInfo };
