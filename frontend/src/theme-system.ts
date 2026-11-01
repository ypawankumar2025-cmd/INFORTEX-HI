/** INFOTEX HI: presentation preference only. Never stores API keys or project data. */
export const THEME_STORAGE_KEY = "infotex-hi-theme-v1";
export const DEFAULT_THEME = "blue" as const;
export const THEME_IDS = ["blue", "chocolate", "noir", "sunshine", "sage"] as const;
export type ThemeId = (typeof THEME_IDS)[number];
export const isThemeId = (v: unknown): v is ThemeId =>
  typeof v === "string" && (THEME_IDS as readonly string[]).includes(v);
export function readSavedTheme(): ThemeId {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(saved) ? saved : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}
export function applyTheme(value: ThemeId): void {
  document.documentElement.setAttribute("data-hi-theme", value);
  document.documentElement.style.colorScheme = value === "blue" || value === "noir" ? "dark" : "light";
}
export function saveTheme(value: ThemeId): void {
  try { window.localStorage.setItem(THEME_STORAGE_KEY, value); } catch { /* disabled storage */ }
}
