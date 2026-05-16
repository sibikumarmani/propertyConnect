export type ThemeMode = "light" | "dark";

export const defaultThemeMode: ThemeMode = "light";
export const defaultAccentColor = "#138a9e";
export const themeModeKey = "propertyConnect.themeMode";
export const accentColorKey = "propertyConnect.accentColor";

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return defaultThemeMode;
  }

  return normalizeThemeMode(window.localStorage.getItem(themeModeKey));
}

export function getStoredAccentColor() {
  if (typeof window === "undefined") {
    return defaultAccentColor;
  }

  return normalizeAccentColor(window.localStorage.getItem(accentColorKey));
}

export function applyThemeSettings(mode: ThemeMode, accentColor: string, persist = true) {
  const themeMode = normalizeThemeMode(mode);
  const accent = normalizeAccentColor(accentColor);
  const accentRgb = hexToRgb(accent);
  const root = document.documentElement;

  root.dataset.theme = themeMode;
  root.style.setProperty("--brand", accent);
  root.style.setProperty("--brand-rgb", accentRgb.join(", "));
  root.style.setProperty("--brand-soft", alpha(accentRgb, themeMode === "dark" ? 0.28 : 0.26));
  root.style.setProperty("--brand-tint", alpha(accentRgb, themeMode === "dark" ? 0.14 : 0.08));
  root.style.setProperty("--brand-border", alpha(accentRgb, themeMode === "dark" ? 0.52 : 0.42));
  root.style.setProperty("--menu-active-end", mixHex(accent, themeMode === "dark" ? "#17384c" : "#183247", 0.28));
  root.style.setProperty("--topbar-end", mixHex(accent, themeMode === "dark" ? "#17384c" : "#edf4f7", themeMode === "dark" ? 0.38 : 0.16));

  if (persist) {
    window.localStorage.setItem(themeModeKey, themeMode);
    window.localStorage.setItem(accentColorKey, accent);
  }
}

export function normalizeThemeMode(value: unknown): ThemeMode {
  return value === "dark" ? "dark" : "light";
}

export function normalizeAccentColor(value: unknown) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : defaultAccentColor;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function alpha([red, green, blue]: [number, number, number], opacity: number) {
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function mixHex(fromHex: string, toHex: string, weight: number) {
  const from = hexToRgb(fromHex);
  const to = hexToRgb(toHex);
  const mixed = from.map((channel, index) => Math.round(channel * (1 - weight) + to[index] * weight));
  return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
}
