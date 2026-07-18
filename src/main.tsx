import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/i18n";
import { applyWhiteLabelTheme } from "./config/theme";

// Inyecta la identidad white-label (colores/branding) antes de renderizar.
applyWhiteLabelTheme();

createRoot(document.getElementById("root")!).render(<App />);
