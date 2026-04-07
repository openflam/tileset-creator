import React, { useState, useRef, useEffect } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import { Search, GeoAlt, X, Globe } from "react-bootstrap-icons";
import CombinedSearchService from "./CombinedSearchService";
import type { SearchResult } from "./CombinedSearchService";
import { flyToSearchResult } from "../../utils/cesium/customDestinationFound";
import { flyToCameraView } from "../../utils/cesium/camera-utils";
import {
  Viewer,
  Rectangle,
  Math as CesiumMath,
  Cartesian3,
  Color,
  PolygonHierarchy,
  Entity,
  Cesium3DTileset,
  Cesium3DTileStyle,
} from "cesium";
import "../../styles/CustomSearchBar.css";
import { discoverAndAddTiles } from "../../utils/discover-add-tiles";
import { getSearchServersFromMaps } from "../../utils/search-servers";
import { createLabel, Label } from "../../utils/cesium/label";

interface CustomSearchBarProps {
  viewer: Viewer | null;
  mapTilesLoaded: MapTilesLoaded;
  mapsDiscoveryObj: any;
  mapTilesLoadedRef: React.RefObject<MapTilesLoaded>;
  setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>;
  setGoogleOpacity: React.Dispatch<React.SetStateAction<number>>;
  setMapOpacities: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

const CustomSearchBar: React.FC<CustomSearchBarProps> = ({
  viewer,
  mapTilesLoaded,
  mapsDiscoveryObj,
  mapTilesLoadedRef,
  setMapTilesLoaded,
  setGoogleOpacity,
  setMapOpacities,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchStats, setSearchStats] = useState({
    total: 0,
    nominatim: 0,
    google: 0,
    servers: {} as { [key: number]: number },
    serverDetails: [] as Array<{
      serverIndex: number;
      count: number;
      results: any[];
    }>,
  });
  const [isResultSelected, setIsResultSelected] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const combinedSearchService = useRef(
    new CombinedSearchService({
      maxResultsPerSource: 3,
      enableGoogle: true,
      deduplicateResults: true,
    }),
  );
  const searchBboxEntitiesRef = useRef<Entity[]>([]);
  const searchLabelsRef = useRef<Label[]>([]);
  const highlightedMapKeyRef = useRef<string | null>(null);

  // Update search servers whenever discovered maps change
  useEffect(() => {
    const servers = getSearchServersFromMaps(mapTilesLoaded);
    combinedSearchService.current.updateSearchServers(servers);
  }, [mapTilesLoaded]);

  // Auto-dim newly discovered maps when a highlight is active
  useEffect(() => {
    const activeKey = highlightedMapKeyRef.current;
    if (!activeKey) return;

    const dimOpacity = 0.1;
    const newOpacities: Record<string, number> = {};
    let hasNewMaps = false;

    Object.entries(mapTilesLoaded).forEach(([key, info]) => {
      const isMatch = key === activeKey;
      const targetOpacity = isMatch ? 1.0 : dimOpacity;
      newOpacities[key] = targetOpacity;

      if (info.tile) {
        changeTilesetOpacity(info.tile as Cesium3DTileset, targetOpacity);
        hasNewMaps = true;
      }
    });

    if (hasNewMaps) {
      setMapOpacities(newOpacities);
    }
  }, [mapTilesLoaded]);

  // Function to generate camera view from search result data
  const generateCameraViewFromResult = (result: SearchResult) => {
    let longitude = 0,
      latitude = 0,
      height = 300;

    if (result.destination) {
      if (
        typeof result.destination === "object" &&
        "longitude" in result.destination &&
        "latitude" in result.destination
      ) {
        longitude = result.destination.longitude;
        latitude = result.destination.latitude;
      } else if (result.destination instanceof Rectangle) {
        const center = Rectangle.center(result.destination);
        longitude = CesiumMath.toDegrees(center.longitude);
        latitude = CesiumMath.toDegrees(center.latitude);
      }
    }

    if (result.altitude) {
      height = result.altitude;
    }

    const extratags = result._rawNominatimData?.extratags;
    let pitch = -89;
    if (extratags && extratags["bbox:extruded_height"]) {
      const extrudedHeight =
        parseFloat(extratags["bbox:extruded_height"]) || height;
      height = extrudedHeight + 10;
    }

    return {
      type: "CameraView" as const,
      position: {
        longitude: longitude,
        latitude: latitude,
        height: height,
      },
      orientation: {
        heading: 0,
        pitch: pitch,
        roll: 0,
      },
      boundingBox: {
        west: longitude - 0.001,
        south: latitude - 0.001,
        east: longitude + 0.001,
        north: latitude + 0.001,
      },
      timestamp: new Date().toISOString(),
    };
  };

  const clearSearchBbox = () => {
    if (viewer) {
      searchBboxEntitiesRef.current.forEach((e) =>
        viewer.entities.remove(e),
      );
      searchLabelsRef.current.forEach((l) => l.destroy());
    }
    searchBboxEntitiesRef.current = [];
    searchLabelsRef.current = [];
  };

  const showSearchResultBbox = (result: SearchResult) => {
    if (!viewer) return;

    const extratags = result._rawNominatimData?.extratags;
    if (!extratags || !extratags["bbox:corner1_lat"]) return;

    clearSearchBbox();

    const corners: { longitude: number; latitude: number }[] = [];
    for (let i = 1; i <= 4; i++) {
      const lat = parseFloat(extratags[`bbox:corner${i}_lat`]);
      const lon = parseFloat(extratags[`bbox:corner${i}_lon`]);
      if (!isNaN(lat) && !isNaN(lon)) {
        corners.push({ latitude: lat, longitude: lon });
      }
    }

    if (corners.length < 3) return;

    const height = parseFloat(extratags["bbox:height"]) || 0;
    const extrudedHeight =
      parseFloat(extratags["bbox:extruded_height"]) || height + 3;

    const bboxEntity = viewer.entities.add({
      polygon: {
        hierarchy: new PolygonHierarchy(
          corners.map((c) =>
            Cartesian3.fromDegrees(c.longitude, c.latitude),
          ),
        ),
        material: Color.CYAN.withAlpha(0.25),
        height,
        extrudedHeight,
        outline: true,
        outlineColor: Color.CYAN,
      },
    });
    searchBboxEntitiesRef.current.push(bboxEntity);

    const avgLon =
      corners.reduce((s, c) => s + c.longitude, 0) / corners.length;
    const avgLat =
      corners.reduce((s, c) => s + c.latitude, 0) / corners.length;
    const labelText =
      result._rawNominatimData?.name ||
      result.displayName.split(",")[0] ||
      result.displayName;

    const pin = createLabel({
      position: Cartesian3.fromDegrees(
        avgLon,
        avgLat,
        (height + extrudedHeight) / 2,
      ),
      text: labelText,
      viewer,
    });
    searchLabelsRef.current.push(pin);
  };

  const changeTilesetOpacity = (
    tileset: Cesium3DTileset,
    opacity: number,
  ) => {
    if (tileset) {
      tileset.style = new Cesium3DTileStyle({
        color: `color("white", ${opacity})`,
      });
    }
  };

  const highlightMapForResult = (result: SearchResult) => {
    const mapTag = result._rawNominatimData?.extratags?.map;
    if (!mapTag) return;

    highlightedMapKeyRef.current = mapTag;

    const dimOpacity = 0.1;
    const newOpacities: Record<string, number> = {};

    Object.entries(mapTilesLoaded).forEach(([url, info]) => {
      const opacity = url === mapTag ? 1.0 : dimOpacity;
      newOpacities[url] = opacity;
      if (info.tile) {
        changeTilesetOpacity(info.tile as Cesium3DTileset, opacity);
      }
    });

    setMapOpacities(newOpacities);
    setGoogleOpacity(dimOpacity);
  };

  const restoreAllMapOpacity = () => {
    highlightedMapKeyRef.current = null;

    const newOpacities: Record<string, number> = {};
    Object.entries(mapTilesLoaded).forEach(([url, info]) => {
      newOpacities[url] = 1.0;
      if (info.tile) {
        changeTilesetOpacity(info.tile as Cesium3DTileset, 1.0);
      }
    });
    setMapOpacities(newOpacities);
    setGoogleOpacity(1.0);
  };

  // Debounce search
  useEffect(() => {
    if (isResultSelected) {
      return;
    }
    const timeoutId = setTimeout(() => {
      if (query.trim().length > 2) {
        performSearch(query);
      } else {
        setResults([]);
        setShowDropdown(false);
        setSearchStats({
          total: 0,
          nominatim: 0,
          google: 0,
          servers: {},
          serverDetails: [],
        });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, isResultSelected]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setShowDropdown(true);

    try {
      const searchResults = await combinedSearchService.current.search(
        searchQuery,
        abortControllerRef.current.signal,
      );
      setResults(searchResults);

      const stats =
        combinedSearchService.current.getSearchStats(searchResults);
      setSearchStats(stats);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Search error:", error);
      setResults([]);
      setSearchStats({
        total: 0,
        nominatim: 0,
        google: 0,
        servers: {},
        serverDetails: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const emptyStats = {
    total: 0,
    nominatim: 0,
    google: 0,
    servers: {},
    serverDetails: [],
  };

  const handleResultSelect = (result: SearchResult) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsResultSelected(true);
    setShowDropdown(false);
    setResults([]);
    setSearchStats(emptyStats);
    setQuery(result.displayName);

    const hasHeightInTags =
      result._rawNominatimData &&
      result._rawNominatimData.extratags &&
      result._rawNominatimData.extratags.height;

    if (viewer) {
      try {
        if (typeof (viewer.camera as any).cancelFlight === "function") {
          (viewer.camera as any).cancelFlight();
        }

        if (hasHeightInTags) {
          const cameraView = generateCameraViewFromResult(result);

          flyToCameraView(viewer, cameraView)
            .then(() => {
              setTimeout(() => {
                highlightMapForResult(result);
                showSearchResultBbox(result);
              }, 100);
            })
            .catch((err) => {
              console.error(`Failed to fly to ${result.displayName}:`, err);
            });
        } else {
          setGoogleOpacity(1.0);

          flyToSearchResult(result, viewer);
          discoverAndAddTiles(
            viewer,
            mapsDiscoveryObj,
            mapTilesLoadedRef,
            setMapTilesLoaded,
          );
        }
      } catch (err) {
        console.error("Failed to fly to location:", err);
      }
    }
  };

  const handleClear = () => {
    restoreAllMapOpacity();
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    setSearchStats(emptyStats);
    setIsResultSelected(false);
    clearSearchBbox();

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsResultSelected(false);
    setQuery(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      handleResultSelect(results[0]);
    } else if (query.trim()) {
      performSearch(query);
    }
  };

  const getSourceName = (result: SearchResult) => {
    if (result.source === "google") {
      return "Google";
    }

    if (result.sourceName) {
      return result.sourceName;
    }

    if (result.serverInfo?.serverUrl) {
      try {
        const url = new URL(result.serverInfo.serverUrl);
        const domain = url.hostname.split(".")[0];
        return domain;
      } catch {
        return "OSM";
      }
    }

    return "OSM";
  };

  const getServerIcon = (result: SearchResult) => {
    if (result.source === "google") {
      return "🗺️";
    }

    if (result.serverInfo?.serverIndex !== undefined) {
      const icons = ["🌍", "📍", "🏠", "🌎", "🌏", "🗺️", "🌐", "🌟"];
      return icons[result.serverInfo.serverIndex % icons.length];
    }

    return "🌍";
  };

  const getServerColor = (result: SearchResult) => {
    if (result.source === "google") {
      return "#4285f4";
    }

    if (result.serverInfo?.serverIndex !== undefined) {
      const colors = [
        "#7cb342",
        "#2e7d32",
        "#388e3c",
        "#43a047",
        "#66bb6a",
        "#81c784",
        "#a5d6a7",
        "#c8e6c9",
      ];
      return colors[result.serverInfo.serverIndex % colors.length];
    }

    return "#7cb342";
  };

  return (
    <div ref={searchRef} className="custom-search-container">
      <Form onSubmit={handleSubmit}>
        <div style={{ position: "relative" }}>
          <Form.Control
            ref={inputRef}
            type="text"
            placeholder="Search for a location..."
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (results.length > 0) {
                setShowDropdown(true);
              }
            }}
            className="custom-search-input"
          />

          <div className="custom-search-controls">
            {isLoading && (
              <Spinner
                animation="border"
                size="sm"
                style={{ width: "16px", height: "16px" }}
              />
            )}

            {query && (
              <Button
                variant="link"
                size="sm"
                onClick={handleClear}
                className="custom-search-clear-button"
              >
                <X size={14} />
              </Button>
            )}

            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="custom-search-button"
            >
              <Search size={14} />
            </Button>
          </div>
        </div>
      </Form>

      {showDropdown && (results.length > 0 || isLoading) && (
        <div className="custom-search-dropdown">
          {isLoading ? (
            <div className="custom-search-loading">
              <Spinner animation="border" size="sm" />
              <span>Searching multiple sources...</span>
            </div>
          ) : (
            <>
              {/* Combined Search Attribution Header */}
              <div className="custom-search-attribution">
                <Globe size={14} className="custom-search-attribution-icon" />
                <span className="custom-search-attribution-text">
                  Combined Search Results
                </span>
                <div className="custom-search-stats">
                  {searchStats.serverDetails.map((serverDetail) => {
                    const sampleResult = serverDetail.results[0];
                    if (!sampleResult) return null;

                    return (
                      <span
                        key={serverDetail.serverIndex}
                        className="stat-item"
                      >
                        <span className="stat-icon">
                          {getServerIcon(sampleResult)}
                        </span>
                        <span className="stat-count">{serverDetail.count}</span>
                        <span className="stat-label">
                          {getSourceName(sampleResult)}
                        </span>
                      </span>
                    );
                  })}
                  {searchStats.google > 0 && (
                    <span className="stat-item">
                      <span className="stat-icon">🗺️</span>
                      <span className="stat-count">{searchStats.google}</span>
                      <span className="stat-label">Google</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Search Results */}
              {results.map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleResultSelect(result)}
                  className="custom-search-result"
                >
                  <GeoAlt size={16} className="custom-search-result-icon" />
                  <div className="custom-search-result-content">
                    <div className="custom-search-result-title">
                      {result.displayName.split(",")[0]}
                    </div>
                    <div className="custom-search-result-subtitle">
                      {result.displayName}
                    </div>
                  </div>
                  <div
                    className="custom-search-result-badge"
                    style={{
                      background: `linear-gradient(135deg, ${getServerColor(result)} 0%, ${getServerColor(result)}dd 100%)`,
                      color: "white",
                    }}
                    title={
                      result.serverInfo?.serverUrl || `${result.source} server`
                    }
                  >
                    {getServerIcon(result)} {getSourceName(result)}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSearchBar;
