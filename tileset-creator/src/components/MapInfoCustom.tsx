import { Card, Row, Col, Image, Form, Button, Alert } from "react-bootstrap";
import { useEffect, useState, useMemo } from "react";
import * as Cesium from "cesium";
import { computeTransformFromCartographicPositionAndRotationDegrees, computeParametersFromTransform } from "../utils/cesium/transforms";
import { getPositionInFrontOfCamera } from "../utils/cesium/camera-view";
import CONFIG from "../config";
import { getCookie } from "../utils/cookie";

interface PropsType {
  mapInfo: MapInfo;
  viewer: Cesium.Viewer;
}

function MapInfoCustom({ mapInfo, viewer }: PropsType) {
  const model = mapInfo.tile as Cesium.Model | Cesium.Cesium3DTileset;

  // Initialize state with the model's transform, or camera position if identity/invalid
  const [params, setParams] = useState(() => {
    let initialMatrix = model.modelMatrix.clone();

    if (mapInfo.type === "default" && mapInfo.tile instanceof Cesium.Cesium3DTileset) {
        const tileset = mapInfo.tile;
        if (tileset.root && !Cesium.Matrix4.equals(tileset.root.transform, Cesium.Matrix4.IDENTITY)) {
             initialMatrix = Cesium.Matrix4.multiply(model.modelMatrix, tileset.root.transform, new Cesium.Matrix4());
        }
    }

    const pos = Cesium.Matrix4.getTranslation(initialMatrix, new Cesium.Cartesian3());
    const cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(pos);

    // If we can't get a valid cartographic position (e.g. matrix is identity/at center of earth),
    // fall back to placing in front of camera
    if (!cartographic) {
      // Use camera position utility (same as addUnplacedDefaultMapTiles)
      const { latitude, longitude, altitude } = getPositionInFrontOfCamera(viewer, 10.0);

      return {
        latitude,
        longitude,
        altitude,
        heading: 0,
        pitch: 0,
        roll: 0,
        scale: 1,
      };
    }

    // Use utility to extract all parameters including rotation and scale
    return computeParametersFromTransform(Cesium.Matrix4.toArray(initialMatrix));
  });
  const [commandCopied, setCommandCopied] = useState(false);
  const [showTransform, setShowTransform] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "danger";
    message: string;
  } | null>(null);

  // Update modelMatrix whenever params change
  useEffect(() => {
    const transformArray =
      computeTransformFromCartographicPositionAndRotationDegrees(
        [params.longitude, params.latitude, params.altitude],
        [params.heading, params.pitch, params.roll],
        params.scale,
      );

    const newMatrix = Cesium.Matrix4.fromArray(transformArray);

    if (mapInfo.type === "default" && mapInfo.tile instanceof Cesium.Cesium3DTileset) {
        const tileset = mapInfo.tile;
        if (tileset.root && !Cesium.Matrix4.equals(tileset.root.transform, Cesium.Matrix4.IDENTITY)) {
             tileset.root.transform = Cesium.Matrix4.IDENTITY.clone();
        }
    }

    model.modelMatrix = newMatrix;
  }, [params, model, mapInfo]);

  // Compute the transform matrix array
  const transformArray = useMemo(() => {
    return computeTransformFromCartographicPositionAndRotationDegrees(
      [params.longitude, params.latitude, params.altitude],
      [params.heading, params.pitch, params.roll],
      1.0, // Scale is 1.0 for the displayed matrix as per original logic/request
    );
  }, [params]);

  const handleChange = (
    e: React.ChangeEvent<HTMLElement>,
    key: keyof typeof params,
  ) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    if (!isNaN(value)) {
      setParams((prev) => ({ ...prev, [key]: value }));
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

  const handleSaveTileset = async () => {
    if (!mapInfo.id || !mapInfo.url) {
      setSaveStatus({ type: "danger", message: "Missing map ID or URL." });
      return;
    }

    setSaving(true);
    setSaveStatus(null);

    try {
      const updateUrl = `${CONFIG.API_LIST_MAPS}/${mapInfo.id}/tileset/transform`;
      const csrftoken = getCookie("csrftoken");

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (csrftoken) {
        headers["X-CSRFToken"] = csrftoken;
      }

      const putResponse = await fetch(updateUrl, {
        method: "PUT",
        headers: headers,
        credentials: "include",
        body: JSON.stringify(transformArray),
      });

      if (!putResponse.ok) {
        throw new Error(`Failed to save tileset transform: ${putResponse.statusText}`);
      }

      setSaveStatus({ type: "success", message: "Tileset transform saved successfully!" });
    } catch (error: any) {
      setSaveStatus({
        type: "danger",
        message: error.message || "Unknown error occurred.",
      });
    } finally {
      setSaving(false);
      // Clear success message after a few seconds
      setTimeout(() => {
        setSaveStatus((prev) => (prev?.type === "success" ? null : prev));
      }, 3000);
    }
  };

  return (
    <>
      <hr className="my-4" />
      <Card 
        className="w-100 mb-3" 
        style={{ 
          backgroundColor: "#f0f7ff", 
          border: "2px solid #0d6efd" 
        }}
      >
        <Card.Body>
          <h5 className="text-primary mb-3">
            <i className="bi bi-pencil-square me-2"></i>
            Adjust Transform:
          </h5>
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
            {mapInfo.type === "default" ? (
              <>
                <Button
                  variant="primary"
                  onClick={handleSaveTileset}
                  disabled={saving}
                  className="mb-3 w-100"
                >
                  {saving ? "Saving..." : "Save Tileset Transform"}
                </Button>

                {saveStatus && (
                  <Alert variant={saveStatus.type}>{saveStatus.message}</Alert>
                )}

                <div
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => setShowTransform(!showTransform)}
                >
                  <h5 className="mt-2 d-flex justify-content-between align-items-center">
                    Transform Matrix
                    <i
                      className={`bi bi-chevron-${showTransform ? "up" : "down"}`}
                    ></i>
                  </h5>
                </div>
                {showTransform && (
                  <pre
                    style={{
                      backgroundColor: "#f8f9fa",
                      padding: "10px",
                      borderRadius: "4px",
                      fontSize: "0.85rem",
                      overflowX: "auto",
                    }}
                  >
                    {JSON.stringify(transformArray, null, 2)}
                  </pre>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  type="button"
                  onClick={() => {
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
                    setTimeout(() => setCommandCopied(false), 2000);
                  }}
                >
                  Copy Tileset Command
                </Button>
                {commandCopied && (
                  <small className="text-success ms-3">Copied!</small>
                )}
              </>
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
    </>
  );
}

export default MapInfoCustom;
