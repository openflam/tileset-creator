import { Cesium3DTileset, Cesium3DTileStyle, Viewer } from "cesium";
import { Card, Form, Row, Col, Image, Button, Collapse } from "react-bootstrap";
import { useState, useEffect } from "react";
import { parseCameraViewData, getCurrentCameraView, formatCameraViewData, type CameraViewData } from "../../utils/cesium/camera-utils";
import CompactLabelCard from "../labels/CompactLabelCard";
import { type LabelInfo } from "../labels/LabelCard";

const changeTilesetOpacity = (tileset: Cesium3DTileset, opacity: number) => {
  if (tileset) {
    tileset.style = new Cesium3DTileStyle({
      color: `color("white", ${opacity})`,
    });
  }
};

const changeTilesetVisibility = (
  tileset: Cesium3DTileset,
  visible: boolean,
) => {
  if (tileset) {
    tileset.show = visible;
  }
};

interface PropsType {
  mapInfo: MapInfo;
  externalOpacity?: number;
  onOpacityChange?: (opacity: number) => void;
  onAddLabel?: (cameraData: CameraViewData, labelName: string, mapUrl: string) => void;
  viewer?: Viewer;
  labels?: LabelInfo[];
  mapUrl: string;
  onDeleteLabel?: (labelId: string) => void;
  onDeleteAllLabels?: (mapUrl: string) => void;
  onSubmitLabels?: (mapUrl: string, labels: LabelInfo[]) => void;
}

function MapInfoDefault({ mapInfo, externalOpacity, onOpacityChange, onAddLabel, viewer, labels = [], mapUrl, onDeleteLabel, onDeleteAllLabels, onSubmitLabels }: PropsType) {
  const [opacity, setOpacity] = useState(1);
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [labelName, setLabelName] = useState('');
  const [cameraJsonInput, setCameraJsonInput] = useState('');

  // Sync with external opacity changes
  useEffect(() => {
    if (externalOpacity !== undefined && externalOpacity !== opacity) {
      setOpacity(externalOpacity);
      changeTilesetOpacity(mapInfo.tile as Cesium3DTileset, externalOpacity);
    }
  }, [externalOpacity, opacity, mapInfo.tile]);

  const handleAddLabel = () => {
    if (!onAddLabel || !labelName.trim() || !cameraJsonInput.trim()) {
      alert('Please fill in both the label name and camera JSON data.');
      return;
    }

    try {
      const cameraData = parseCameraViewData(cameraJsonInput.trim());
      onAddLabel(cameraData, labelName.trim(), mapUrl);
      
      // Reset form
      setLabelName('');
      setCameraJsonInput('');
      setShowAddLabel(false);
    } catch (error) {
      alert('Invalid camera JSON data. Please check the format and try again.');
      console.error('Camera JSON parsing error:', error);
    }
  };

  const handleGetCurrentCamera = () => {
    if (!viewer) {
      alert('Viewer not available');
      return;
    }

    const currentView = getCurrentCameraView(viewer);
    if (currentView) {
      const formattedJson = formatCameraViewData(currentView);
      setCameraJsonInput(formattedJson);
    } else {
      alert('Failed to get current camera view');
    }
  };

  const handleDeleteAll = () => {
    if (onDeleteAllLabels) {
      const confirmed = confirm('Are you sure you want to delete all labels for this map?');
      if (confirmed) {
        onDeleteAllLabels(mapUrl);
      }
    }
  };

  const handleSubmit = () => {
    if (onSubmitLabels) {
      const mapLabels = labels.filter(label => label.mapUrl === mapUrl);
      onSubmitLabels(mapUrl, mapLabels);
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
          <Form.Check
            type="checkbox"
            label="Show Map"
            defaultChecked={true}
            onChange={(e) => {
              changeTilesetVisibility(
                mapInfo.tile as Cesium3DTileset,
                e.target.checked,
              );
            }}
            className="mb-3"
          />

          <Form.Group>
            <Form.Label>Opacity</Form.Label>
            <Form.Range
              min={0}
              max={1}
              step={0.1}
              value={opacity}
              onChange={(e) => {
                const newOpacity = parseFloat(e.target.value);
                setOpacity(newOpacity);
                changeTilesetOpacity(
                  mapInfo.tile as Cesium3DTileset,
                  newOpacity,
                );
                onOpacityChange?.(newOpacity);
              }}
            />
          </Form.Group>

          {onAddLabel && (
            <div className="mt-3">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setShowAddLabel(!showAddLabel)}
                className="w-100"
              >
                {showAddLabel ? 'Cancel Add Label' : 'Add Label'}
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
                      style={{ fontSize: '12px', fontFamily: 'monospace' }}
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
                        setLabelName('');
                        setCameraJsonInput('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Collapse>
            </div>
          )}

          {/* Display labels for this map */}
          {(() => {
            const mapLabels = labels.filter(label => label.mapUrl === mapUrl);
            return mapLabels.length > 0 && (
              <>
                <div className="mt-3">
                  <h6 className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                    Labels ({mapLabels.length})
                  </h6>
                  {mapLabels.map(label => (
                    <CompactLabelCard key={label.id} label={label} onDelete={onDeleteLabel} />
                  ))}
                </div>
                
                {/* Action buttons */}
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
                    variant="success"
                    size="sm"
                    onClick={handleSubmit}
                    className="flex-fill"
                  >
                    Submit
                  </Button>
                </div>
              </>
            );
          })()}
        </Form>
      </Card.Body>
    </Card>
  );
}

export default MapInfoDefault;
