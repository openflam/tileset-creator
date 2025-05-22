import { Cesium3DTileset, Resource, Credit, Viewer } from 'cesium';


async function addTilesetFromMapInfo(viewer: Viewer, mapInfo: MapInfo,
    setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>): Promise<Cesium3DTileset> {
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

    // Update the mapTilesLoaded state
    const mapInfoWithTile: MapInfoWithTile = {
        ...mapInfo,
        tile: tileset,
    };
    setMapTilesLoaded((prev => ({
        ...prev,
        [url]: mapInfoWithTile,
    })));

    return tileset;
}

export { addTilesetFromMapInfo };