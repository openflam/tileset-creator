import { useMemo, useState, useCallback } from "react";
import { Viewer, Cesium3DTileset } from "cesium";
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
  // Local state to trigger re-renders when visibility changes
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);

  const groupedMaps = useMemo(() => {
    // ... (grouping logic remains same, dependent on mapTilesLoaded)
    // NOTE: If maps are added/removed, mapTilesLoaded changes, triggering this.
    // Visibility changes do NOT change mapTilesLoaded reference, so this memo won't re-run.
    // But renderBuildingContent runs on every render.
    // IsGrouping dependent on visibility? No.
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

      if (map.key) {
        bParams = worldMapKey;
      }

      if (!buildings[bParams]) {
        buildings[bParams] = [];
      }
      buildings[bParams].push(map);
    });

    return { buildings, unknownBuildingKey, worldMapKey };
  }, [mapTilesLoaded]); // Only re-calc grouping if list changes

  const toggleGroupVisibility = (maps: MapInfo[], visible: boolean) => {
    // 1. Update Cesium visibility
    maps.forEach((map) => {
      if (map.tile) {
        (map.tile as Cesium3DTileset).show = visible;
      }
    });

    // 2. Trigger local re-render
    forceUpdate();
  };

  const isGroupVisible = (maps: MapInfo[]) => {
    return maps.every((m) => m.tile?.show !== false);
  };

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
          onVisibilityChange={forceUpdate}
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
              onToggleVisibility={() =>
                toggleGroupVisibility(floorMaps, !isGroupVisible(floorMaps))
              }
              isVisible={isGroupVisible(floorMaps)}
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
            onToggleVisibility={() =>
              toggleGroupVisibility(maps, !isGroupVisible(maps))
            }
            isVisible={isGroupVisible(maps)}
          >
            <div className="p-2">{renderBuildingContent(maps)}</div>
          </MapGroupAccordion>
        );
      })}
    </div>
  );
}

export default SidebarMapList;
