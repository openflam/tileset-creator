import { Viewer, Cartesian3 } from "cesium";
import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { createLabel } from "../utils/cesium/label";
import SidebarMapList from "./SidebarMapList";
import MapInfoCustom from "./MapInfoCustom";
import MapInfoDefault from "./MapInfoDefault";
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

  const handleSubmitLabels = async (mapUrl: string, mapLabels: LabelInfo[]) => {
    console.log("📤 Submit labels for map:", mapUrl);

    try {
      const response = await fetch("/src/assets/data/example.json");
      const existingData = await response.json();

      const existingNodes = existingData.elements.filter(
        (el: any) => el.type === "node",
      );
      const maxId = Math.max(
        ...existingNodes.map((node: any) => node.id),
        1000,
      );

      const newNodes = mapLabels.map((label, index) => ({
        type: "node",
        id: maxId + index + 1,
        lat: label.position.latitude,
        lon: label.position.longitude,
        tags: {
          indoor: "room",
          level: "2",
          ref: label.id,
          name: label.name,
          height: label.position.height.toString(),
        },
      }));

      const updatedData = {
        elements: [...existingData.elements, ...newNodes],
      };

      console.log("Updated data:", updatedData);

      const dataStr = JSON.stringify(updatedData, null, 4);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "example.json";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      alert(
        `✅ Added ${mapLabels.length} labels to example.json!\n\n📝 Instructions:\n1. The updated example.json has been downloaded\n2. Replace the file in src/assets/data/example.json\n3. The new labels have IDs starting from ${maxId + 1}`,
      );
    } catch (error) {
      console.error("Error loading example.json:", error);
      alert("❌ Error: Could not load example.json file");
    }
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
                const isGoogle =
                  mapInfo.name === "Google" || mapInfo.commonName === "Google";

                return (
                  <MapInfoDefault
                    key={url}
                    mapInfo={mapInfo}
                    externalOpacity={isGoogle ? googleOpacity : undefined}
                    onOpacityChange={
                      isGoogle ? onGoogleOpacityChange : undefined
                    }
                    onAddLabel={handleAddLabelFromCamera}
                    viewer={viewer}
                    labels={labels}
                    mapUrl={url}
                    onDeleteLabel={handleDeleteLabel}
                    onLabelPositionChange={handleLabelPositionChange}
                    onDeleteAllLabels={handleDeleteAllLabels}
                    onSubmitLabels={handleSubmitLabels}
                    editEnabled={editEnabled}
                  />
                );
              })}

            {Object.entries(mapTilesLoaded)
              .filter(
                ([_, mapInfo]) => mapInfo.tile && mapInfo.type === "custom",
              )
              .map(([url, mapInfo]) => (
                <MapInfoCustom
                  key={url}
                  mapInfo={mapInfo}
                  onAddLabel={handleAddLabelFromCamera}
                  viewer={viewer}
                  labels={labels}
                  mapUrl={url}
                  onDeleteLabel={handleDeleteLabel}
                  onLabelPositionChange={handleLabelPositionChange}
                  onDeleteAllLabels={handleDeleteAllLabels}
                  onSubmitLabels={handleSubmitLabels}
                  editEnabled={editEnabled}
                />
              ))}
          </>
        )}

        {CONFIG.MODE === "map-server" && editingMap && (
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
            onSubmitLabels={handleSubmitLabels}
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
