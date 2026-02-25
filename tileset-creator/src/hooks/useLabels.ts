import { Viewer, Cartesian3 } from "cesium";
import { createLabel } from "../utils/cesium/label";
import { type CameraViewData } from "../utils/cesium/camera-utils";
import { type LabelInfo } from "../components/labels/LabelCard";

export interface UseLabelsProps {
  labels: LabelInfo[];
  setLabels: React.Dispatch<React.SetStateAction<LabelInfo[]>>;
  viewer: Viewer;
}

export function useLabels({ labels, setLabels, viewer }: UseLabelsProps) {
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
  };

  const handleDeleteLabel = (labelId: string) => {
    setLabels((prevLabels) => {
      const labelToDelete = prevLabels.find((label) => label.id === labelId);
      if (labelToDelete) {
        labelToDelete.pin.destroy();
      }
      return prevLabels.filter((label) => label.id !== labelId);
    });
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
  };

  const handleExportLabels = (mapUrl: string, mapLabels: LabelInfo[]) => {
    if (mapLabels.length === 0) {
      alert("No labels to export for this map.");
      return;
    }

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

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;

    const mapName = mapUrl.split("/").pop() || "labels";
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `${mapName}-labels-${timestamp}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
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
    } catch (error) {
      console.error("Failed to create label:", error);
      alert("Failed to create label. Please try again.");
    }
  };

  const getLabelsForMap = (mapUrl: string) => {
    return labels.filter((label) => label.mapUrl === mapUrl);
  };

  return {
    labels,
    handleLabelCreated,
    handleLabelPositionChange,
    handleDeleteLabel,
    handleDeleteAllLabels,
    handleExportLabels,
    handleAddLabelFromCamera,
    getLabelsForMap,
  };
}

export default useLabels;
