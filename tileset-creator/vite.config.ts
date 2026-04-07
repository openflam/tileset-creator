import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";
import { mockDevServerPlugin } from "vite-plugin-mock-dev-server";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const plugins = [react(), cesium()];
  const base = env.VITE_BASE_URL || "";
  let server;

  if (mode === "development") {
    // Always add SSL in development for CORS compatibility
    if (
      env.VITE_MAP_MODE !== "map-server" ||
      (env.VITE_DEFAULT_MAP_SERVER !== "localhost" &&
        env.VITE_DEFAULT_MAP_SERVER !== "http://localhost" &&
        env.VITE_DEFAULT_MAP_SERVER !== "https://localhost")
    ) {
      plugins.push(
        basicSsl({
          name: "localdev",
          domains: ["localhost"],
          certDir: "./.vite",
        }),
      );
    }
  }

  if (mode === "development" && env.VITE_MAP_MODE === "map-server") {
    if (env.VITE_DEFAULT_MAP_SERVER === "") {
      console.log("*** Proxying to mock dev server ***");
      plugins.push(mockDevServerPlugin());
    } else if (env.VITE_DEFAULT_MAP_SERVER === "localhost" || env.VITE_DEFAULT_MAP_SERVER === "http://localhost") {
      console.log("*** Running local dev against local map server stack (Caddy) ***");
    } else {
      console.log(`*** Proxying to remote map server: ${env.VITE_DEFAULT_MAP_SERVER} ***`);
      server = {
        proxy: {
          "^/api": {
            target: env.VITE_DEFAULT_MAP_SERVER,
            changeOrigin: true,
            secure: false,
          },
          "^/discover": {
            target: env.VITE_DEFAULT_MAP_SERVER,
            changeOrigin: true,
            secure: false,
          },
          "^/capabilities": {
            target: env.VITE_DEFAULT_MAP_SERVER,
            changeOrigin: true,
            secure: false,
          },
        },
      };
    }
  }

  return {
    base,
    plugins,
    server,
  };
});
