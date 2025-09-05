import React, { useState, useRef, useEffect } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import { Search, GeoAlt, X, Globe } from 'react-bootstrap-icons';
import CombinedSearchService from './CombinedSearchService';
import type { SearchResult } from './CombinedSearchService';
import { flyToSearchResult } from '../utils/cesium/customDestinationFound';
import { Viewer } from 'cesium';
import '../styles/CustomSearchBar.css';

interface CustomSearchBarProps {
    viewer: Viewer | null;
}

const CustomSearchBar: React.FC<CustomSearchBarProps> = ({ viewer }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchStats, setSearchStats] = useState({ 
        total: 0, 
        nominatim: 0, 
        google: 0, 
        servers: {} as { [key: number]: number },
        serverDetails: [] as Array<{ serverIndex: number; count: number; results: any[] }>
    });
    const [isResultSelected, setIsResultSelected] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const combinedSearchService = useRef(new CombinedSearchService({
        maxResultsPerSource: 3,
        enableNominatim: true,
        enableGoogle: true,
        deduplicateResults: true,
    }));

    // Debounce search - but only if no result was just selected
    useEffect(() => {
        if (isResultSelected) {
            // If a result was just selected, don't search
            return;
        }
        const timeoutId = setTimeout(() => {
            if (query.trim().length > 2) {
                performSearch(query);
            } else {
                setResults([]);
                setShowDropdown(false);
                setSearchStats({ total: 0, nominatim: 0, google: 0, servers: {}, serverDetails: [] });
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, isResultSelected]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const performSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) return;

        // Cancel any ongoing search
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller for this search
        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        setShowDropdown(true);

        try {
            const searchResults = await combinedSearchService.current.search(searchQuery, abortControllerRef.current.signal);
            setResults(searchResults);
            
            // Get search statistics
            const stats = combinedSearchService.current.getSearchStats(searchResults);
            setSearchStats(stats);
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return;
            console.error('Search error:', error);
            setResults([]);
            setSearchStats({ total: 0, nominatim: 0, google: 0, servers: {}, serverDetails: [] });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResultSelect = (result: SearchResult) => {
        // Cancel any ongoing search immediately
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        // Mark that a result was selected to prevent further searching
        setIsResultSelected(true);
        
        // Close the dropdown immediately
        setShowDropdown(false);
        
        // Clear results to prevent further searching
        setResults([]);
        setSearchStats({ total: 0, nominatim: 0, google: 0, servers: {}, serverDetails: [] });

        // Update the search input with the selected result AFTER clearing results
        setQuery(result.displayName);

        // Fly to the selected location
        if (viewer) {
            try {
                // Cancel any ongoing camera flight before starting a new one
                if (typeof (viewer.camera as any).cancelFlight === 'function') {
                    (viewer.camera as any).cancelFlight();
                }
                flyToSearchResult(result, viewer);
            } catch (err) {
                console.error('Failed to fly to location:', err);
            }
        } else {
            console.error('Viewer is not available');
        }

        // Do not immediately reset the selection flag here.
        // We only reset it when the user starts typing again.
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setShowDropdown(false);
        setSearchStats({ total: 0, nominatim: 0, google: 0, servers: {}, serverDetails: [] });
        setIsResultSelected(false);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        // User is typing again; allow searches to resume
        setIsResultSelected(false);
        setQuery(newQuery);
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
        if (result.source === 'google') {
            return 'Google';
        }
        
        // For Nominatim results, show server-specific names
        if (result.serverInfo?.serverIndex !== undefined) {
            const serverIndex = result.serverInfo.serverIndex;
            const serverUrl = result.serverInfo.serverUrl;
            
            // Extract domain or localhost info for display
            try {
                const url = new URL(serverUrl);
                if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
                    return `OSM-${serverIndex + 1}`;
                } else if (url.hostname === 'nominatim.openstreetmap.org') {
                    return 'OSM-Public';
                } else {
                    // Extract first part of domain name
                    const domain = url.hostname.split('.')[0];
                    return `OSM-${domain}`;
                }
            } catch {
                return `OSM-${serverIndex + 1}`;
            }
        }
        
        return 'OSM';
    };

    const getServerIcon = (result: SearchResult) => {
        if (result.source === 'google') {
            return '🗺️';
        }
        
        // Different icons for different OSM servers
        if (result.serverInfo?.serverIndex !== undefined) {
            const serverIndex = result.serverInfo.serverIndex;
            const icons = ['🌍', '📍', '🏠', '🌎', '🌏', '🗺️',  '🌐', '🌟'];
            return icons[serverIndex % icons.length];
        }
        
        return '🌍';
    };

    const getServerColor = (result: SearchResult) => {
        if (result.source === 'google') {
            return '#4285f4';
        }
        
        // Different colors for different OSM servers
        if (result.serverInfo?.serverIndex !== undefined) {
            const serverIndex = result.serverInfo.serverIndex;
            const colors = ['#7cb342', '#2e7d32', '#388e3c', '#43a047', '#66bb6a', '#81c784', '#a5d6a7', '#c8e6c9'];
            return colors[serverIndex % colors.length];
        }
        
        return '#7cb342';
    };

    return (
        <div ref={searchRef} className="custom-search-container">
            <Form onSubmit={handleSubmit}>
                <div style={{ position: 'relative' }}>
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
                                style={{ width: '16px', height: '16px' }}
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
                                    {/* Individual server stats */}
                                    {searchStats.serverDetails.map((serverDetail) => {
                                        // Get a sample result to determine server info
                                        const sampleResult = serverDetail.results[0];
                                        if (!sampleResult) return null;
                                        
                                        return (
                                            <span key={serverDetail.serverIndex} className="stat-item">
                                                <span className="stat-icon">{getServerIcon(sampleResult)}</span>
                                                <span className="stat-count">{serverDetail.count}</span>
                                                <span className="stat-label">{getSourceName(sampleResult)}</span>
                                            </span>
                                        );
                                    })}
                                    {/* Google stats */}
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
                                            {result.displayName.split(',')[0]}
                                        </div>
                                        <div className="custom-search-result-subtitle">
                                            {result.displayName}
                                        </div>
                                    </div>
                                    <div 
                                        className="custom-search-result-badge"
                                        style={{ 
                                            background: `linear-gradient(135deg, ${getServerColor(result)} 0%, ${getServerColor(result)}dd 100%)`,
                                            color: 'white'
                                        }}
                                        title={result.serverInfo?.serverUrl || `${result.source} server`}
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