import { Viewer, IonGeocodeProviderType, Camera, Rectangle, Color as CesiumColor } from 'cesium';
import { useEffect, useRef } from 'react';
import { addTilesetFromMapInfo } from '../utils/add-tiles';

async function createViewer(
    viewerDiv: HTMLDivElement,
    _mapTilesLoadedRef: React.RefObject<MapTilesLoaded>,
    setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>) {

    var extent = Rectangle.fromDegrees(-79.9474941502019, 40.44094655168858, -79.93932358868162, 40.445570804400056);
    Camera.DEFAULT_VIEW_RECTANGLE = extent;
    Camera.DEFAULT_VIEW_FACTOR = 0;

    const viewer = new Viewer(viewerDiv, {
        baseLayerPicker: false,
        geocoder: IonGeocodeProviderType.GOOGLE,
    });
    viewer.scene.imageryLayers.removeAll();
    viewer.dataSources.removeAll();

    // Make the globe white so that the translucent tiles are visible.
    viewer.scene.globe.baseColor = CesiumColor.fromCssColorString('#000000');

    // Add Google photorealistic tileset
    const defaultMapInfo: MapInfo = {
        'name': 'Google',
        'url': 'https://tile.googleapis.com/v1/3dtiles/root.json',
        'key': 'AIzaSyAX6sorU_jmEEGIWbbuRN329qEvgseHVl8',
        'type': 'default',
        'creditImageUrl': 'https://assets.ion.cesium.com/google-credit.png',
        'mapIconUrl': 'https://upload.wikimedia.org/wikipedia/commons/1/13/Googlelogo_color_272x92dp.png',
    }
    addTilesetFromMapInfo(viewer, defaultMapInfo, setMapTilesLoaded);


    return viewer;
}

type propsType = {
    mapTilesLoaded: MapTilesLoaded;
    setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>;
    onViewerReady: (viewer: Viewer) => void;
}

function CesiumViewer({ mapTilesLoaded, setMapTilesLoaded, onViewerReady }: propsType) {
    const viewerRef = useRef<HTMLDivElement>(null);

    // Maintain a reference to the mapTilesLoaded state to avoid stale closures.
    // That is, using just mapTilesLoaded in a callback registered in useEffect will cause using the stale value of mapTilesLoaded.
    const mapTilesLoadedRef = useRef<MapTilesLoaded>(mapTilesLoaded);
    useEffect(() => {
        mapTilesLoadedRef.current = mapTilesLoaded;
    }, [mapTilesLoaded]);

    useEffect(() => {
        if (viewerRef.current) {
            createViewer(viewerRef.current, mapTilesLoadedRef, setMapTilesLoaded).then((viewer) => {
                onViewerReady(viewer);
            });
        }
    }, []);

    return <div ref={viewerRef} style={{ width: '100%', height: '100vh' }} />;
}

export default CesiumViewer;
