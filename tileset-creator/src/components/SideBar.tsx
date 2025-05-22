import { Viewer } from "cesium";
import { useState } from "react";
import { Button } from "react-bootstrap";
import MapInfoDefault from "./MapInfoDefault";
import MapInfoCustom from "./MapInfoCustom";
import AddMapModal from "./AddMapModal";

type propsType = {
    mapTilesLoaded: MapTilesLoaded;
    setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>;
    viewer: Viewer;
};

function SideBar({ mapTilesLoaded, setMapTilesLoaded, viewer }: propsType) {
    const [showDialog, setShowDialog] = useState(false);

    return (
        <div className="p-3" style={{ overflowY: "scroll", height: "100vh" }}>
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
            <Button
                variant="primary"
                className="w-100 mt-3"
                onClick={() => setShowDialog(true)}
            >
                Add New Map
            </Button>

            <AddMapModal
                show={showDialog}
                onClose={() => setShowDialog(false)}
                viewer={viewer}
                setMapTilesLoaded={setMapTilesLoaded}
            />
        </div>
    );
}

export default SideBar;
