import { Viewer } from "cesium";
import { MapsDiscovery } from "@openflam/dnsspatialdiscovery";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useEffect, useState } from "react";
import { addTilesetFromMapInfo } from "../utils/cesium/add-tiles";

import CONFIG from "../config";
import CesiumViewer from "./CesiumViewer";
import SideBar from "./SideBar";

function HomePage() {
  // The mapTilesLoaded state is used to keep track of the loaded map tiles.
  const [mapTilesLoaded, setMapTilesLoaded] = useState<MapTilesLoaded>({});
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [discoverEnabled, setDiscoverEnabled] = useState(true);

  const mapsDiscoveryObj = new MapsDiscovery(CONFIG.DISCOVERY_SUFFIX);

  useEffect(() => {
    if (viewer && CONFIG.MODE === "map-server") {
      addTilesetFromMapInfo(
        viewer,
        CONFIG.DEFAULT_MAP_SERVER,
        setMapTilesLoaded,
      );
    }
  }, [viewer]);

  const sidebarComponent = viewer ? (
    <SideBar
      mapTilesLoaded={mapTilesLoaded}
      setMapTilesLoaded={setMapTilesLoaded}
      viewer={viewer}
      discoverEnabled={discoverEnabled}
      setDiscoverEnabled={setDiscoverEnabled}
    />
  ) : null;

  return (
    <Container fluid className="p-0 m-0">
      <Row className="g-0">
        <Col lg={9}>
          <CesiumViewer
            mapTilesLoaded={mapTilesLoaded}
            setMapTilesLoaded={setMapTilesLoaded}
            onViewerReady={(v) => setViewer(v)}
            mapsDiscoveryObj={mapsDiscoveryObj}
            discoverEnabled={CONFIG.MODE === "global" && discoverEnabled}
          />
        </Col>

        {/* Static sidebar at lg+ (hidden below lg) */}
        <Col
          lg={3}
          className="d-none d-lg-block"
          style={{ overflowY: "scroll", height: "100vh" }}
        >
          {sidebarComponent}
        </Col>
      </Row>

      {/* Mobile-only hamburger. Only visible in <lg */}
      <button
        className="btn btn-primary d-lg-none position-fixed top-0 end-0 mt-5 me-3 p-2"
        type="button"
        style={{ zIndex: 1000 }}
        data-bs-toggle="offcanvas"
        data-bs-target="#sidebarOffcanvas"
      >
        <i className="bi bi-list" style={{ fontSize: "1.5rem" }}></i>
      </button>

      {/* Mobile-only offcanvas sidebar. Only visible in <lg */}
      <div
        className="offcanvas offcanvas-end d-lg-none"
        tabIndex={-1}
        id="sidebarOffcanvas"
        style={{
          overflowY: "scroll",
          width: "300px",
          height: "100vh",
          zIndex: 1100,
        }}
      >
        <div className="offcanvas-header">
          <button
            type="button"
            className="btn-close text-reset"
            data-bs-dismiss="offcanvas"
          ></button>
        </div>
        <div className="offcanvas-body">{sidebarComponent}</div>
      </div>
    </Container>
  );
}

export default HomePage;
