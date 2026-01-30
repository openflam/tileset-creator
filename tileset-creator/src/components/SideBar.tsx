import { Viewer } from "cesium";
import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import SidebarMapList from "./SidebarMapList";
import MapInfoCustom from "./MapInfoCustom";
import AddGLBModal from "./AddGLBModal";
import AddMapServerModal from "./AddMapServerModal";
import SelectMapModal from "./SelectMapModal";
import CONFIG from "../config";
import MapInfoDefault from "./MapInfoDefault";

type propsType = {
  mapTilesLoaded: MapTilesLoaded;
  setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>;
  viewer: Viewer;
  discoverEnabled: boolean;
  setDiscoverEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  googleOpacity: number;
  onGoogleOpacityChange: (opacity: number) => void;
};

function SideBar({
  mapTilesLoaded,
  setMapTilesLoaded,
  viewer,
  discoverEnabled,
  setDiscoverEnabled,
  googleOpacity,
  onGoogleOpacityChange,
}: propsType) {
  const [showAddGLBModal, setShowAddGLBModal] = useState(false);
  const [showAddMapServerModal, setShowAddMapServerModal] = useState(false);
  const [showSelectMapModal, setShowSelectMapModal] = useState(false);
  const [editEnabled, setEditEnabled] = useState(CONFIG.MODE === "map-server");
  const [editingMap, setEditingMap] = useState<MapInfo | null>(null);


  return (
    <div className="p-3">
      <div className="d-lg-flex align-items-center mb-3">
        <Form.Check
          type="switch"
          checked={discoverEnabled}
          label="Discover"
          className="me-3"
          onChange={() => setDiscoverEnabled(!discoverEnabled)}
        />

        <Form.Check
          type="switch"
          checked={editEnabled}
          label="Edit"
          onChange={() => setEditEnabled(!editEnabled)}
        />
      </div>

      <>
        <SidebarMapList
          mapTilesLoaded={mapTilesLoaded}
          viewer={viewer}
          setEditingMap={setEditingMap}
        />

        {CONFIG.MODE === "global" && (
          <>
            {Object.entries(mapTilesLoaded)
              .filter(
                ([_, mapInfo]) =>
                  mapInfo.tile &&
                  mapInfo.type === "default" &&
                  mapInfo.authenticated,
              )
              .map(([url, mapInfo]) => {
                // Check if this is the Google tileset
                const isGoogle = mapInfo.name === 'Google' || mapInfo.commonName === 'Google';
                
                return (
                  <MapInfoDefault 
                    key={url} 
                    mapInfo={mapInfo}
                    setEditingMap={CONFIG.MODE === "map-server" ? setEditingMap : undefined}
                    onVisibilityChange={() => {}}
                  />
                );
              })}

            {Object.entries(mapTilesLoaded)
              .filter(([_, mapInfo]) => mapInfo.tile && mapInfo.type === "custom")
              .map(([url, mapInfo]) => (
                <MapInfoCustom 
                  key={url} 
                  mapInfo={mapInfo} 
                  viewer={viewer}
                />
              ))}
          </>
        )}

        {CONFIG.MODE === "map-server" && editingMap && (
          <MapInfoCustom key={editingMap.url} mapInfo={editingMap} viewer={viewer} />
        )}
      </>

      {editEnabled && CONFIG.MODE === "global" && (
        <>
          <Button
            variant="primary"
            className="w-100 mt-3"
            onClick={() => setShowAddGLBModal(true)}
          >
            Add GLB
          </Button>

          <Button
            variant="primary"
            className="w-100 mt-3"
            onClick={() => setShowAddMapServerModal(true)}
          >
            Add Map Server
          </Button>
        </>
      )}
      {editEnabled && CONFIG.MODE === "map-server" && (
        <Button
          variant="primary"
          className="w-100 mt-3"
          onClick={() => setShowSelectMapModal(true)}
        >
          List Unpublished Maps
        </Button>
      )}

      <AddGLBModal
        show={showAddGLBModal}
        onClose={() => setShowAddGLBModal(false)}
        viewer={viewer}
        setMapTilesLoaded={setMapTilesLoaded}
      />

      <SelectMapModal
        show={showSelectMapModal}
        onClose={() => setShowSelectMapModal(false)}
        viewer={viewer}
        setMapTilesLoaded={setMapTilesLoaded}
        setEditingMap={setEditingMap}
      />

      <AddMapServerModal
        show={showAddMapServerModal}
        onClose={() => setShowAddMapServerModal(false)}
        viewer={viewer}
        setMapTilesLoaded={setMapTilesLoaded}
      />

    </div>
  );
}

export default SideBar;
