import { Cesium3DTileset, Resource, Credit, Viewer } from 'cesium';


async function addTilesetFromMapInfo(viewer: Viewer, mapInfo: MapInfo,
    setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>): Promise<Cesium3DTileset> {

    let tileset = null;
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

async function addDefaultMapTiles(viewer: Viewer, mapInfo: MapInfo): Promise<Cesium3DTileset> {
    // The default map tiles is Google 3D tileset. This function adds the google 3D tileset to the viewer.
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

async function addCustomMapTiles(_viewer: Viewer, mapInfo: MapInfo): Promise<Cesium3DTileset> {
    const { name, url } = mapInfo;
    console.log(`Adding custom map tiles: ${name} from ${url}`);

    // return empty tileset
    const emptyTileset = new Cesium3DTileset({});
    return emptyTileset;
}

export { addTilesetFromMapInfo };