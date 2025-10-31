import { useEffect, useState } from "react";
import { Alert, Button, Modal, Spinner } from "react-bootstrap";
import { Viewer } from "cesium";
import { addTilesetFromMapInfo } from "../utils/cesium/add-tiles";
import CONFIG from "../config";
import { getFullUrl } from "../utils/openflame/discover.ts";

type propsType = {
  show: boolean;
  onClose: () => void;
  viewer: Viewer;
  setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>;
};

type Map = {
  id: number;
  name: string;
  description: string;
  namespace: string;
  services: {
    url: string;
    name: string;
    credentialsCookiesRequired: boolean;
  }[];
  published: boolean;
};

function SelectMapModal({
  show,
  onClose,
  viewer,
  setMapTilesLoaded,
}: propsType) {
  const [maps, setMaps] = useState<Map[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setLoading(true);
      setError(null);
      fetch(getFullUrl(CONFIG.API_LIST_MAPS, CONFIG.DEFAULT_MAP_SERVER)!)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch maps");
          }
          return response.json();
        })
        .then((data) => {
          setMaps(data.items);
          setLoading(false);
        })
        .catch((error) => {
          setError(error.message);
          setLoading(false);
        });
    }
  }, [show]);

  const handleSelectMap = (map: Map) => {
    const mapURL = `${CONFIG.DEFAULT_MAP_SERVER}${CONFIG.MAPS_SERVICES_BASE}/${map.namespace}/${map.name}`;
    const mapInfo: MapInfo = {
      name: map.name,
      commonName: map.name,
      url: getFullUrl("/tileset", mapURL)!,
      type: "default",
      credentialsCookiesRequired: true,
    };
    addTilesetFromMapInfo(viewer, mapInfo, setMapTilesLoaded);
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Select Map</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && <Spinner animation="border" />}
        {error && <Alert variant="danger">{error}</Alert>}
        {!loading &&
          !error &&
          maps.map((map) => (
            <div key={map.id} className="d-flex justify-content-between">
              <div>
                <h5>{map.name}</h5>
                <p className="ms-3">{map.description}</p>
              </div>
              <div>
                {map.published ? (
                  <Button variant="link" onClick={() => handleSelectMap(map)}>
                    <i className="bi bi-pencil-square"></i>
                  </Button>
                ) : (
                  <Button onClick={() => handleSelectMap(map)}>Place</Button>
                )}
              </div>
            </div>
          ))}
      </Modal.Body>
    </Modal>
  );
}

export default SelectMapModal;
