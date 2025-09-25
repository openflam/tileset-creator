import { Cesium3DTileset, Cesium3DTileStyle } from "cesium";
import { Card, Form, Row, Col, Image } from "react-bootstrap";
import { useState, useEffect } from "react";

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
}

function MapInfoDefault({ mapInfo, externalOpacity, onOpacityChange }: PropsType) {
  const [opacity, setOpacity] = useState(1);

  // Sync with external opacity changes
  useEffect(() => {
    if (externalOpacity !== undefined && externalOpacity !== opacity) {
      setOpacity(externalOpacity);
      changeTilesetOpacity(mapInfo.tile as Cesium3DTileset, externalOpacity);
    }
  }, [externalOpacity, opacity, mapInfo.tile]);
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
        </Form>
      </Card.Body>
    </Card>
  );
}

export default MapInfoDefault;
