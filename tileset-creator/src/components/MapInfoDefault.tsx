import { Cesium3DTileset, Cesium3DTileStyle } from "cesium";
import { Card, Form, Row, Col, Image, Button } from "react-bootstrap";
import CONFIG from "../config.ts";

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

// Define the type for the props
interface PropsType {
  mapInfo: MapInfo;
  setEditingMap?: React.Dispatch<React.SetStateAction<MapInfo | null>>;
}
function MapInfoDefault({ mapInfo, setEditingMap }: PropsType) {
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
          {CONFIG.MODE === "map-server" && (
            <Button
              variant="primary"
              onClick={setEditingMap ? () => setEditingMap(mapInfo) : undefined}
              className="mb-3"
            >
              Edit Map Info
            </Button>
          )}

          <Form.Group>
            <Form.Label>Opacity</Form.Label>
            <Form.Range
              min={0}
              max={1}
              step={0.1}
              defaultValue={1}
              // onChange={(e) => { changeTilesetOpacity(url, setMapTilesLoaded, parseFloat(e.target.value)); }}
              onChange={(e) => {
                changeTilesetOpacity(
                  mapInfo.tile as Cesium3DTileset,
                  parseFloat(e.target.value),
                );
              }}
            />
          </Form.Group>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default MapInfoDefault;
