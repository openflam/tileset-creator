import {
    Viewer,
    IonGeocodeProviderType,
    Camera, Rectangle,
    Color as CesiumColor,
    Math as CesiumMath
} from 'cesium';
import { MapsDiscovery } from '@openflam/dnsspatialdiscovery';
import { useEffect, useRef } from 'react';

import { discoverAndAddTiles } from '../utils/discover-add-tiles';

async function createViewer(
    viewerDiv: HTMLDivElement,
    mapsDiscoveryObj: MapsDiscovery,
    mapTilesLoadedRef: React.RefObject<MapTilesLoaded>,
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

    // Add a callback to discover new maps when the camera moves.
    const discoverTilesForCurrentView = () => {
        const viewRectangle = viewer.camera.computeViewRectangle();
        if (!viewRectangle) {
            return;
        }
        else {
            const west = CesiumMath.toDegrees(viewRectangle.west);
            const south = CesiumMath.toDegrees(viewRectangle.south);
            const east = CesiumMath.toDegrees(viewRectangle.east);
            const north = CesiumMath.toDegrees(viewRectangle.north);
            const minLat = Math.min(south, north);
            const minLon = Math.min(west, east);
            const maxLat = Math.max(south, north);
            const maxLon = Math.max(west, east);
            discoverAndAddTiles(
                viewer, mapsDiscoveryObj,
                minLat, minLon, maxLat, maxLon,
                mapTilesLoadedRef, setMapTilesLoaded
            );
        }
    }

    // Call the function initially to discover and add tiles in the initial view.
    discoverTilesForCurrentView();

    // Callback to disocver and add tiles when the camera moves.
    // This callback is called when the camera stops moving.
    const onCameraMoveEnd = () => {
        discoverTilesForCurrentView();
    }

    viewer.camera.moveEnd.addEventListener(onCameraMoveEnd);


    return viewer;
}

type propsType = {
    mapTilesLoaded: MapTilesLoaded;
    setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>;
    onViewerReady: (viewer: Viewer) => void;
    mapsDiscoveryObj: MapsDiscovery;
}

function CesiumViewer({ mapTilesLoaded, setMapTilesLoaded, onViewerReady, mapsDiscoveryObj }: propsType) {
    const viewerRef = useRef<HTMLDivElement>(null);

    // Maintain a reference to the mapTilesLoaded state to avoid stale closures.
    // That is, using just mapTilesLoaded in a callback registered in useEffect will cause using the stale value of mapTilesLoaded.
    const mapTilesLoadedRef = useRef<MapTilesLoaded>(mapTilesLoaded);
    useEffect(() => {
        mapTilesLoadedRef.current = mapTilesLoaded;
    }, [mapTilesLoaded]);

    useEffect(() => {
        if (viewerRef.current) {
            createViewer(viewerRef.current, mapsDiscoveryObj,
                mapTilesLoadedRef, setMapTilesLoaded).then((viewer) => {
                    onViewerReady(viewer);
                });
        }
    }, []);

    return <div ref={viewerRef} style={{ width: '100%', height: '100vh' }} />;
}

export default CesiumViewer;
