import { Button } from "react-bootstrap";
import MapInfo from "./MapInfo";

type propsType = {
    mapTilesLoaded: MapTilesLoaded;
}

function SideBar({ mapTilesLoaded }: propsType) {
    return (
        <div className="p-3" style={{ overflowY: "scroll", height: "100vh" }}>
            {Object.entries(mapTilesLoaded).map(([url, mapInfo]) => (
                <MapInfo
                    key={url}
                    mapInfo={mapInfo}
                />
            ))}
            <Button variant="primary" className="w-100 mt-3">
                Add New Map
            </Button>
        </div>
    )
}

export default SideBar;