import { ENV_API_BASE_URL } from "../../config/env.ts";

export const BASE_URL = ENV_API_BASE_URL;

// ─── Token Storage ────────────────────────────────────────────────────────────

const TOKEN_KEY = "adminToken";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Returns the Authorization header object for admin API requests.
 * Throws if no token is stored (user not logged in).
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminAuthSuccess = {
  success: true;
  message: string;
  token: string;
  user: {
    id: number;
    name: string;
    username: string;
  };
};

type AdminAuthFailure = {
  success: false;
  error: string;
};

export type AdminAuthResponse = AdminAuthSuccess | AdminAuthFailure;

export const ADMIN_USER_STORAGE_KEY = "adminUser";

// ─── API Calls ────────────────────────────────────────────────────────────────

export async function adminLogin(username: string, password: string) {
  const res = await fetch(BASE_URL + "login.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = (await res.json()) as AdminAuthResponse;

  if (!res.ok || !data.success) {
    throw new Error(data.success ? "Login failed" : data.error);
  }

  // Store token for subsequent requests
  setStoredToken(data.token);

  return data;
}

export async function adminLogout() {
  clearStoredToken();
  localStorage.removeItem(ADMIN_USER_STORAGE_KEY);

  // Optionally notify the server (fire-and-forget)
  fetch(BASE_URL + "logout.php", {
    method: "POST",
    headers: getAuthHeaders(),
  }).catch(() => {});

  return { success: true };
}
