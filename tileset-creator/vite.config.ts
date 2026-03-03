import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";
import { mockDevServerPlugin } from "vite-plugin-mock-dev-server";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const plugins = [react(), cesium()];
  const base = env.VITE_BASE_URL || "";
  let server;

  if (mode === "development" && env.VITE_MAP_MODE === "map-server") {
    if (env.VITE_DEFAULT_MAP_SERVER === "") {
      // Local dev WITHOUT local map server AND WITH mock data
      console.log("*** Proxying to mock dev server ***");
      plugins.push(mockDevServerPlugin());
      plugins.push(
        basicSsl({
          name: "localdev",
          domains: ["localhost"],
          certDir: "./.vite",
        }),
      );
    } else if (env.VITE_DEFAULT_MAP_SERVER === "localhost" || env.VITE_DEFAULT_MAP_SERVER === "http://localhost") {
      // Local dev WITH local map server (our docker compose stack)
      // Caddy handles the proxying and routing. No Vite proxy or basicSsl needed here.
      console.log("*** Running local dev against local map server stack (Caddy) ***");
    } else {
      // Local dev WITHOUT local map server (proxying to a real remote HTTPS API)
      console.log(`*** Proxying to remote map server: ${env.VITE_DEFAULT_MAP_SERVER} ***`);
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
            target: env.VITE_DEFAULT_MAP_SERVER, // e.g. "https://cmu-mapserver.open-flame.com"
            changeOrigin: true,
            secure: false, // ignore self-signed certs / SSL issues
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
