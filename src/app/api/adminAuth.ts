export const BASE_URL = "http://localhost/WEBSITE-backend/";

type AdminAuthSuccess = {
  success: true;
  message: string;
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

  return data;
}

export async function adminLogout() {
  const res = await fetch(BASE_URL + "logout.php", {
    method: "POST",
    credentials: "include",
  });

  return res.json();
}
