import { Card, Row, Col, Image } from 'react-bootstrap';


// Define the type for the props
interface PropsType {
    mapInfo: MapInfoWithTile;
}
function MapInfoCustom({ mapInfo }: PropsType) {
    return (
        <Card className="w-100 mb-3">
            <Card.Body>
                <Row className="align-items-center mb-3">
                    <Col xs="auto">
                        <Image
                            src={mapInfo.mapIconUrl}
                            alt={mapInfo.name}
                            rounded
                            style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                        />
                    </Col>
                    <Col>
                        <Card.Title className="mb-0">{mapInfo.name}</Card.Title>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};


export default MapInfoCustom;
