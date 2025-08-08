import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/index.css";
import "cesium/Build/Cesium/Widgets/widgets.css";

import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
