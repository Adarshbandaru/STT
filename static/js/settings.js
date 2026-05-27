/**
 * VoxAI – Settings & API Key Manager
 */

const API_KEY_STORAGE = "voxai_api_key";
const THEME_STORAGE = "voxai_theme";

export function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE) || "";
}

export function setApiKey(key) {
  localStorage.setItem(API_KEY_STORAGE, key);
}

export function getTheme() {
  return localStorage.getItem(THEME_STORAGE) || "dark";
}

export function setTheme(theme) {
  localStorage.setItem(THEME_STORAGE, theme);
  document.documentElement.setAttribute("data-theme", theme);
}

export function toggleTheme() {
  const current = getTheme();
  setTheme(current === "dark" ? "light" : "dark");
  return getTheme();
}

export function initTheme() {
  const saved = getTheme();
  document.documentElement.setAttribute("data-theme", saved);
  return saved;
}