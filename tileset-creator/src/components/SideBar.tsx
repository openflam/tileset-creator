import { Viewer } from "cesium";
import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import MapInfoDefault from "./MapInfoDefault";
import MapInfoCustom from "./MapInfoCustom";
import AddGLBModal from "./AddGLBModal";
import AddMapServerModal from "./AddMapServerModal";

type propsType = {
    mapTilesLoaded: MapTilesLoaded;
    setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>;
    viewer: Viewer;
    discoverEnabled: boolean;
    setDiscoverEnabled: React.Dispatch<React.SetStateAction<boolean>>;
};

function SideBar({ mapTilesLoaded, setMapTilesLoaded, viewer, discoverEnabled, setDiscoverEnabled }: propsType) {
    const [showAddGLBModal, setShowAddGLBModal] = useState(false);
    const [showAddMapServerModal, setShowAddMapServerModal] = useState(false);
    const [editEnabled, setEditEnabled] = useState(false);

    return (
        <div className="p-3" style={{ overflowY: "scroll", height: "100vh" }}>
            <div className="d-flex align-items-center mb-3">
                <Form.Check
                    type="switch"
                    checked={discoverEnabled}
                    label="Discover"
                    className="me-3"
                    onClick={() => setDiscoverEnabled(!discoverEnabled)}
                />
                <Form.Check
                    type="switch"
                    checked={editEnabled}
                    label="Edit Mode"
                    onClick={() => setEditEnabled(!editEnabled)}
                />
            </div>
            <>
                {Object.entries(mapTilesLoaded)
                    .filter(([_, mapInfo]) => mapInfo.type === 'default')
                    .map(([url, mapInfo]) => (
                        <MapInfoDefault key={url} mapInfo={mapInfo} />
                    ))}

                {Object.entries(mapTilesLoaded)
                    .filter(([_, mapInfo]) => mapInfo.type === 'custom')
                    .map(([url, mapInfo]) => (
                        <MapInfoCustom key={url} mapInfo={mapInfo} />
                    ))}
            </>
            {editEnabled &&
                <>
                <Button
                    variant="primary"
                    className="w-100 mt-3"
                    onClick={() => setShowAddGLBModal(true)}
                >
                    Add GLB
                </Button>

                <Button
                    variant="primary"
                    className="w-100 mt-3"
                    onClick={() => setShowAddMapServerModal(true)}
                >
                    Add Map Server
                </Button>
                </>
            }

            <AddGLBModal
                show={showAddGLBModal}
                onClose={() => setShowAddGLBModal(false)}
                viewer={viewer}
                setMapTilesLoaded={setMapTilesLoaded}
            />

            <AddMapServerModal
                show={showAddMapServerModal}
                onClose={() => setShowAddMapServerModal(false)}
                viewer={viewer}
                setMapTilesLoaded={setMapTilesLoaded}
            />
        </div>
    );
}

export default SideBar;
