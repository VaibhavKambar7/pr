import type { AuthResponse } from "./api";

const ACCESS_TOKEN_STORAGE_KEY = "pr.accessToken";
const REFRESH_TOKEN_STORAGE_KEY = "pr.refreshToken";

export function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function getStoredRefreshToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function storeAuthSession(result: AuthResponse) {
  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, result.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, result.refreshToken);
}

export function storeAuthTokens(input: { accessToken: string; refreshToken: string }) {
  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, input.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, input.refreshToken);
}

export function clearAuthSession() {
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}
