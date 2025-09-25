import { Viewer } from "cesium";
import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import MapInfoAuth from "./MapInfoAuth";
import MapInfoDefault from "./MapInfoDefault";
import MapInfoCustom from "./MapInfoCustom";
import AddGLBModal from "./AddGLBModal";
import AddMapServerModal from "./AddMapServerModal";
import CameraInfoModal from "./CameraInfoModal";

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
  const [showCameraInfoModal, setShowCameraInfoModal] = useState(false);
  const [editEnabled, setEditEnabled] = useState(false);

  return (
    <div className="p-3">
      <div className="d-lg-flex align-items-center mb-3">
        <Form.Check
          type="switch"
          checked={discoverEnabled}
          label="Discover"
          className="me-3"
          onClick={() => setDiscoverEnabled(!discoverEnabled)}
        />
        <Form.Check
          type="switch"
          checked={editEnabled}
          label="Edit"
          onClick={() => setEditEnabled(!editEnabled)}
        />
      </div>
      <>
        {Object.entries(mapTilesLoaded)
          .filter(
            ([_, mapInfo]) =>
              !mapInfo.authenticated && mapInfo.type === "default",
          )
          .map(([url, mapInfo]) => (
            <MapInfoAuth key={url} mapInfo={mapInfo} />
          ))}

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
                externalOpacity={isGoogle ? googleOpacity : undefined}
                onOpacityChange={isGoogle ? onGoogleOpacityChange : undefined}
              />
            );
          })}

        {Object.entries(mapTilesLoaded)
          .filter(([_, mapInfo]) => mapInfo.tile && mapInfo.type === "custom")
          .map(([url, mapInfo]) => (
            <MapInfoCustom key={url} mapInfo={mapInfo} />
          ))}
      </>
      {editEnabled && (
        <>
          <Button
            variant="info"
            className="w-100 mt-3"
            onClick={() => setShowCameraInfoModal(true)}
          >
            Camera Info
          </Button>

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

      <CameraInfoModal
        show={showCameraInfoModal}
        onClose={() => setShowCameraInfoModal(false)}
        viewer={viewer}
      />

      <AddGLBModal
        show={showAddGLBModal}
        onClose={() => setShowAddGLBModal(false)}
        viewer={viewer}
        setMapTilesLoaded={setMapTilesLoaded}
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
