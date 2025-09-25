import { Card, Button, Row, Col, Image } from "react-bootstrap";

const getFullUrl = (
  url: string | undefined,
  mapName: string,
): string | undefined => {
  if (!url) {
    return undefined;
  } else if (!url.startsWith("http")) {
    return "https://" + mapName + url;
  }
  return url;
};

// Define the type for the props
interface PropsType {
  mapInfo: MapInfo;
}
function MapInfoDefault({ mapInfo }: PropsType) {
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

        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            const loginUrl = mapInfo.mapServer?.capabilities.auth.loginUrl;
            const fullLoginUrl = getFullUrl(loginUrl, mapInfo.name);
            window.open(fullLoginUrl, "_blank");
          }}
        >
          Authenticate
        </Button>
      </Card.Body>
    </Card>
  );
}

export default MapInfoDefault;
