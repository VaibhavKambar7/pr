import type { AuthResponse } from "./api";

const TOKEN_STORAGE_KEY = "pr.accessToken";

export function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function storeAuthSession(result: AuthResponse) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, result.accessToken);
}

export function clearAuthSession() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}
