import {
    Cesium3DTileset,
    Resource,
    Credit,
    Viewer,
    Model as CesiumModel,
    Transforms as CesiumTransforms,
    Cartesian3,
} from 'cesium';


async function addTilesetFromMapInfo(viewer: Viewer, mapInfo: MapInfo,
    setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>): Promise<Cesium3DTileset | CesiumModel> {

    // "Default" maps are 3D Tilesets, while "Custom" maps are GLTF models.
    let tileset: Cesium3DTileset | CesiumModel;
    if (mapInfo.type === 'default') {
        tileset = await addDefaultMapTiles(viewer, mapInfo);
    }
    else {
        tileset = await addCustomMapTiles(viewer, mapInfo);
    }

    // Update the mapTilesLoaded state
    const mapInfoWithTile: MapInfoWithTile = {
        ...mapInfo,
        tile: tileset,
    };
    setMapTilesLoaded((prev => ({
        ...prev,
        [mapInfo.url]: mapInfoWithTile,
    })));

    return tileset;
}

// This function adds a default map tileset to the viewer.
async function addDefaultMapTiles(viewer: Viewer, mapInfo: MapInfo): Promise<Cesium3DTileset> {
    const { name, url, key, creditImageUrl } = mapInfo;
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
    const resource = new Resource({
        url: url,
        queryParameters: {
            key: key,
        },
        credits: credits,
    } as any);

    const tileset = await Cesium3DTileset.fromUrl(resource);
    viewer.scene.primitives.add(tileset);
    return tileset;
}

// This function adds a custom map tileset (GLTF model) to the viewer.
async function addCustomMapTiles(viewer: Viewer, mapInfo: MapInfo): Promise<CesiumModel> {
    const { url } = mapInfo;

    // Get the current camera position and direction
    const camera = viewer.scene.camera;
    const cameraPosition = camera.positionWC;
    const cameraDirection = camera.directionWC;

    // Place the model 10 meters in front of the camera
    const distance = 10.0;
    const offset = Cartesian3.multiplyByScalar(cameraDirection, distance, new Cartesian3());
    const modelPosition = Cartesian3.add(cameraPosition, offset, new Cartesian3());

    const modelMatrix = CesiumTransforms.eastNorthUpToFixedFrame(modelPosition);

    const model = await CesiumModel.fromGltfAsync({
        url: url,
        modelMatrix: modelMatrix,
        scale: 1.0,
        scene: viewer.scene,
    });

    viewer.scene.primitives.add(model);

    return model;
}


export { addTilesetFromMapInfo };