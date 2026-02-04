import { Viewer, Cartesian3 } from "cesium";
import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { createLabel } from "../utils/cesium/label";
import SidebarMapList from "./SidebarMapList";
import MapInfoCustom from "./MapInfoCustom";
import AddGLBModal from "./AddGLBModal";
import AddMapServerModal from "./AddMapServerModal";
import SelectMapModal from "./SelectMapModal";
import CameraInfoModal from "./search/CameraInfoModal";
import { type CameraViewData } from "../utils/cesium/camera-utils";
import { type LabelInfo } from "./labels/LabelCard";
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

  const handleLabelCreated = (labelInfo: LabelInfo) => {
    setLabels((prevLabels) => [...prevLabels, labelInfo]);
  };

  const handleLabelPositionChange = (
    labelId: string,
    position: { longitude: number; latitude: number; height: number },
  ) => {
    setLabels((prevLabels) =>
      prevLabels.map((label) => {
        if (label.id === labelId) {
          label.pin.setPosition(
            position.longitude,
            position.latitude,
            position.height,
          );
          return { ...label, position };
        }
        return label;
      }),
    );
    console.log(`📍 Updated label position: ${labelId}`, position);
  };

  const handleDeleteLabel = (labelId: string) => {
    setLabels((prevLabels) => {
      const labelToDelete = prevLabels.find((label) => label.id === labelId);
      if (labelToDelete) {
        labelToDelete.pin.destroy();
      }
      return prevLabels.filter((label) => label.id !== labelId);
    });
    console.log(`🗑️ Deleted label: ${labelId}`);
  };

  const handleDeleteAllLabels = (mapUrl: string) => {
    setLabels((prevLabels) => {
      const labelsToDelete = prevLabels.filter(
        (label) => label.mapUrl === mapUrl,
      );
      labelsToDelete.forEach((label) => {
        label.pin.destroy();
      });
      return prevLabels.filter((label) => label.mapUrl !== mapUrl);
    });
    console.log(`🗑️ Deleted all labels for map: ${mapUrl}`);
  };

  const handleExportLabels = (mapUrl: string, mapLabels: LabelInfo[]) => {
    console.log("📤 Export labels for map:", mapUrl);

    if (mapLabels.length === 0) {
      alert("No labels to export for this map.");
      return;
    }

    // Generate a base ID starting from 1001
    const baseId = 1001;

    const elements = mapLabels.map((label, index) => ({
      type: "node",
      id: baseId + index,
      lat: label.position.latitude,
      lon: label.position.longitude,
      tags: {
        indoor: "room",
        level: "2",
        ref: label.name,
        name: label.name,
        building: "university",
        height: label.position.height.toFixed(2),
        "building:levels": "3",
        "addr:city": "Pittsburgh",
        "addr:state": "PA",
        "addr:country": "US",
        amenity: "university",
        operator: "Carnegie Mellon University",
        description: `Label created at ${new Date().toISOString()}`,
      },
    }));

    const exportData = { elements };

    console.log("Export data:", exportData);

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;

    // Generate filename from map name
    const mapName = mapUrl.split("/").pop() || "labels";
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `${mapName}-labels-${timestamp}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    console.log(`✅ Exported ${mapLabels.length} labels to JSON file`);
  };

  const handleAddLabelFromCamera = (
    cameraData: CameraViewData,
    labelName: string,
    mapUrl: string,
  ) => {
    try {
      const labelId = `label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const position = {
        longitude: cameraData.position.longitude,
        latitude: cameraData.position.latitude,
        height: cameraData.position.height,
      };

      const pin = createLabel({
        position: Cartesian3.fromDegrees(
          position.longitude,
          position.latitude,
          position.height,
        ),
        text: labelName,
        viewer: viewer,
      });

      const labelInfo: LabelInfo = {
        id: labelId,
        name: labelName,
        position: position,
        orientation: {
          heading: cameraData.orientation.heading,
          pitch: cameraData.orientation.pitch,
          roll: cameraData.orientation.roll,
        },
        pin: pin,
        mapUrl: mapUrl,
      };

      handleLabelCreated(labelInfo);

      console.log("✅ Label created from camera data:", {
        name: labelName,
        position: position,
        mapUrl: mapUrl,
        cameraData: cameraData,
      });
    } catch (error) {
      console.error("❌ Failed to create label from camera data:", error);
      alert("Failed to create label. Please try again.");
    }
  };

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
            onAddLabel={handleAddLabelFromCamera}
            viewer={viewer}
            labels={labels}
            mapUrl={editingMap.url}
            onDeleteLabel={handleDeleteLabel}
            onLabelPositionChange={handleLabelPositionChange}
            onDeleteAllLabels={handleDeleteAllLabels}
            onSubmitLabels={handleExportLabels}
            editEnabled={editEnabled}
          />
        )}
      </>

      {editEnabled && CONFIG.MODE === "global" && (
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
      {editEnabled && CONFIG.MODE === "map-server" && (
        <Button
          variant="primary"
          className="w-100 mt-3"
          onClick={() => setShowSelectMapModal(true)}
        >
          List Unpublished Maps
        </Button>
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
