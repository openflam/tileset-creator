import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";
import { mockDevServerPlugin } from "vite-plugin-mock-dev-server";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const plugins = [react(), cesium()];
  let server;

  if (
    mode === "development" &&
    env.VITE_MAP_MODE === "map-server" &&
    env.VITE_DEFAULT_MAP_SERVER_URL === ""
  ) {
    console.log("*** Proxying to mock dev server ***");
    plugins.push(mockDevServerPlugin());
    server = {
      proxy: {
        "^/api": "https://cmu-mapserver.open-flame.com",
        "^/discovery": "https://cmu-mapserver.open-flame.com",
      },
    };
  }

  return {
    plugins,
    server,
  };
});
