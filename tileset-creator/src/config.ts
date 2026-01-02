type ConfigType = {
  DISCOVERY_SUFFIX: string;
  GOOGLE_3D_TILES: MapInfo;
  CESIUM_ION_TOKEN: string;
  MODE: "global" | "map-server";
  API_LIST_MAPS: string;
  MAPS_SERVICES_BASE: string;
  DEFAULT_MAP_SERVER: string;
};

const CONFIG: ConfigType = {
  DISCOVERY_SUFFIX:
    import.meta.env.VITE_DISCOVERY_SUFFIX || "loc.open-flame.com.",
  GOOGLE_3D_TILES: {
    name: "Google",
    commonName: "Google",
    url: "https://tile.googleapis.com/v1/3dtiles/root.json",
    key: import.meta.env.VITE_GOOGLE_API_KEY as string,
    type: "default",
    creditImageUrl: "https://assets.ion.cesium.com/google-credit.png",
    mapIconUrl:
      "https://upload.wikimedia.org/wikipedia/commons/1/13/Googlelogo_color_272x92dp.png",
    authenticated: true,
  },
  CESIUM_ION_TOKEN: import.meta.env.VITE_CESIUM_ION_TOKEN as string,
  MODE: (import.meta.env.VITE_MAP_MODE as "global" | "map-server") || "global",
  API_LIST_MAPS: import.meta.env.VITE_API_LIST_MAPS || "/api/maps",
  MAPS_SERVICES_BASE: import.meta.env.VITE_MAPS_SERVICES_BASE || "/maps",
  DEFAULT_MAP_SERVER: import.meta.env.VITE_DEFAULT_MAP_SERVER || "",
};

export default CONFIG;
