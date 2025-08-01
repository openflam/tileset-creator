import { Viewer } from "cesium";
import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import MapInfoDefault from "./MapInfoDefault";
import MapInfoCustom from "./MapInfoCustom";
import AddGLBModal from "./AddGLBModal";

type propsType = {
    mapTilesLoaded: MapTilesLoaded;
    setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>;
    viewer: Viewer;
};

function SideBar({ mapTilesLoaded, setMapTilesLoaded, viewer }: propsType) {
    const [showAddGLBModal, setShowAddGLBModal] = useState(false);
    const [editEnabled, setEditEnabled] = useState(false);

    return (
        <div className="p-3" style={{ overflowY: "scroll", height: "100vh" }}>
            <Form.Check
                className="mb-3"
                type="switch"
                checked={editEnabled}
                label="Edit Mode"
                onClick={() => setEditEnabled(!editEnabled)}
            ></Form.Check>
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
                <Button
                    variant="primary"
                    className="w-100 mt-3"
                    onClick={() => setShowAddGLBModal(true)}
                >
                    Add GLB
                </Button>
            }

            <AddGLBModal
                show={showAddGLBModal}
                onClose={() => setShowAddGLBModal(false)}
                viewer={viewer}
                setMapTilesLoaded={setMapTilesLoaded}
            />
        </div>
    );
}

export default SideBar;
