import { Cesium3DTileset, Model as CesiumModel } from 'cesium';

declare global {
    // Type returned by the discoverMaps function
    type MapInfo = {
        name: string;
        url: string;
        type: 'default' | 'custom';
        key?: string;
        creditImageUrl?: string;
        mapIconUrl?: string;
    }

    // MapInfo with a new field 'tile' with the type Cesium3DTileSet.
    type MapInfoWithTile = MapInfo & {
        tile: Cesium3DTileset | CesiumModel;
    };

    // Dictionary to store the global state of the application
    type MapTilesLoaded = {
        [url: string]: MapInfoWithTile;
    };
}