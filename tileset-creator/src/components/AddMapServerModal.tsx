import { Viewer } from "cesium";
import { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

import { AddMapServer } from "../utils/openflame/discover";

type AddMapServerModalProps = {
  show: boolean;
  onClose: () => void;
  viewer: Viewer;
  setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>;
};

function AddMapServerModal({
  show,
  onClose,
  viewer,
  setMapTilesLoaded,
}: AddMapServerModalProps) {
  const [mapServerURL, setMapServerURL] = useState("");

  const handleSubmit = () => {
    AddMapServer(mapServerURL, viewer, setMapTilesLoaded);
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add Map Server</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Map Server URL</Form.Label>
            <Form.Control
              type="text"
              value={mapServerURL}
              onChange={(e) => {
                // Remove 'http://' or 'https://' if present
                if (
                  e.target.value.startsWith("http://") ||
                  e.target.value.startsWith("https://")
                ) {
                  setMapServerURL(e.target.value.replace(/^https?:\/\//, ""));
                } else {
                  setMapServerURL(e.target.value);
                }
              }}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleSubmit}>
          Add Map Server
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AddMapServerModal;
