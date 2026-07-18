/**
 * ============================================================
 *  WHITE-LABEL CONFIG — Identidad central de la app
 * ============================================================
 *  Para revender la app a un influencer/cliente:
 *   1. Pon `isWhiteLabelActive: true`
 *   2. Cambia `brandName`, `logoUrl` y los `colors`
 *   3. Listo: toda la app (colores neón, fondo, branding) se
 *      transforma automaticamente sin tocar ningun otro archivo.
 * ============================================================
 */
/** Nombre de marca — NUNCA traducir, siempre en inglés */
export const APP_NAME = "you better work b*tch!" as const;

export const WHITE_LABEL_CONFIG = {
  // Cambiar a true cuando se venda a un cliente con marca propia.
  isWhiteLabelActive: false,

  brandName: "You Better Work B*tch!",
  // Si isWhiteLabelActive es true se muestra esta imagen como logo.
  // Si es false se usa el icono por defecto de la app.
  logoUrl: "/assets/default-logo.png",

  colors: {
    primaryNeon: "#00FF41",   // Verde neon principal
    secondaryNeon: "#00FFFF", // Cian electrico (gradientes)
    background: "#000000",    // Fondo de la app
    cardBg: "#0a0a0a",        // Fondo de tarjetas
  },
} as const;

/**
 * Convierte un color HEX (#RRGGBB) al formato "H S% L%"
 * que usan las variables CSS de Tailwind (sin envolver en hsl()).
 */
function hexToHslString(hex: string): string {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  }
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  let sat = 0;
  const light = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    sat = light > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hue = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / d + 2;
        break;
      default:
        hue = (r - g) / d + 4;
    }
    hue /= 6;
  }

  const H = Math.round(hue * 360);
  const S = Math.round(sat * 100);
  const L = Math.round(light * 100);
  return `${H} ${S}% ${L}%`;
}

/**
 * Inyecta los colores de WHITE_LABEL_CONFIG en las variables CSS
 * del documento. Debe llamarse una sola vez al iniciar la app.
 */
export function applyWhiteLabelTheme(): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const { colors } = WHITE_LABEL_CONFIG;

  // Colores HEX usados directamente en gradientes/glows.
  root.style.setProperty("--neon-green", colors.primaryNeon);
  root.style.setProperty("--electric-cyan", colors.secondaryNeon);

  // Variables HSL usadas por las utilidades de Tailwind.
  const primaryHsl = hexToHslString(colors.primaryNeon);
  const secondaryHsl = hexToHslString(colors.secondaryNeon);
  const bgHsl = hexToHslString(colors.background);
  const cardHsl = hexToHslString(colors.cardBg);

  root.style.setProperty("--primary", primaryHsl);
  root.style.setProperty("--accent", primaryHsl);
  root.style.setProperty("--ring", primaryHsl);
  root.style.setProperty("--sidebar-primary", primaryHsl);
  root.style.setProperty("--sidebar-ring", primaryHsl);
  root.style.setProperty("--secondary", secondaryHsl);
  root.style.setProperty("--background", bgHsl);
  root.style.setProperty("--card", cardHsl);
  root.style.setProperty("--popover", cardHsl);
}
