import { Card, Row, Col, Image, Form, Button, Alert } from "react-bootstrap";
import { useEffect, useState, useMemo } from "react";
import * as Cesium from "cesium";
import { computeTransformFromCartographicPositionAndRotationDegrees } from "../utils/cesium/transforms";
import CONFIG from "../config";
import { getCookie } from "../utils/cookie";

interface PropsType {
  mapInfo: MapInfo;
}

function MapInfoCustom({ mapInfo }: PropsType) {
  const model = mapInfo.tile as Cesium.Model | Cesium.Cesium3DTileset;

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
    model.modelMatrix = Cesium.Matrix4.fromArray(transformArray);
  }, [params, model]);

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
      // 1. Fetch current tileset JSON
      const response = await fetch(mapInfo.url);
      if (!response.ok) {
        throw new Error("Failed to fetch original tileset JSON.");
      }
      const tilesetJson = await response.json();

      // 2. Update transform in root
      if (!tilesetJson.root) {
        throw new Error("Invalid tileset JSON: missing root.");
      }
      tilesetJson.root.transform = transformArray;

      // 3. PUT updated JSON
      const updateUrl = `${CONFIG.API_LIST_MAPS}/${mapInfo.id}/tileset`;
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
        body: JSON.stringify(tilesetJson),
      });

      if (!putResponse.ok) {
        throw new Error(`Failed to save tileset: ${putResponse.statusText}`);
      }

      setSaveStatus({ type: "success", message: "Tileset saved successfully!" });
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
  );
}

export default MapInfoCustom;
