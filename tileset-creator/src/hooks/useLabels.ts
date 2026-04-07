import { Viewer, Cartesian3, Color, PolygonHierarchy } from "cesium";
import { createLabel } from "../utils/cesium/label";
import { type LabelInfo } from "../components/labels/LabelCard";
import { type BboxResult } from "./useBboxDrawing";

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
        if (labelToDelete.bboxEntity) {
          viewer.entities.remove(labelToDelete.bboxEntity);
        }
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
        if (label.bboxEntity) {
          viewer.entities.remove(label.bboxEntity);
        }
      });
      return prevLabels.filter((label) => label.mapUrl !== mapUrl);
    });
  };

  const labelToExportNode = (label: LabelInfo, id: number) => ({
    type: "node",
    id,
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
      ...(label.mapUrl && { map: label.mapUrl }),
      ...(label.bbox && {
        "bbox:south": label.bbox.south.toString(),
        "bbox:north": label.bbox.north.toString(),
        "bbox:west": label.bbox.west.toString(),
        "bbox:east": label.bbox.east.toString(),
        "bbox:height": label.bbox.height.toFixed(2),
        "bbox:extruded_height": label.bbox.extrudedHeight.toFixed(2),
        ...Object.fromEntries(
          label.bbox.corners.flatMap((c, i) => [
            [`bbox:corner${i + 1}_lon`, c.longitude.toString()],
            [`bbox:corner${i + 1}_lat`, c.latitude.toString()],
          ]),
        ),
      }),
    },
  });

  const handleExportLabels = (mapUrl: string, mapLabels: LabelInfo[]) => {
    if (mapLabels.length === 0) {
      alert("No labels to export for this map.");
      return;
    }

    const baseId = 1001;
    const elements = mapLabels.map((label, index) =>
      labelToExportNode(label, baseId + index),
    );

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

  const handleAddLabelFromBbox = (name: string, bbox: BboxResult, mapUrl = "") => {
    try {
      const labelId = `label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const center = bbox.center;

      const pin = createLabel({
        position: Cartesian3.fromDegrees(
          center.longitude,
          center.latitude,
          center.height + bbox.roomHeight / 2,
        ),
        text: name,
        viewer: viewer,
      });

      const bboxEntity = viewer.entities.add({
        polygon: {
          hierarchy: new PolygonHierarchy(
            bbox.corners.map((c) =>
              Cartesian3.fromDegrees(c.longitude, c.latitude),
            ),
          ),
          material: Color.CYAN.withAlpha(0.25),
          height: bbox.height,
          extrudedHeight: bbox.height + bbox.roomHeight,
          outline: true,
          outlineColor: Color.CYAN,
        },
      });

      const labelInfo: LabelInfo = {
        id: labelId,
        name,
        position: center,
        pin,
        mapUrl,
        bbox: {
          corners: bbox.corners,
          west: bbox.west,
          south: bbox.south,
          east: bbox.east,
          north: bbox.north,
          height: bbox.height,
          extrudedHeight: bbox.height + bbox.roomHeight,
        },
        bboxEntity,
      };

      handleLabelCreated(labelInfo);
    } catch (error) {
      console.error("Failed to create bbox label:", error);
      alert("Failed to create bbox label. Please try again.");
    }
  };

  const handleDeleteAllLabelsGlobal = () => {
    setLabels((prevLabels) => {
      prevLabels.forEach((label) => {
        label.pin.destroy();
        if (label.bboxEntity) {
          viewer.entities.remove(label.bboxEntity);
        }
      });
      return [];
    });
  };

  const handleExportAllLabels = () => {
    if (labels.length === 0) {
      alert("No labels to export.");
      return;
    }

    const baseId = 1001;
    const elements = labels.map((label, index) =>
      labelToExportNode(label, baseId + index),
    );

    const dataStr = JSON.stringify({ elements }, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;

    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `all-labels-${timestamp}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    handleDeleteAllLabelsGlobal,
    handleExportLabels,
    handleExportAllLabels,
    handleAddLabelFromBbox,
    getLabelsForMap,
  };
}

export default useLabels;
