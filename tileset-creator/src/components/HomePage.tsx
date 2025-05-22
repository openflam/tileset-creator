import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useState } from 'react';

import CesiumViewer from './CesiumViewer';
import SideBar from './SideBar';


function HomePage() {
    // The mapTilesLoaded state is used to keep track of the loaded map tiles.
    // It is modified when the map is panned or zoomed in the CesiumViewer component.
    // It is rendered in the SideBar component.
    const [mapTilesLoaded, setMapTilesLoaded] = useState<MapTilesLoaded>({});

    return (
        <Container fluid className="p-0 m-0">
            <Row className='g-0'>
                <Col>
                    <CesiumViewer
                        mapTilesLoaded={mapTilesLoaded}
                        setMapTilesLoaded={setMapTilesLoaded}
                    />
                </Col>
                <Col xs={3}>
                    <SideBar
                        mapTilesLoaded={mapTilesLoaded}
                    />
                </Col>
            </Row>
        </Container>
    );
}

export default HomePage;