import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/index.css";

// Import Cesium CSS
import "cesium/Build/Cesium/Widgets/widgets.css";

// Import bootstrap CSS and icons
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
