import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app.tsx";
import "./styles.css";

const container = document.querySelector("#root");

if (!container) {
  throw new Error("#root container is missing from index.html");
}

// StrictMode stays on: double-mounting is how we catch editor instances that
// do not survive remount.
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
