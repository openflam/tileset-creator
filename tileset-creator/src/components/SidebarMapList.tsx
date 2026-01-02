import { useMemo } from "react";
import { Viewer } from "cesium";
import MapGroupAccordion from "./MapGroupAccordion";
import MapInfoAuth from "./MapInfoAuth";
import MapInfoDefault from "./MapInfoDefault";
import MapInfoCustom from "./MapInfoCustom";
import CONFIG from "../config";

type Props = {
  mapTilesLoaded: MapTilesLoaded;
  viewer: Viewer;
  setEditingMap: React.Dispatch<React.SetStateAction<MapInfo | null>>;
};

function SidebarMapList({ mapTilesLoaded, viewer, setEditingMap }: Props) {
  const groupedMaps = useMemo(() => {
    const maps = Object.entries(mapTilesLoaded)
      .map(([url, mapInfo]) => ({ ...mapInfo, urlOrKey: url }))
      .filter((map) => {
        const isUnauthDefault = !map.authenticated && map.type === "default";
        const isAuthDefault =
          map.tile &&
          map.type === "default" &&
          map.authenticated &&
          map.placement !== "unplaced";
        const isCustom =
          CONFIG.MODE === "global" && map.tile && map.type === "custom";

        return isUnauthDefault || isAuthDefault || isCustom;
      });

    const buildings: Record<string, typeof maps> = {};
    const unknownBuildingKey = "Unknown Building";
    const worldMapKey = "World Map";

    maps.forEach((map) => {
      let bParams = map.building_id ? map.building_id : unknownBuildingKey;

      // World Map Logic: Maps with keys (e.g. Google Maps) go to World Map group
      if (map.key) {
        bParams = worldMapKey;
      }

      if (!buildings[bParams]) {
        buildings[bParams] = [];
      }
      buildings[bParams].push(map);
    });

    return { buildings, unknownBuildingKey, worldMapKey };
  }, [mapTilesLoaded]);

  const renderMapItem = (map: MapInfo) => {
    if (!map.authenticated && map.type === "default") {
      return <MapInfoAuth key={map.url} mapInfo={map} />;
    }
    if (map.type === "default") {
      return (
        <MapInfoDefault
          key={map.url}
          mapInfo={map}
          setEditingMap={setEditingMap}
        />
      );
    }
    return <MapInfoCustom key={map.url} mapInfo={map} viewer={viewer} />;
  };

  const renderBuildingContent = (maps: MapInfo[]) => {
    const hasAnyLevels = maps.some((m) => m.levels && m.levels.length > 0);

    if (!hasAnyLevels) {
      return (
        <div className="d-flex flex-column gap-2">
          {maps.map(renderMapItem)}
        </div>
      );
    }

    const floors: Record<string, MapInfo[]> = {};
    const unknownFloorKey = "Unknown Floor";

    maps.forEach((map) => {
      let fKey = unknownFloorKey;
      if (map.levels && map.levels.length > 0) {
        fKey = map.levels[0];
      }
      if (!floors[fKey]) floors[fKey] = [];
      floors[fKey].push(map);
    });

    const sortedFloorKeys = Object.keys(floors).sort((a, b) => {
      if (a === unknownFloorKey) return 1;
      if (b === unknownFloorKey) return -1;
      return a.localeCompare(b, undefined, { numeric: true });
    });

    return (
      <div className="d-flex flex-column gap-2">
        {sortedFloorKeys.map((floor) => {
          const floorMaps = floors[floor];
          const isUnknown = floor === unknownFloorKey;

          // Smart Flattening
          if (!isUnknown && floorMaps.length === 1) {
            const singleMap = floorMaps[0];
            const displayMap = {
              ...singleMap,
              commonName: `${floor} - ${singleMap.commonName}`,
            };
            return renderMapItem(displayMap);
          }

          return (
            <MapGroupAccordion
              key={floor}
              eventKey={floor}
              title={floor}
              className={`floor-group ${isUnknown ? "unknown-floor" : ""}`}
              headerClassName={isUnknown ? "unknown-floor-header" : ""}
            >
              <div className="d-flex flex-column gap-2 p-2">
                {floorMaps.map(renderMapItem)}
              </div>
            </MapGroupAccordion>
          );
        })}
      </div>
    );
  };

  const sortedBuildingKeys = Object.keys(groupedMaps.buildings).sort((a, b) => {
    const u = groupedMaps.unknownBuildingKey;
    const w = groupedMaps.worldMapKey;

    if (a === w) return -1;
    if (b === w) return 1;

    if (a === u) return 1;
    if (b === u) return -1;
    return a.localeCompare(b, undefined, { numeric: true });
  });

  return (
    <div className="d-flex flex-column gap-3">
      {sortedBuildingKeys.map((buildingName) => {
        const maps = groupedMaps.buildings[buildingName];
        const isUnknown = buildingName === groupedMaps.unknownBuildingKey;

        return (
          <MapGroupAccordion
            key={buildingName}
            eventKey={buildingName}
            title={buildingName}
            className={`building-group ${isUnknown ? "unknown-building" : ""}`}
            headerClassName={isUnknown ? "unknown-building-header" : ""}
          >
            <div className="p-2">{renderBuildingContent(maps)}</div>
          </MapGroupAccordion>
        );
      })}
    </div>
  );
}

export default SidebarMapList;
