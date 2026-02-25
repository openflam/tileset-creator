import React, { useState, useRef, useEffect } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import { Search, GeoAlt, X, Globe } from "react-bootstrap-icons";
import CombinedSearchService from "./CombinedSearchService";
import type { SearchResult } from "./CombinedSearchService";
import { flyToSearchResult } from "../../utils/cesium/customDestinationFound";
import { flyToCameraView } from "../../utils/cesium/camera-utils";
import { Viewer, Rectangle, Math as CesiumMath } from "cesium";
import "../../styles/CustomSearchBar.css";
import { discoverAndAddTiles } from "../../utils/discover-add-tiles";
import { getSearchServersFromMaps } from "../../utils/search-servers";

interface CustomSearchBarProps {
  viewer: Viewer | null;
  mapTilesLoaded: MapTilesLoaded;
  mapsDiscoveryObj: any;
  mapTilesLoadedRef: React.RefObject<MapTilesLoaded>;
  setMapTilesLoaded: React.Dispatch<React.SetStateAction<MapTilesLoaded>>;
  setGoogleOpacity: React.Dispatch<React.SetStateAction<number>>;
}

const CustomSearchBar: React.FC<CustomSearchBarProps> = ({
  viewer,
  mapTilesLoaded,
  mapsDiscoveryObj,
  mapTilesLoadedRef,
  setMapTilesLoaded,
  setGoogleOpacity,
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

  // Update search servers whenever discovered maps change
  useEffect(() => {
    const servers = getSearchServersFromMaps(mapTilesLoaded);
    combinedSearchService.current.updateSearchServers(servers);
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

    return {
      type: "CameraView" as const,
      position: {
        longitude: longitude,
        latitude: latitude,
        height: height,
      },
      orientation: {
        heading: 0,
        pitch: -89,
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
                setGoogleOpacity(0.1);
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
    setGoogleOpacity(1.0);
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    setSearchStats(emptyStats);
    setIsResultSelected(false);

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

              {/* Footer with attribution */}
              <div className="custom-search-footer">
                <small className="text-muted">
                  Powered by OpenStreetMap & Google Maps
                </small>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSearchBar;
