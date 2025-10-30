import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";
import { mockDevServerPlugin } from "vite-plugin-mock-dev-server";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const plugins = [react(), cesium()];
  let server;

  if (mode === "development" && env.VITE_MAP_MODE === "map-server") {
    if (env.VITE_DEFAULT_MAP_SERVER === "") {
      console.log("*** Proxying to mock dev server ***");
      plugins.push(mockDevServerPlugin());
    }
    plugins.push(
      basicSsl({
        name: "localdev",
        domains: ["localhost"],
        certDir: "./.vite",
      }),
    );
    server = {
      proxy: {
        "^/api": {
          target: "https://cmu-mapserver.open-flame.com",
          changeOrigin: true,
          secure: false, // ignore self-signed certs / SSL issues
        },
        "^/discover": {
          target: "https://cmu-mapserver.open-flame.com",
          changeOrigin: true,
          secure: false,
        },
        "^/capabilities": {
          target: "https://cmu-mapserver.open-flame.com",
          changeOrigin: true,
          secure: false,
        },
      },
    };
  }

  return {
    plugins,
    server,
  };
});
