import { Viewer } from 'cesium';
import { MapsDiscovery, MapServer } from '@openflam/dnsspatialdiscovery';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useRef, useState } from 'react';

import CONFIG from '../config';
import CesiumViewer from './CesiumViewer';
import SideBar from './SideBar';


function HomePage() {
    // The mapTilesLoaded state is used to keep track of the loaded map tiles.
    const [mapTilesLoaded, setMapTilesLoaded] = useState<MapTilesLoaded>({});
    const [viewer, setViewer] = useState<Viewer | null>(null);
    const [discoverEnabled, setDiscoverEnabled] = useState(true);

    const mapsDiscoveryObj = new MapsDiscovery(CONFIG.DISCOVERY_SUFFIX);
    
    // Stores manually added map servers with discovery service.
    const mapServersWithDiscovery: MapServer[] = [];
    const mapServersWithDiscoveryRef = useRef<MapServer[]>(mapServersWithDiscovery);


    return (
        <Container fluid className="p-0 m-0">
            <Row className='g-0'>
                <Col>
                    <CesiumViewer
                        mapTilesLoaded={mapTilesLoaded}
                        setMapTilesLoaded={setMapTilesLoaded}
                        onViewerReady={(v) => setViewer(v)}
                        mapsDiscoveryObj={mapsDiscoveryObj}
                        discoverEnabled={discoverEnabled}
                        mapServersWithDiscoveryRef={mapServersWithDiscoveryRef}
                    />
                </Col>
                <Col xs={3}>
                    {viewer && (
                        <SideBar
                            mapTilesLoaded={mapTilesLoaded}
                            setMapTilesLoaded={setMapTilesLoaded}
                            viewer={viewer}
                            discoverEnabled={discoverEnabled}
                            setDiscoverEnabled={setDiscoverEnabled}
                            mapServersWithDiscoveryRef={mapServersWithDiscoveryRef}
                        />
                    )}
                </Col>
            </Row>
        </Container>
    );
}

export default HomePage;