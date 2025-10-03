import { Viewer, ScreenSpaceEventHandler, ScreenSpaceEventType, Math as CesiumMath, Cartographic, Cartesian3 } from "cesium";
import { useState, useEffect, useRef } from "react";
import { Button, Form } from "react-bootstrap";
import { createDraggablePin } from "../utils/cesium/draggable-pin";
import MapInfoAuth from "./MapInfoAuth";
import MapInfoDefault from "./MapInfoDefault";
import MapInfoCustom from "./MapInfoCustom";
import AddGLBModal from "./AddGLBModal";
import AddMapServerModal from "./AddMapServerModal";
import AddLabelModal from "./AddLabelModal";
import CameraInfoModal from "./CameraInfoModal";
import LabelCard, { type LabelInfo } from "./LabelCard";

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
  const [showAddLabelModal, setShowAddLabelModal] = useState(false);
  const [showCameraInfoModal, setShowCameraInfoModal] = useState(false);
  const [editEnabled, setEditEnabled] = useState(false);
  const [isSelectingPosition, setIsSelectingPosition] = useState(false);
  const [pendingLabelText, setPendingLabelText] = useState('');
  const positionSelectionHandler = useRef<ScreenSpaceEventHandler | null>(null);

  const handleLabelPositionChange = (id: string, position: { longitude: number; latitude: number; height: number }) => {
    setLabels(prevLabels => 
      prevLabels.map(label => {
        if (label.id === id) {
          // Update the 3D pin position
          label.pin.setPosition(position.longitude, position.latitude, position.height);
          return { ...label, position };
        }
        return label;
      })
    );
  };

  const handleLabelDelete = (id: string) => {
    setLabels(prevLabels => {
      const labelToDelete = prevLabels.find(label => label.id === id);
      if (labelToDelete) {
        // Destroy the 3D pin
        labelToDelete.pin.destroy();
      }
      return prevLabels.filter(label => label.id !== id);
    });
  };

  const handleLabelCreated = (labelInfo: LabelInfo) => {
    setLabels(prevLabels => [...prevLabels, labelInfo]);
  };

  const handleStartPositionSelection = (labelText: string) => {
    setPendingLabelText(labelText);
    setIsSelectingPosition(true);
    
    // Change cursor to crosshair to indicate selection mode
    if (viewer.canvas) {
      viewer.canvas.style.cursor = 'crosshair';
    }
    
    // Set up click handler for position selection
    positionSelectionHandler.current = new ScreenSpaceEventHandler(viewer.canvas);
    positionSelectionHandler.current.setInputAction((event: any) => {
      // Try to pick the actual terrain/surface position first
      let pickedPosition: Cartesian3 | undefined = viewer.scene.pickPosition(event.position);
      
      // If no 3D position was picked (e.g., clicking on empty space), fall back to ellipsoid
      if (!pickedPosition) {
        const ellipsoidPosition = viewer.camera.pickEllipsoid(event.position);
        if (ellipsoidPosition) {
          pickedPosition = ellipsoidPosition;
        }
      }
      
      if (pickedPosition) {
        // Convert to cartographic coordinates
        const cartographic = Cartographic.fromCartesian(pickedPosition);
        const longitude = CesiumMath.toDegrees(cartographic.longitude);
        const latitude = CesiumMath.toDegrees(cartographic.latitude);
        
        // If we picked the actual terrain, add some height above it
        // If we picked ellipsoid, use a reasonable default height
        let height = cartographic.height;
        if (height < 100) {
          // Likely picked ellipsoid (sea level), use a reasonable height
          height = 300; // 300m above sea level as default
        } else {
          // Picked actual terrain, add 50m above it
          height += 50;
        }
        
        // Create position with the calculated height
        const finalPosition = Cartesian3.fromDegrees(longitude, latitude, height);
        
        // Create the label at the calculated position
        const pin = createDraggablePin({
          position: finalPosition,
          text: labelText,
          viewer: viewer
        });

        const labelInfo: LabelInfo = {
          id: `label_${Date.now()}`,
          name: labelText,
          position: {
            longitude: parseFloat(longitude.toFixed(6)),
            latitude: parseFloat(latitude.toFixed(6)),
            height: Math.round(height)
          },
          pin: pin
        };

        handleLabelCreated(labelInfo);
        console.log('Label created at clicked position:', labelInfo.position);
      }
      
      // Clean up selection mode
      handleCancelPositionSelection();
    }, ScreenSpaceEventType.LEFT_CLICK);
  };

  const handleCancelPositionSelection = () => {
    setIsSelectingPosition(false);
    setPendingLabelText('');
    
    // Restore normal cursor
    if (viewer.canvas) {
      viewer.canvas.style.cursor = 'default';
    }
    
    // Clean up event handler
    if (positionSelectionHandler.current) {
      positionSelectionHandler.current.destroy();
      positionSelectionHandler.current = null;
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (positionSelectionHandler.current) {
        positionSelectionHandler.current.destroy();
      }
    };
  }, []);

  return (
    <div className="p-3">
      <div className="d-lg-flex align-items-center mb-3">
        <Form.Check
          type="switch"
          checked={discoverEnabled}
          label="Discover"
          className="me-3"
          onClick={() => setDiscoverEnabled(!discoverEnabled)}
        />
        <Form.Check
          type="switch"
          checked={editEnabled}
          label="Edit"
          onClick={() => setEditEnabled(!editEnabled)}
        />
      </div>

      {/* Position Selection Mode Indicator */}
      {isSelectingPosition && (
        <div className="alert alert-warning mb-3" role="alert">
          <strong>🎯 Click on the map</strong> to place "{pendingLabelText}" label.
          <Button 
            variant="outline-secondary" 
            size="sm" 
            className="ms-2"
            onClick={handleCancelPositionSelection}
          >
            Cancel
          </Button>
        </div>
      )}
      <>
        {Object.entries(mapTilesLoaded)
          .filter(
            ([_, mapInfo]) =>
              !mapInfo.authenticated && mapInfo.type === "default",
          )
          .map(([url, mapInfo]) => (
            <MapInfoAuth key={url} mapInfo={mapInfo} />
          ))}

        {Object.entries(mapTilesLoaded)
          .filter(
            ([_, mapInfo]) =>
              mapInfo.tile &&
              mapInfo.type === "default" &&
              mapInfo.authenticated,
          )
          .map(([url, mapInfo]) => {
            // Check if this is the Google tileset
            const isGoogle = mapInfo.name === 'Google' || mapInfo.commonName === 'Google';
            
            return (
              <MapInfoDefault 
                key={url} 
                mapInfo={mapInfo}
                externalOpacity={isGoogle ? googleOpacity : undefined}
                onOpacityChange={isGoogle ? onGoogleOpacityChange : undefined}
              />
            );
          })}

        {Object.entries(mapTilesLoaded)
          .filter(([_, mapInfo]) => mapInfo.tile && mapInfo.type === "custom")
          .map(([url, mapInfo]) => (
            <MapInfoCustom key={url} mapInfo={mapInfo} />
          ))}
      </>

      {/* Labels Section */}
      {labels.length > 0 && (
        <>
          <hr className="my-3" />
          <h6 className="text-muted mb-3">Labels ({labels.length})</h6>
          {labels.map(label => (
            <LabelCard
              key={label.id}
              label={label}
              onPositionChange={handleLabelPositionChange}
              onDelete={handleLabelDelete}
            />
          ))}
        </>
      )}

      {editEnabled && (
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
            variant="success"
            className="w-100 mt-3"
            onClick={() => setShowAddLabelModal(true)}
          >
            Add Label
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

      <AddMapServerModal
        show={showAddMapServerModal}
        onClose={() => setShowAddMapServerModal(false)}
        viewer={viewer}
        setMapTilesLoaded={setMapTilesLoaded}
      />

      <AddLabelModal
        show={showAddLabelModal}
        onClose={() => setShowAddLabelModal(false)}
        viewer={viewer}
        onLabelCreated={handleLabelCreated}
        onStartPositionSelection={handleStartPositionSelection}
      />
    </div>
  );
}

export default SideBar;
