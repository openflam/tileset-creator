import { Viewer } from "cesium";
import { useState } from "react";
import { Alert, Button, ButtonGroup, Card, Collapse, Form } from "react-bootstrap";
import SidebarMapList from "./SidebarMapList";
import MapInfoCustom from "./MapInfoCustom";
import AddGLBModal from "./AddGLBModal";
import AddMapServerModal from "./AddMapServerModal";
import SelectMapModal from "./SelectMapModal";
import CameraInfoModal from "./search/CameraInfoModal";
import CompactLabelCard from "./labels/CompactLabelCard";
import { type LabelInfo } from "./labels/LabelCard";
import { useLabels } from "../hooks/useLabels";
import { useBboxDrawing } from "../hooks/useBboxDrawing";
import {
  parseCameraViewData,
  getCurrentCameraView,
  formatCameraViewData,
} from "../utils/cesium/camera-utils";
import CONFIG from "../config";

type propsType = {
  mapTilesLoaded: MapTilesLoaded;
  setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>;
  viewer: Viewer;
  discoverEnabled: boolean;
  setDiscoverEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  googleOpacity: number;
  onGoogleOpacityChange: (opacity: number) => void;
  mapOpacities: Record<string, number>;
  onMapOpacityChange: (url: string, opacity: number) => void;
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
  mapOpacities,
  onMapOpacityChange,
  labels,
  setLabels,
}: propsType) {
  const [showAddGLBModal, setShowAddGLBModal] = useState(false);
  const [showAddMapServerModal, setShowAddMapServerModal] = useState(false);
  const [showSelectMapModal, setShowSelectMapModal] = useState(false);
  const [showCameraInfoModal, setShowCameraInfoModal] = useState(false);
  const [editEnabled, setEditEnabled] = useState(CONFIG.MODE === "map-server");
  const [editingMap, setEditingMap] = useState<MapInfo | null>(null);

  const [showAddLabel, setShowAddLabel] = useState(false);
  const [labelMode, setLabelMode] = useState<"single" | "bbox">("single");
  const [labelName, setLabelName] = useState("");
  const [selectedMapUrl, setSelectedMapUrl] = useState("");
  const [cameraJsonInput, setCameraJsonInput] = useState("");
  const [lonOffset, setLonOffset] = useState(0);
  const [latOffset, setLatOffset] = useState(0);
  const [altOffset, setAltOffset] = useState(0);

  const {
    handleLabelPositionChange,
    handleDeleteLabel,
    handleDeleteAllLabelsGlobal,
    handleExportAllLabels,
    handleAddLabelFromCamera,
    handleAddLabelFromBbox,
  } = useLabels({ labels, setLabels, viewer });

  const {
    drawingPhase,
    bboxResult,
    cornersCount,
    startDrawing,
    cancelDrawing: cancelBboxDrawing,
    updateRoomHeight,
    updateBboxWidth,
    updateBboxDepth,
    shiftLon,
    shiftLat,
    shiftAltitude,
    redraw,
    removePreviewEntity,
  } = useBboxDrawing(viewer);

  const handleGetCurrentCamera = () => {
    const currentView = getCurrentCameraView(viewer);
    if (currentView) {
      setCameraJsonInput(formatCameraViewData(currentView));
    }
  };

  const handleAddSingleLabel = () => {
    if (!labelName.trim() || !cameraJsonInput.trim()) {
      alert("Please fill in both the label name and camera JSON data.");
      return;
    }
    try {
      const cameraData = parseCameraViewData(cameraJsonInput.trim());
      handleAddLabelFromCamera(cameraData, labelName.trim(), selectedMapUrl);
      resetAddLabelForm();
    } catch {
      alert("Invalid camera JSON data. Please check the format and try again.");
    }
  };

  const handleCreateBboxLabel = () => {
    if (!labelName.trim() || !bboxResult) return;
    handleAddLabelFromBbox(labelName.trim(), bboxResult, selectedMapUrl);
    removePreviewEntity();
    resetAddLabelForm();
  };

  const handleLonSlider = (value: number) => {
    shiftLon(value - lonOffset);
    setLonOffset(value);
  };

  const handleLatSlider = (value: number) => {
    shiftLat(value - latOffset);
    setLatOffset(value);
  };

  const handleAltSlider = (value: number) => {
    shiftAltitude(value - altOffset);
    setAltOffset(value);
  };

  const resetShiftOffsets = () => {
    setLonOffset(0);
    setLatOffset(0);
    setAltOffset(0);
  };

  const resetAddLabelForm = () => {
    setLabelName("");
    setSelectedMapUrl("");
    setCameraJsonInput("");
    setShowAddLabel(false);
    resetShiftOffsets();
    if (drawingPhase !== "idle") {
      cancelBboxDrawing();
    }
  };

  const handleDeleteAll = () => {
    if (confirm("Are you sure you want to delete all labels?")) {
      handleDeleteAllLabelsGlobal();
    }
  };

  const handleModeSwitch = (mode: "single" | "bbox") => {
    if (drawingPhase === "drawing") {
      cancelBboxDrawing();
    }
    setLabelMode(mode);
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
        googleOpacity={googleOpacity}
        onGoogleOpacityChange={onGoogleOpacityChange}
        mapOpacities={mapOpacities}
        onMapOpacityChange={onMapOpacityChange}
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

      {/* Unified Labels Section */}
      {editEnabled && (
        <Card className="mt-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Labels ({labels.length})</h6>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  if (showAddLabel) {
                    resetAddLabelForm();
                  } else {
                    setShowAddLabel(true);
                  }
                }}
              >
                {showAddLabel ? "Cancel" : "Add Label"}
              </Button>
            </div>

            <Collapse in={showAddLabel}>
              <div className="mb-3">
                {/* Mode selector */}
                <ButtonGroup size="sm" className="w-100 mb-3">
                  <Button
                    variant={labelMode === "single" ? "primary" : "outline-primary"}
                    onClick={() => handleModeSwitch("single")}
                  >
                    Single View
                  </Button>
                  <Button
                    variant={labelMode === "bbox" ? "primary" : "outline-primary"}
                    onClick={() => handleModeSwitch("bbox")}
                  >
                    BBox
                  </Button>
                </ButtonGroup>

                {/* === Single View Mode === */}
                {labelMode === "single" && (
                  <>
                    <Form.Group className="mb-2">
                      <Form.Label style={{ fontSize: "0.85rem" }}>
                        Label Name
                      </Form.Label>
                      <Form.Control
                        type="text"
                        size="sm"
                        placeholder="Enter label name"
                        value={labelName}
                        onChange={(e) => setLabelName(e.target.value)}
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label style={{ fontSize: "0.85rem" }}>
                        Map
                      </Form.Label>
                      <Form.Select
                        size="sm"
                        value={selectedMapUrl}
                        onChange={(e) => setSelectedMapUrl(e.target.value)}
                      >
                        <option value="">-- None --</option>
                        {Object.entries(mapTilesLoaded).map(
                          ([url, info]) => (
                            <option key={url} value={url}>
                              {info.name || info.commonName || url}
                            </option>
                          ),
                        )}
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <Form.Label
                          className="mb-0"
                          style={{ fontSize: "0.85rem" }}
                        >
                          Camera View JSON
                        </Form.Label>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={handleGetCurrentCamera}
                          title="Get current camera view"
                          style={{ fontSize: "0.75rem" }}
                        >
                          Get Current View
                        </Button>
                      </div>
                      <Form.Control
                        as="textarea"
                        rows={6}
                        placeholder="Paste camera JSON data here..."
                        value={cameraJsonInput}
                        onChange={(e) => setCameraJsonInput(e.target.value)}
                        style={{ fontSize: "11px", fontFamily: "monospace" }}
                      />
                    </Form.Group>

                    <div className="d-flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={handleAddSingleLabel}
                        disabled={
                          !labelName.trim() || !cameraJsonInput.trim()
                        }
                      >
                        Create Label
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={resetAddLabelForm}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}

                {/* === BBox Mode === */}
                {labelMode === "bbox" && (
                  <>
                    {drawingPhase === "idle" && (
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="w-100"
                        onClick={startDrawing}
                      >
                        Start Drawing on Map
                      </Button>
                    )}

                    {drawingPhase === "drawing" && (
                      <>
                        <Alert variant="info" className="py-2 mb-2">
                          <small>
                            Click <strong>corner {cornersCount + 1}</strong> of
                            4 on the map
                          </small>
                        </Alert>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="w-100 mt-1"
                          onClick={cancelBboxDrawing}
                        >
                          Cancel Drawing
                        </Button>
                      </>
                    )}

                    {drawingPhase === "complete" && bboxResult && (
                      <>
                        <Alert variant="success" className="py-2 mb-2">
                          <small>BBox drawn successfully</small>
                        </Alert>

                        <div
                          className="mb-2 p-2 rounded"
                          style={{
                            fontSize: "0.75rem",
                            fontFamily: "monospace",
                            backgroundColor: "#f8f9fa",
                          }}
                        >
                          <div>
                            Center: {bboxResult.center.longitude.toFixed(6)},{" "}
                            {bboxResult.center.latitude.toFixed(6)}
                          </div>
                          <div>
                            Altitude: {bboxResult.height.toFixed(2)}m
                          </div>
                        </div>

                        {/* Size controls */}
                        <Form.Group className="mb-2">
                          <Form.Label style={{ fontSize: "0.85rem" }}>
                            Width: {bboxResult.widthMeters.toFixed(1)}m
                          </Form.Label>
                          <Form.Range
                            min={1}
                            max={50}
                            step={0.5}
                            value={bboxResult.widthMeters}
                            onChange={(e) =>
                              updateBboxWidth(parseFloat(e.target.value))
                            }
                          />
                        </Form.Group>

                        <Form.Group className="mb-2">
                          <Form.Label style={{ fontSize: "0.85rem" }}>
                            Depth: {bboxResult.depthMeters.toFixed(1)}m
                          </Form.Label>
                          <Form.Range
                            min={1}
                            max={50}
                            step={0.5}
                            value={bboxResult.depthMeters}
                            onChange={(e) =>
                              updateBboxDepth(parseFloat(e.target.value))
                            }
                          />
                        </Form.Group>

                        <Form.Group className="mb-2">
                          <Form.Label style={{ fontSize: "0.85rem" }}>
                            Room Height: {bboxResult.roomHeight}m
                          </Form.Label>
                          <Form.Range
                            min={1}
                            max={15}
                            step={0.5}
                            value={bboxResult.roomHeight}
                            onChange={(e) =>
                              updateRoomHeight(parseFloat(e.target.value))
                            }
                          />
                        </Form.Group>

                        {/* Position shift controls */}
                        <hr className="my-2" />
                        <small
                          className="text-muted d-block mb-1"
                          style={{ fontSize: "0.8rem" }}
                        >
                          Shift Position
                        </small>

                        <Form.Group className="mb-2">
                          <Form.Label style={{ fontSize: "0.85rem" }}>
                            East-West: {lonOffset > 0 ? "+" : ""}
                            {lonOffset.toFixed(1)}m
                          </Form.Label>
                          <Form.Range
                            min={-20}
                            max={20}
                            step={0.5}
                            value={lonOffset}
                            onChange={(e) =>
                              handleLonSlider(parseFloat(e.target.value))
                            }
                          />
                        </Form.Group>

                        <Form.Group className="mb-2">
                          <Form.Label style={{ fontSize: "0.85rem" }}>
                            North-South: {latOffset > 0 ? "+" : ""}
                            {latOffset.toFixed(1)}m
                          </Form.Label>
                          <Form.Range
                            min={-20}
                            max={20}
                            step={0.5}
                            value={latOffset}
                            onChange={(e) =>
                              handleLatSlider(parseFloat(e.target.value))
                            }
                          />
                        </Form.Group>

                        <Form.Group className="mb-2">
                          <Form.Label style={{ fontSize: "0.85rem" }}>
                            Altitude: {altOffset > 0 ? "+" : ""}
                            {altOffset.toFixed(1)}m
                          </Form.Label>
                          <Form.Range
                            min={-20}
                            max={20}
                            step={0.5}
                            value={altOffset}
                            onChange={(e) =>
                              handleAltSlider(parseFloat(e.target.value))
                            }
                          />
                        </Form.Group>

                        <hr className="my-2" />

                        <Form.Group className="mb-2">
                          <Form.Label style={{ fontSize: "0.85rem" }}>
                            Label Name
                          </Form.Label>
                          <Form.Control
                            type="text"
                            size="sm"
                            placeholder="Enter label name"
                            value={labelName}
                            onChange={(e) => setLabelName(e.target.value)}
                          />
                        </Form.Group>

                        <Form.Group className="mb-2">
                          <Form.Label style={{ fontSize: "0.85rem" }}>
                            Map
                          </Form.Label>
                          <Form.Select
                            size="sm"
                            value={selectedMapUrl}
                            onChange={(e) =>
                              setSelectedMapUrl(e.target.value)
                            }
                          >
                            <option value="">-- None --</option>
                            {Object.entries(mapTilesLoaded).map(
                              ([url, info]) => (
                                <option key={url} value={url}>
                                  {info.name || info.commonName || url}
                                </option>
                              ),
                            )}
                          </Form.Select>
                        </Form.Group>

                        <div className="d-flex gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={handleCreateBboxLabel}
                            disabled={!labelName.trim()}
                          >
                            Create Label
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => {
                              redraw();
                              resetShiftOffsets();
                              startDrawing();
                            }}
                          >
                            Redraw
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={resetAddLabelForm}
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </Collapse>

            {labels.length > 0 ? (
              <>
                <div className="d-flex flex-column gap-1">
                  {labels.map((label) => (
                    <CompactLabelCard
                      key={label.id}
                      label={label}
                      onDelete={handleDeleteLabel}
                      onPositionChange={handleLabelPositionChange}
                      viewer={viewer}
                    />
                  ))}
                </div>

                <div className="d-flex gap-2 mt-3">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDeleteAll}
                    className="flex-fill"
                  >
                    Delete All
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleExportAllLabels}
                    className="flex-fill"
                  >
                    Export
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
                No labels added yet.
              </p>
            )}
          </Card.Body>
        </Card>
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
