type ConfigType = {
  DISCOVERY_SUFFIX: string;
  GOOGLE_3D_TILES: MapInfo;
  CESIUM_ION_TOKEN: string;
};

const CONFIG: ConfigType = {
  DISCOVERY_SUFFIX: "loc.open-flame.com.",
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
};

export default CONFIG;
