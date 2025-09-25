import {
  Viewer,
  Camera,
  Rectangle,
  Color as CesiumColor,
  Ion,
} from "cesium";
import { MapsDiscovery } from "@openflam/dnsspatialdiscovery";
import { useEffect, useRef, useState } from "react";

import {
  discoverAndAddTiles,
  addDefaultTiles,
} from "../utils/discover-add-tiles";
import CustomSearchBar from './CustomSearchBar';
import CONFIG from "../config";

async function createViewer(
  viewerDiv: HTMLDivElement,
  mapsDiscoveryObj: MapsDiscovery,
  mapTilesLoadedRef: React.RefObject<MapTilesLoaded>,
  setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>,
  discoverEnabledRef: React.RefObject<boolean>,
): Promise<Viewer> {
  var extent = Rectangle.fromDegrees(
    -79.9474941502019,
    40.44094655168858,
    -79.93932358868162,
    40.445570804400056,
  );
  Camera.DEFAULT_VIEW_RECTANGLE = extent;
  Camera.DEFAULT_VIEW_FACTOR = 0;

  Ion.defaultAccessToken = CONFIG.CESIUM_ION_TOKEN;

  const viewer = new Viewer(viewerDiv, {
    baseLayerPicker: false,
    geocoder: false, // Disable the default geocoder
    homeButton: false, // Optionally disable other widgets to clean up the UI
    sceneModePicker: false,
    navigationHelpButton: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
  });

  // Remove all the existing imagery layers and data sources.
  viewer.scene.imageryLayers.removeAll();
  viewer.dataSources.removeAll();

  // Make the globe black so that the translucent tiles are visible.
  viewer.scene.globe.baseColor = CesiumColor.fromCssColorString("#000000");

  // Add a callback to discover new maps when the camera moves.
  const discoverTilesForCurrentView = () => {
    if (discoverEnabledRef.current === false) {
      return;
    }
    discoverAndAddTiles(
      viewer,
      mapsDiscoveryObj,
      mapTilesLoadedRef,
      setMapTilesLoaded,
    );
  };

  // Add default tiles in the initial view.
  addDefaultTiles(viewer, setMapTilesLoaded);

  // Callback to disocver and add tiles when the camera moves.
  // This callback is called when the camera stops moving.
  const onCameraMoveEnd = () => {
    discoverTilesForCurrentView();
  };

  viewer.camera.moveEnd.addEventListener(onCameraMoveEnd);

  return viewer;
}

type propsType = {
  mapTilesLoaded: MapTilesLoaded;
  setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>;
  onViewerReady: (viewer: Viewer) => void;
  mapsDiscoveryObj: MapsDiscovery;
  discoverEnabled: boolean;
  googleOpacity: number;
  setGoogleOpacity: React.Dispatch<React.SetStateAction<number>>;
};

function CesiumViewer({
  mapTilesLoaded,
  setMapTilesLoaded,
  onViewerReady,
  mapsDiscoveryObj,
  discoverEnabled,
  googleOpacity: _googleOpacity,
  setGoogleOpacity,
}: propsType) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);

  // Maintain a reference to the mapTilesLoaded state to avoid stale closures.
  // That is, using just mapTilesLoaded in a callback registered in useEffect will cause using the stale value of mapTilesLoaded.
  const mapTilesLoadedRef = useRef<MapTilesLoaded>(mapTilesLoaded);
  useEffect(() => {
    mapTilesLoadedRef.current = mapTilesLoaded;
  }, [mapTilesLoaded]);

  // Similarly, maintain a reference to the discoverEnabled state.
  const discoverEnabledRef = useRef<boolean>(discoverEnabled);
  useEffect(() => {
    discoverEnabledRef.current = discoverEnabled;
  }, [discoverEnabled]);

  useEffect(() => {
    let isCleaningUp = false;
    let createdViewer: Viewer | null = null;

    if (viewerRef.current) {
      createViewer(
        viewerRef.current,
        mapsDiscoveryObj,
        mapTilesLoadedRef,
        setMapTilesLoaded,
        discoverEnabledRef,
      ).then((v) => {
        if (isCleaningUp) {
          // If unmounted before viewer was ready, destroy immediately
          try {
            v.destroy();
          } catch (_) {}
          return;
        }
        createdViewer = v;
        setViewer(v);
        onViewerReady(v);
      });
    }

    return () => {
      isCleaningUp = true;
      if (createdViewer) {
        try {
          createdViewer.destroy();
        } catch (_) {}
        createdViewer = null;
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={viewerRef} style={{ width: '100%', height: '100%' }} />
             <CustomSearchBar 
                 viewer={viewer} 
                 mapTilesLoaded={mapTilesLoaded}
                 mapsDiscoveryObj={mapsDiscoveryObj}
                 mapTilesLoadedRef={mapTilesLoadedRef}
                 setMapTilesLoaded={setMapTilesLoaded}
                 setGoogleOpacity={setGoogleOpacity}
             />
    </div>
  );
}

export default CesiumViewer;
