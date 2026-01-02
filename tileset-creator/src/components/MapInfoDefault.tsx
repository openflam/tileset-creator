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
  onVisibilityChange?: () => void;
}
function MapInfoDefault({ mapInfo, setEditingMap, onVisibilityChange }: PropsType) {
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
             <div className="d-flex align-items-center mb-0">
                {/* Visibility Toggle Icon */}
                <div 
                  className="me-2 cursor-pointer" 
                  style={{ cursor: "pointer", fontSize: "1.2rem", lineHeight: 1 }}
                  onClick={(e) => {
                    const newVisible = !mapInfo.tile?.show; // Access current state
                    changeTilesetVisibility(
                        mapInfo.tile as Cesium3DTileset, 
                        newVisible
                    );
                    // Force update? mapInfo.tile.show is internal cesium state. 
                    // We might need local state to reflect icon change immediately if not reactive.
                    e.currentTarget.innerHTML = newVisible 
                        ? '<i class="bi bi-eye"></i>' 
                        : '<i class="bi bi-eye-slash"></i>';
                    
                    if (onVisibilityChange) onVisibilityChange();
                  }}
                >
                   {/* Initial Render Check */}
                   <i className={`bi ${mapInfo.tile?.show !== false ? "bi-eye" : "bi-eye-slash"}`}></i>
                </div>

                {/* Opacity Slider */}
                <Form.Range
                    className="flex-grow-1"
                    min={0}
                    max={1}
                    step={0.1}
                    defaultValue={1}
                    onChange={(e) => {
                        changeTilesetVisibility(mapInfo.tile as Cesium3DTileset, true); // Ensure visible when sliding
                        changeTilesetOpacity(
                        mapInfo.tile as Cesium3DTileset,
                        parseFloat(e.target.value),
                        );
                    }}
                />
            </div>

          {CONFIG.MODE === "map-server" && !mapInfo.key && (
            <Button
              variant="primary"
              size="sm"
              onClick={setEditingMap ? () => setEditingMap(mapInfo) : undefined}
              className="mb-0 mt-2"
            >
              Adjust map transform
            </Button>
          )}
        </Form>
      </Card.Body>
    </Card>
  );
}

export default MapInfoDefault;
