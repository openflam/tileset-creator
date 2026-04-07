import { getFullUrl } from "./openflame/discover";

export interface SearchServer {
  url: string;
  name: string;
}

/**
 * Extract search service URLs from the currently loaded map servers.
 * Checks each MapInfo's MapServer capabilities for a "search" service.
 */
export function getSearchServersFromMaps(
  mapTilesLoaded: MapTilesLoaded,
): SearchServer[] {
  const servers: SearchServer[] = [];
  const seenUrls = new Set<string>();

  for (const mapInfo of Object.values(mapTilesLoaded)) {
    const mapServer = mapInfo.mapServer;
    if (!mapServer) continue;

    const searchService = mapServer.getService("search");
    if (!searchService) continue;

    const rawUrl = getFullUrl(searchService.url, mapServer.name);
    if (!rawUrl) continue;
    const fullUrl = rawUrl.replace(/\/+$/, "");
    if (seenUrls.has(fullUrl)) continue;

    seenUrls.add(fullUrl);
    servers.push({
      url: fullUrl,
      name: mapInfo.commonName || mapInfo.name,
    });
  }

  return servers;
}
