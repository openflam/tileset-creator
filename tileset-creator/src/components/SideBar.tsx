import { Viewer, Cartesian3 } from "cesium";
import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { createDraggablePin } from "../utils/cesium/draggable-pin";
import MapInfoAuth from "./map-info/MapInfoAuth";
import MapInfoDefault from "./map-info/MapInfoDefault";
import MapInfoCustom from "./map-info/MapInfoCustom";
import { type CameraViewData } from "../utils/cesium/camera-utils";
import AddGLBModal from "./modals/AddGLBModal";
import AddMapServerModal from "./modals/AddMapServerModal";
import CameraInfoModal from "./modals/CameraInfoModal";
import { type LabelInfo } from "./labels/LabelCard";

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
  const [showCameraInfoModal, setShowCameraInfoModal] = useState(false);
  const [editEnabled, setEditEnabled] = useState(false);


  const handleLabelCreated = (labelInfo: LabelInfo) => {
    setLabels(prevLabels => [...prevLabels, labelInfo]);
  };

  const handleLabelPositionChange = (labelId: string, position: { longitude: number; latitude: number; height: number }) => {
    setLabels(prevLabels =>
      prevLabels.map(label => {
        if (label.id === labelId) {
          // Update the 3D pin position
          label.pin.setPosition(position.longitude, position.latitude, position.height);
          return { ...label, position };
        }
        return label;
      })
    );
    console.log(`📍 Updated label position: ${labelId}`, position);
  };

  const handleDeleteLabel = (labelId: string) => {
    setLabels(prevLabels => {
      const labelToDelete = prevLabels.find(label => label.id === labelId);
      if (labelToDelete) {
        labelToDelete.pin.destroy();
      }
      return prevLabels.filter(label => label.id !== labelId);
    });
    console.log(`🗑️ Deleted label: ${labelId}`);
  };

  const handleDeleteAllLabels = (mapUrl: string) => {
    // Filter out all labels for this map and destroy their pins
    setLabels(prevLabels => {
      const labelsToDelete = prevLabels.filter(label => label.mapUrl === mapUrl);
      labelsToDelete.forEach(label => {
        label.pin.destroy();
      });
      return prevLabels.filter(label => label.mapUrl !== mapUrl);
    });
    console.log(`🗑️ Deleted all labels for map: ${mapUrl}`);
  };

  const handleSubmitLabels = async (mapUrl: string, mapLabels: LabelInfo[]) => {
    console.log('📤 Submit labels for map:', mapUrl);
    
    try {
      // Load the existing example.json file
      const response = await fetch('/src/assets/data/example.json');
      const existingData = await response.json();
      
      // Find the highest existing node ID
      const existingNodes = existingData.elements.filter((el: any) => el.type === 'node');
      const maxId = Math.max(...existingNodes.map((node: any) => node.id), 1000);
      
      // Convert labels to OSM node format
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
          height: label.position.height.toString()
        }
      }));
      
      // Add new nodes to existing elements
      const updatedData = {
        elements: [...existingData.elements, ...newNodes]
      };
      
      console.log('Updated data:', updatedData);
      
      // Create JSON file and trigger download
      const dataStr = JSON.stringify(updatedData, null, 4);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'example.json';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
      
      // Show success message with instructions
      alert(`✅ Added ${mapLabels.length} labels to example.json!\n\n📝 Instructions:\n1. The updated example.json has been downloaded\n2. Replace the file in src/assets/data/example.json\n3. The new labels have IDs starting from ${maxId + 1}`);
      
    } catch (error) {
      console.error('Error loading example.json:', error);
      alert('❌ Error: Could not load example.json file');
    }
  };

  const handleAddLabelFromCamera = (cameraData: CameraViewData, labelName: string, mapUrl: string) => {
    try {
      // Create a unique ID for the label
      const labelId = `label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Extract position from camera data
      const position = {
        longitude: cameraData.position.longitude,
        latitude: cameraData.position.latitude,
        height: cameraData.position.height
      };

      // Create the draggable pin
      const pin = createDraggablePin({
        position: Cartesian3.fromDegrees(
          position.longitude,
          position.latitude,
          position.height
        ),
        text: labelName,
        viewer: viewer
      });

      // Create the label info with orientation
      const labelInfo: LabelInfo = {
        id: labelId,
        name: labelName,
        position: position,
        orientation: {
          heading: cameraData.orientation.heading,
          pitch: cameraData.orientation.pitch,
          roll: cameraData.orientation.roll
        },
        pin: pin,
        mapUrl: mapUrl
      };

      // Add to labels list
      handleLabelCreated(labelInfo);
      
      console.log('✅ Label created from camera data:', {
        name: labelName,
        position: position,
        mapUrl: mapUrl,
        cameraData: cameraData
      });
    } catch (error) {
      console.error('❌ Failed to create label from camera data:', error);
      alert('Failed to create label. Please try again.');
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
          onClick={() => setDiscoverEnabled(!discoverEnabled)}
        />
        <Form.Check
          type="switch"
          checked={editEnabled}
          label="Edit"
          onClick={() => setEditEnabled(!editEnabled)}
        />
      </div>

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
          .filter(([_, mapInfo]) => mapInfo.tile && mapInfo.type === "custom")
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

    </div>
  );
}

export default SideBar;
