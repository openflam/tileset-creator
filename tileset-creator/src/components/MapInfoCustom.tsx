import { Card, Row, Col, Image, Form, Button, Collapse } from "react-bootstrap";
import { useEffect, useState } from "react";
import * as Cesium from "cesium";
import {
  parseCameraViewData,
  getCurrentCameraView,
  formatCameraViewData,
  type CameraViewData,
} from "../utils/cesium/camera-utils";
import CompactLabelCard from "./labels/CompactLabelCard";
import { type LabelInfo } from "./labels/LabelCard";

interface PropsType {
  mapInfo: MapInfo;
  onAddLabel?: (
    cameraData: CameraViewData,
    labelName: string,
    mapUrl: string,
  ) => void;
  viewer?: Cesium.Viewer;
  labels?: LabelInfo[];
  mapUrl: string;
  onDeleteLabel?: (labelId: string) => void;
  onLabelPositionChange?: (
    labelId: string,
    position: { longitude: number; latitude: number; height: number },
  ) => void;
  onDeleteAllLabels?: (mapUrl: string) => void;
  onSubmitLabels?: (mapUrl: string, labels: LabelInfo[]) => void;
  editEnabled?: boolean;
}

function MapInfoCustom({
  mapInfo,
  onAddLabel,
  viewer,
  labels = [],
  mapUrl,
  onDeleteLabel,
  onLabelPositionChange,
  onDeleteAllLabels,
  onSubmitLabels,
  editEnabled = false,
}: PropsType) {
  const model = mapInfo.tile as Cesium.Model;

  // Initialize state with the model's transform
  const [params, setParams] = useState(() => {
    const matrix = model.modelMatrix.clone();
    const pos = Cesium.Matrix4.getTranslation(matrix, new Cesium.Cartesian3());
    const cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(pos);

    return {
      latitude: Cesium.Math.toDegrees(cartographic.latitude),
      longitude: Cesium.Math.toDegrees(cartographic.longitude),
      altitude: cartographic.height,
      heading: 0,
      pitch: 0,
      roll: 0,
      scale: 1,
    };
  });
  const [commandCopied, setCommandCopied] = useState(false);
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [labelName, setLabelName] = useState("");
  const [cameraJsonInput, setCameraJsonInput] = useState("");

  // Update modelMatrix whenever params change
  useEffect(() => {
    const position = Cesium.Cartesian3.fromDegrees(
      params.longitude,
      params.latitude,
      params.altitude,
    );
    const hpr = new Cesium.HeadingPitchRoll(
      Cesium.Math.toRadians(params.heading),
      Cesium.Math.toRadians(params.pitch),
      Cesium.Math.toRadians(params.roll),
    );
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(
      position,
      hpr,
    );
    const scale = new Cesium.Cartesian3(
      params.scale,
      params.scale,
      params.scale,
    );
    model.modelMatrix = Cesium.Matrix4.fromTranslationQuaternionRotationScale(
      position,
      orientation,
      scale,
    );
  }, [params, model]);

  const handleChange = (
    e: React.ChangeEvent<HTMLElement>,
    key: keyof typeof params,
  ) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    if (!isNaN(value)) {
      setParams((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleAddLabel = () => {
    if (!onAddLabel || !labelName.trim() || !cameraJsonInput.trim()) {
      alert("Please fill in both the label name and camera JSON data.");
      return;
    }

    try {
      const cameraData = parseCameraViewData(cameraJsonInput.trim());
      onAddLabel(cameraData, labelName.trim(), mapUrl);

      // Reset form
      setLabelName("");
      setCameraJsonInput("");
      setShowAddLabel(false);
    } catch (error) {
      alert("Invalid camera JSON data. Please check the format and try again.");
      console.error("Camera JSON parsing error:", error);
    }
  };

  const handleGetCurrentCamera = () => {
    if (!viewer) {
      alert("Viewer not available");
      return;
    }

    const currentView = getCurrentCameraView(viewer);
    if (currentView) {
      const formattedJson = formatCameraViewData(currentView);
      setCameraJsonInput(formattedJson);
    } else {
      alert("Failed to get current camera view");
    }
  };

  const handleDeleteAll = () => {
    if (onDeleteAllLabels) {
      const confirmed = confirm(
        "Are you sure you want to delete all labels for this map?",
      );
      if (confirmed) {
        onDeleteAllLabels(mapUrl);
      }
    }
  };

  const handleSubmit = () => {
    if (onSubmitLabels) {
      const mapLabels = labels.filter((label) => label.mapUrl === mapUrl);
      onSubmitLabels(mapUrl, mapLabels);
    }
  };

  const renderControl = (label: string, key: keyof typeof params) => {
    let step = 0.1; // default step

    if (key === "latitude" || key === "longitude") step = 0.00001;
    else if (key === "altitude") step = 1;
    else if (key === "heading" || key === "pitch" || key === "roll") step = 1;
    else if (key === "scale") step = 0.1;

    return (
      <Form.Group className="mb-2" controlId={`form-${key}`}>
        <Form.Label>{label}</Form.Label>
        <Form.Control
          type="number"
          value={params[key]}
          // onMouseDown={e => handleMouseDown(e, key)}
          onChange={(e) => handleChange(e, key)}
          step={step}
        />
      </Form.Group>
    );
  };

  return (
    <Card className="w-100 mb-3">
      <Card.Body>
        <Row className="align-items-center mb-3">
          <Col xs="auto">
            <Image
              src={mapInfo.mapIconUrl}
              alt={mapInfo.name}
              rounded
              style={{ width: "60px", height: "60px", objectFit: "contain" }}
            />
          </Col>
          <Col>
            <Card.Title className="mb-0">{mapInfo.commonName}</Card.Title>
          </Col>
        </Row>

        <Form>
          <h5 className="mt-3">Location</h5>
          <Row>
            <Col md={12}>{renderControl("Latitude (°)", "latitude")}</Col>
          </Row>
          <Row>
            <Col md={12}>{renderControl("Longitude (°)", "longitude")}</Col>
          </Row>
          <Row>
            <Col md={12}>{renderControl("Altitude (m)", "altitude")}</Col>
          </Row>

          <h5 className="mt-4">Rotation</h5>
          <Row>
            <Col md={12}>{renderControl("Heading (°)", "heading")}</Col>
          </Row>
          <Row>
            <Col md={12}>{renderControl("Pitch (°)", "pitch")}</Col>
          </Row>
          <Row>
            <Col md={12}>{renderControl("Roll (°)", "roll")}</Col>
          </Row>

          <h5 className="mt-4">Scale</h5>
          <Row>
            <Col md={12}>{renderControl("Scale", "scale")}</Col>
          </Row>
        </Form>

        <Row className="mt-4">
          <Col>
            <Button
              variant="primary"
              type="button"
              onClick={() => {
                // Create the command string.
                // The heading is adjusted by -90 degrees. Not sure why, but it seems to
                // be necessary to align the model correctly.
                const command =
                  "npx 3d-tiles-tools createTilesetJson " +
                  "-i mesh.glb " +
                  "-o tileset.json " +
                  "--cartographicPositionDegrees " +
                  `${params.longitude} ${params.latitude} ${params.altitude} ` +
                  "--rotationDegrees " +
                  `${params.heading - 90} ${params.pitch} ${params.roll}`;
                navigator.clipboard.writeText(command);
                setCommandCopied(true);
                setTimeout(() => setCommandCopied(false), 2000); // hide after 2 seconds
              }}
            >
              Copy Tileset Command
            </Button>
            {commandCopied && (
              <small className="text-success ms-3">Copied!</small>
            )}
          </Col>
        </Row>

        {editEnabled && onAddLabel && (
          <Row className="mt-3">
            <Col>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setShowAddLabel(!showAddLabel)}
                className="w-100"
              >
                {showAddLabel ? "Cancel Add Label" : "Add Label"}
              </Button>

              <Collapse in={showAddLabel}>
                <div className="mt-3">
                  <Form.Group className="mb-3">
                    <Form.Label>Label Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter label name"
                      value={labelName}
                      onChange={(e) => setLabelName(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Form.Label className="mb-0">Camera View JSON</Form.Label>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={handleGetCurrentCamera}
                        disabled={!viewer}
                        title="Get current camera view"
                      >
                        📷 Get Current View
                      </Button>
                    </div>
                    <Form.Control
                      as="textarea"
                      rows={8}
                      placeholder="Paste camera JSON data here..."
                      value={cameraJsonInput}
                      onChange={(e) => setCameraJsonInput(e.target.value)}
                      style={{ fontSize: "12px", fontFamily: "monospace" }}
                    />
                  </Form.Group>

                  <div className="d-flex gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={handleAddLabel}
                      disabled={!labelName.trim() || !cameraJsonInput.trim()}
                    >
                      Create Label
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowAddLabel(false);
                        setLabelName("");
                        setCameraJsonInput("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Collapse>
            </Col>
          </Row>
        )}

        {/* Display labels for this map */}
        {editEnabled &&
          (() => {
            const mapLabels = labels.filter((label) => label.mapUrl === mapUrl);
            return (
              mapLabels.length > 0 && (
                <>
                  <Row className="mt-3">
                    <Col>
                      <h6
                        className="text-muted mb-2"
                        style={{ fontSize: "0.85rem" }}
                      >
                        Labels ({mapLabels.length})
                      </h6>
                      {mapLabels.map((label) => (
                        <CompactLabelCard
                          key={label.id}
                          label={label}
                          onDelete={onDeleteLabel}
                          onPositionChange={onLabelPositionChange}
                          viewer={viewer}
                        />
                      ))}
                    </Col>
                  </Row>

                  {/* Action buttons */}
                  <Row className="mt-3">
                    <Col>
                      <div className="d-flex gap-2">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={handleDeleteAll}
                          className="flex-fill"
                        >
                          Delete All
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={handleSubmit}
                          className="flex-fill"
                        >
                          Submit
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </>
              )
            );
          })()}
      </Card.Body>
    </Card>
  );
}

export default MapInfoCustom;
