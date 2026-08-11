import { ENV_API_BASE_URL } from "../../config/env";

export const BASE_URL = ENV_API_BASE_URL;
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
export const ADMIN_AUTH_TOKEN_STORAGE_KEY = "adminAuthToken";

export function getAdminAuthToken() {
  return localStorage.getItem(ADMIN_AUTH_TOKEN_STORAGE_KEY);
}

export function getAdminAuthHeaders(headers?: HeadersInit): Headers {
  const merged = new Headers(headers);
  const token = getAdminAuthToken();

  if (token) {
    merged.set("Authorization", `Bearer ${token}`);
  }

  return merged;
}

export async function adminLogin(username: string, password: string) {
  const res = await fetch(BASE_URL + "login.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });

  const data = (await res.json()) as AdminAuthResponse;

  if (!res.ok) {
    throw new Error(data.success ? "Login failed" : data.error);
  }

  if (data.success) {
    localStorage.setItem(ADMIN_AUTH_TOKEN_STORAGE_KEY, data.token);
  }

  return data;
}

export async function adminLogout() {
  const res = await fetch(BASE_URL + "logout.php", {
    method: "POST",
    headers: getAdminAuthHeaders(),
    credentials: "include",
  });

  localStorage.removeItem(ADMIN_AUTH_TOKEN_STORAGE_KEY);

  return res.json();
}
