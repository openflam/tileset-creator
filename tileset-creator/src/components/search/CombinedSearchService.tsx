import NominatimGeocoderService from "../../utils/cesium/NominatimGeocoderService";
import GoogleGeocoderService from "../../utils/cesium/GoogleGeocoderService";

export interface SearchResult {
  displayName: string;
  destination: any;
  altitude: number;
  attribution: any;
  source: "nominatim" | "google";
  sourceIcon: string;
  sourceColor: string;
  sourceName: string;
  googleData?: any;
  serverInfo?: {
    serverIndex: number;
    serverUrl: string;
    source: string;
  };
  _rawNominatimData?: any;
}

export interface CombinedSearchOptions {
  maxResultsPerSource?: number;
  enableGoogle?: boolean;
  deduplicateResults?: boolean;
}

export class CombinedSearchService {
  private nominatimServices: { service: any; url: string; name: string }[] = [];
  private googleService: any;
  private options: CombinedSearchOptions;

  constructor(options: CombinedSearchOptions = {}) {
    this.options = {
      maxResultsPerSource: 5,
      enableGoogle: true,
      deduplicateResults: true,
      ...options,
    };

    if (this.options.enableGoogle) {
      this.googleService = new (GoogleGeocoderService as any)();
    }
  }

  /**
   * Update the set of Nominatim-compatible search servers.
   * Call this whenever the discovered map servers change.
   */
  updateSearchServers(servers: { url: string; name: string }[]) {
    const currentUrls = new Set(this.nominatimServices.map((s) => s.url));
    const newUrls = new Set(servers.map((s) => s.url));

    // Skip rebuild if the URL set hasn't changed
    if (
      currentUrls.size === newUrls.size &&
      [...currentUrls].every((u) => newUrls.has(u))
    ) {
      return;
    }

    this.nominatimServices = servers.map((server) => ({
      service: new (NominatimGeocoderService as any)(server.url),
      url: server.url,
      name: server.name,
    }));
  }

  /**
   * Search all backends and combine results
   */
  async search(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchPromises: Promise<SearchResult[]>[] = [];

    if (this.nominatimServices.length > 0) {
      searchPromises.push(this.searchAllNominatimServers(query, signal));
    }

    if (this.options.enableGoogle && this.googleService) {
      searchPromises.push(this.searchGoogle(query, signal));
    }

    try {
      const results = await Promise.allSettled(searchPromises);

      let combinedResults: SearchResult[] = [];

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          combinedResults = combinedResults.concat(result.value);
        } else {
          console.error("Search failed for a source:", result.reason);
        }
      });

      if (this.options.deduplicateResults) {
        combinedResults = this.deduplicateResults(combinedResults);
      }

      return combinedResults;
    } catch (error) {
      console.error("Combined search error:", error);
      return [];
    }
  }

  private withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    fallbackValue: T,
  ): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<T>((resolve) => {
      timeoutId = setTimeout(() => {
        resolve(fallbackValue);
      }, timeoutMs);
    });

    const guardedPromise = promise.then(
      (value) => {
        clearTimeout(timeoutId);
        return value;
      },
      (error) => {
        clearTimeout(timeoutId);
        throw error;
      },
    );

    return Promise.race([guardedPromise, timeoutPromise]);
  }

  private async searchAllNominatimServers(
    query: string,
    signal?: AbortSignal,
  ): Promise<SearchResult[]> {
    const SERVER_TIMEOUT_MS = 5000;

    try {
      if (signal?.aborted) {
        throw new Error("Search was cancelled");
      }

      const nominatimPromises = this.nominatimServices.map(
        async ({ service, url, name }, index) => {
          const serverSearch = async (): Promise<SearchResult[]> => {
            try {
              const results = await service.geocode(query);
              return results
                .slice(0, this.options.maxResultsPerSource)
                .map((result: any) => ({
                  ...result,
                  source: "nominatim" as const,
                  sourceIcon: "🌍",
                  sourceColor: "#7cb342",
                  sourceName: name,
                  serverInfo: result.serverInfo || {
                    serverIndex: index,
                    serverUrl: url,
                    source: "nominatim",
                  },
                }));
            } catch (error) {
              console.error(`Search server "${name}" error:`, error);
              return [];
            }
          };

          return this.withTimeout(serverSearch(), SERVER_TIMEOUT_MS, []);
        },
      );

      const allNominatimResults = await Promise.all(nominatimPromises);
      return allNominatimResults.flat();
    } catch (error) {
      console.error("All search servers error:", error);
      return [];
    }
  }

  private async searchGoogle(
    query: string,
    signal?: AbortSignal,
  ): Promise<SearchResult[]> {
    const GOOGLE_TIMEOUT_MS = 5000;

    const googleSearch = async (): Promise<SearchResult[]> => {
      try {
        if (signal?.aborted) {
          throw new Error("Search was cancelled");
        }

        const results = await this.googleService.geocode(query);

        return results
          .slice(0, this.options.maxResultsPerSource)
          .map((result: any) => ({
            ...result,
            source: "google" as const,
            sourceIcon: "🗺️",
            sourceColor: "#4285f4",
            sourceName: "Google Maps",
            googleData: result.googleData || {},
          }));
      } catch (error) {
        console.error("Google search error:", error);
        return [];
      }
    };

    return this.withTimeout(googleSearch(), GOOGLE_TIMEOUT_MS, []);
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    const deduplicated: SearchResult[] = [];

    for (const result of results) {
      const normalizedName = result.displayName
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (!seen.has(normalizedName)) {
        seen.add(normalizedName);
        deduplicated.push(result);
      }
    }

    return deduplicated;
  }

  getSearchStats(results: SearchResult[]) {
    const nominatimResults = results.filter((r) => r.source === "nominatim");
    const googleResults = results.filter((r) => r.source === "google");

    const serverStats: { [key: number]: number } = {};
    nominatimResults.forEach((result) => {
      if (result.serverInfo?.serverIndex !== undefined) {
        const serverIndex = result.serverInfo.serverIndex;
        serverStats[serverIndex] = (serverStats[serverIndex] || 0) + 1;
      }
    });

    return {
      total: results.length,
      nominatim: nominatimResults.length,
      google: googleResults.length,
      servers: serverStats,
      serverDetails: Object.entries(serverStats).map(([index, count]) => ({
        serverIndex: parseInt(index),
        count,
        results: nominatimResults.filter(
          (r) => r.serverInfo?.serverIndex === parseInt(index),
        ),
      })),
    };
  }
}

export default CombinedSearchService;
