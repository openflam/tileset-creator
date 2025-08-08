import NominatimGeocoderService from '../utils/cesium/NominatimGeocoderService';
import GoogleGeocoderService from '../utils/cesium/GoogleGeocoderService';

export interface SearchResult {
    displayName: string;
    destination: any;
    altitude: number;
    attribution: any;
    source: 'nominatim' | 'google';
    sourceIcon: string;
    sourceColor: string;
    sourceName: string;
    googleData?: any; // Additional Google-specific data
}

export interface CombinedSearchOptions {
    maxResultsPerSource?: number;
    enableNominatim?: boolean;
    enableGoogle?: boolean;
    deduplicateResults?: boolean;
}

export class CombinedSearchService {
    private nominatimService: any;
    private googleService: any;
    private options: CombinedSearchOptions;

    constructor(options: CombinedSearchOptions = {}) {
        this.options = {
            maxResultsPerSource: 5,
            enableNominatim: true,
            enableGoogle: true,
            deduplicateResults: true,
            ...options
        };

        if (this.options.enableNominatim) {
            this.nominatimService = new (NominatimGeocoderService as any)();
        }

        if (this.options.enableGoogle) {
            // Use the custom Google geocoder service
            this.googleService = new (GoogleGeocoderService as any)();
        }

        // Initialized
    }

    /**
     * Search both Nominatim and Google APIs and combine results
     */
    async search(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
        if (!query || query.trim().length === 0) {
            return [];
        }

        const searchPromises: Promise<SearchResult[]>[] = [];

        // Search Nominatim
        if (this.options.enableNominatim && this.nominatimService) {
            searchPromises.push(this.searchNominatim(query, signal));
        }

        // Search Google
        if (this.options.enableGoogle && this.googleService) {
            searchPromises.push(this.searchGoogle(query, signal));
        }

        try {
            // Execute all searches in parallel
            const results = await Promise.allSettled(searchPromises);
            
            // Combine results from all sources
            let combinedResults: SearchResult[] = [];

            results.forEach((result) => {
                if (result.status === 'fulfilled') {
                    combinedResults = combinedResults.concat(result.value);
                } else {
                    console.error('Search failed for a source:', result.reason);
                }
            });

            // Deduplicate results if enabled
            if (this.options.deduplicateResults) {
                combinedResults = this.deduplicateResults(combinedResults);
            }

            // Sort results by relevance (you can implement custom sorting logic here)
            combinedResults = this.sortResults(combinedResults);

            return combinedResults;

        } catch (error) {
            console.error('Combined search error:', error);
            return [];
        }
    }

    /**
     * Search Nominatim API
     */
    private async searchNominatim(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
        try {
            // Check if search was cancelled
            if (signal?.aborted) {
                throw new Error('Search was cancelled');
            }
            
            const results = await this.nominatimService.geocode(query);
            
            return results.slice(0, this.options.maxResultsPerSource).map((result: any) => ({
                ...result,
                source: 'nominatim' as const,
                sourceIcon: '🌍',
                sourceColor: '#7cb342',
                sourceName: 'OpenStreetMap',
            }));
        } catch (error) {
            console.error('Nominatim search error:', error);
            return [];
        }
    }

    /**
     * Search Google API using the custom Google geocoder service
     */
    private async searchGoogle(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
        try {
            // Check if search was cancelled
            if (signal?.aborted) {
                throw new Error('Search was cancelled');
            }
            
            const results = await this.googleService.geocode(query);
            
            return results.slice(0, this.options.maxResultsPerSource).map((result: any) => ({
                ...result,
                source: 'google' as const,
                sourceIcon: '🗺️',
                sourceColor: '#4285f4',
                sourceName: 'Google Maps',
                googleData: result.googleData || {},
            }));
        } catch (error) {
            console.error('Google search error:', error);
            return [];
        }
    }

    /**
     * Deduplicate results based on display name similarity
     */
    private deduplicateResults(results: SearchResult[]): SearchResult[] {
        const seen = new Set<string>();
        const deduplicated: SearchResult[] = [];

        for (const result of results) {
            // Create a normalized key for comparison
            const normalizedName = result.displayName.toLowerCase()
                .replace(/[^\w\s]/g, '') // Remove punctuation
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();

            if (!seen.has(normalizedName)) {
                seen.add(normalizedName);
                deduplicated.push(result);
            }
        }

        return deduplicated;
    }

    /**
     * Sort results by relevance (customize this logic as needed)
     */
    private sortResults(results: SearchResult[]): SearchResult[] {
        // For now, just return in the order they were received
        // You can implement custom sorting logic here
        return results;
    }

    /**
     * Get search statistics
     */
    getSearchStats(results: SearchResult[]) {
        const stats = {
            total: results.length,
            nominatim: results.filter(r => r.source === 'nominatim').length,
            google: results.filter(r => r.source === 'google').length,
        };

        return stats;
    }

    /**
     * Filter results by source
     */
    filterBySource(results: SearchResult[], source: 'nominatim' | 'google'): SearchResult[] {
        return results.filter(result => result.source === source);
    }

    /**
     * Get unique sources from results
     */
    getUniqueSources(results: SearchResult[]): string[] {
        return [...new Set(results.map(r => r.source))];
    }
}

export default CombinedSearchService; 