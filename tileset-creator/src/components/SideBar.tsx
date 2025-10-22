import { Viewer } from "cesium";
import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import MapInfoAuth from "./MapInfoAuth";
import MapInfoDefault from "./MapInfoDefault";
import MapInfoCustom from "./MapInfoCustom";
import AddGLBModal from "./AddGLBModal";
import AddMapServerModal from "./AddMapServerModal";
import SelectMapModal from "./SelectMapModal";
import CONFIG from "../config";

type propsType = {
  mapTilesLoaded: MapTilesLoaded;
  setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>;
  viewer: Viewer;
  discoverEnabled: boolean;
  setDiscoverEnabled: React.Dispatch<React.SetStateAction<boolean>>;
};

function SideBar({
  mapTilesLoaded,
  setMapTilesLoaded,
  viewer,
  discoverEnabled,
  setDiscoverEnabled,
}: propsType) {
  const [showAddGLBModal, setShowAddGLBModal] = useState(false);
  const [showAddMapServerModal, setShowAddMapServerModal] = useState(false);
  const [showSelectMapModal, setShowSelectMapModal] = useState(false);
  const [editEnabled, setEditEnabled] = useState(false);

  return (
    <div className="p-3">
      <div className="d-lg-flex align-items-center mb-3">
        {CONFIG.MODE === "global" && (
          <Form.Check
            type="switch"
            checked={discoverEnabled}
            label="Discover"
            className="me-3"
            onChange={() => setDiscoverEnabled(!discoverEnabled)}
          />
        )}
        <Form.Check
          type="switch"
          checked={editEnabled}
          label="Edit"
          onChange={() => setEditEnabled(!editEnabled)}
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
          .map(([url, mapInfo]) => (
            <MapInfoDefault key={url} mapInfo={mapInfo} />
          ))}

        {Object.entries(mapTilesLoaded)
          .filter(([_, mapInfo]) => mapInfo.tile && mapInfo.type === "custom")
          .map(([url, mapInfo]) => (
            <MapInfoCustom key={url} mapInfo={mapInfo} />
          ))}
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
          Select Map
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
