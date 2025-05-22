import { Viewer } from "cesium";
import { useState } from "react";
import { Button } from "react-bootstrap";
import MapInfo from "./MapInfo";
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
            {Object.entries(mapTilesLoaded).map(([url, mapInfo]) => (
                <MapInfo key={url} mapInfo={mapInfo} />
            ))}
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
