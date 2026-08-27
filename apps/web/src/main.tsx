import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./figma-sync.css";
import "./support-million.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
