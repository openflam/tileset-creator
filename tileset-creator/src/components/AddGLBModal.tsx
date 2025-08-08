import { Viewer } from "cesium";
import { useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { addTilesetFromMapInfo } from "../utils/cesium/add-tiles";
import customMapLogo from "../assets/customMap.svg";

type AddGLBModalProps = {
  show: boolean;
  onClose: () => void;
  viewer: Viewer;
  setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>;
};

function AddGLBModal({
  show,
  onClose,
  viewer,
  setMapTilesLoaded,
}: AddGLBModalProps) {
  const [mapName, setMapName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = () => {
    if (!file) {
      onClose();
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    const mapInfo: MapInfo = {
      name: mapName,
      url: objectUrl,
      type: "custom",
      mapIconUrl: customMapLogo,
    };

    addTilesetFromMapInfo(viewer, mapInfo, setMapTilesLoaded);
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add New Map</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Map Name</Form.Label>
            <Form.Control
              type="text"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Add .glb File</Form.Label>
            <Form.Control
              type="file"
              accept=".glb"
              onChange={(e) => {
                const selectedFile =
                  (e.target as HTMLInputElement).files?.[0] || null;
                setFile(selectedFile);
              }}
            />
          </Form.Group>
          <Alert variant="warning">
            Your file is not uploaded to any server. The application is running
            locally on your browser.
          </Alert>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleSubmit}>
          Add Map
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AddGLBModal;
