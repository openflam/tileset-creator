import { Viewer } from "cesium";
import { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { addTilesetFromMapInfo } from "../utils/cesium/add-tiles";
import { MapServer } from "@openflam/dnsspatialdiscovery";

import { getFullUrl } from "../utils/openflame/discover";

type AddMapServerModalProps = {
  show: boolean;
  onClose: () => void;
  viewer: Viewer;
  setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>;
  mapServersWithDiscoveryRef: React.RefObject<MapServer[]>;
};

function AddMapServerModal({
  show,
  onClose,
  viewer,
  setMapTilesLoaded,
  mapServersWithDiscoveryRef,
}: AddMapServerModalProps) {
  const [mapServerURL, setMapServerURL] = useState("");

  const handleSubmit = () => {
    const mapServer = new MapServer(mapServerURL);
    mapServer.queryCapabilities().then((_capabilities) => {
      // If it has a tileserver service, add it to the viewer.
      const tileService = mapServer.getService("tileserver");
      if (tileService) {
        const mapInfo: MapInfo = {
          name: mapServer.capabilities.commonName!,
          url: getFullUrl(tileService.url, mapServerURL)!,
          type: "default",
          key: tileService.key,
          creditImageUrl: getFullUrl(
            tileService.creditImageUrl || mapServer.capabilities.iconURL,
            mapServerURL,
          ),
          mapIconUrl: getFullUrl(mapServer.capabilities.iconURL, mapServerURL),
          credentialsCookiesRequired: true,
        };
        addTilesetFromMapInfo(viewer, mapInfo, setMapTilesLoaded);
      }

      // If it has a discovery service, add it to the list of discoveryServices.
      const discoveryService = mapServer.getService("discovery");
      if (discoveryService) {
        alert("Discovery service found. It will be used for map discovery.");
        mapServersWithDiscoveryRef.current.push(mapServer);
      }

      if (!tileService && !discoveryService) {
        alert(
          "No valid tileserver or discovery service found in the provided URL.",
        );
      }
    });
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
