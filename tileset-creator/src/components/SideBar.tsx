import { Viewer } from "cesium";
import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import SidebarMapList from "./SidebarMapList";
import MapInfoCustom from "./MapInfoCustom";
import AddGLBModal from "./AddGLBModal";
import AddMapServerModal from "./AddMapServerModal";
import SelectMapModal from "./SelectMapModal";
import CameraInfoModal from "./search/CameraInfoModal";
import { type LabelInfo } from "./labels/LabelCard";
import { useLabels } from "../hooks/useLabels";
import CONFIG from "../config";

type propsType = {
  mapTilesLoaded: MapTilesLoaded;
  setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>;
  viewer: Viewer;
  discoverEnabled: boolean;
  setDiscoverEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  googleOpacity: number;
  onGoogleOpacityChange: (opacity: number) => void;
  labels: LabelInfo[];
  setLabels: React.Dispatch<React.SetStateAction<LabelInfo[]>>;
};

function SideBar({
  mapTilesLoaded,
  setMapTilesLoaded,
  viewer,
  discoverEnabled,
  setDiscoverEnabled,
  googleOpacity,
  onGoogleOpacityChange,
  labels,
  setLabels,
}: propsType) {
  const [showAddGLBModal, setShowAddGLBModal] = useState(false);
  const [showAddMapServerModal, setShowAddMapServerModal] = useState(false);
  const [showSelectMapModal, setShowSelectMapModal] = useState(false);
  const [showCameraInfoModal, setShowCameraInfoModal] = useState(false);
  const [editEnabled, setEditEnabled] = useState(CONFIG.MODE === "map-server");
  const [editingMap, setEditingMap] = useState<MapInfo | null>(null);

  const {
    handleLabelPositionChange,
    handleDeleteLabel,
    handleDeleteAllLabels,
    handleExportLabels,
    handleAddLabelFromCamera,
  } = useLabels({ labels, setLabels, viewer });

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

        {CONFIG.MODE === "map-server" && (
          <Form.Check
            type="switch"
            checked={editEnabled}
            label="Edit"
            onChange={() => setEditEnabled(!editEnabled)}
          />
        )}
      </div>

      <SidebarMapList
        mapTilesLoaded={mapTilesLoaded}
        viewer={viewer}
        setEditingMap={setEditingMap}
        labels={labels}
        editEnabled={editEnabled}
        onAddLabel={handleAddLabelFromCamera}
        onDeleteLabel={handleDeleteLabel}
        onLabelPositionChange={handleLabelPositionChange}
        onDeleteAllLabels={handleDeleteAllLabels}
        onSubmitLabels={handleExportLabels}
        googleOpacity={googleOpacity}
        onGoogleOpacityChange={onGoogleOpacityChange}
      />

      {CONFIG.MODE === "map-server" && editingMap && editingMap.url && (
        <MapInfoCustom
          key={editingMap.url}
          mapInfo={editingMap}
          viewer={viewer}
        />
      )}

      {editEnabled && CONFIG.MODE === "map-server" && (
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

          <Button
            variant="primary"
            className="w-100 mt-3"
            onClick={() => setShowSelectMapModal(true)}
          >
            List Unpublished Maps
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
