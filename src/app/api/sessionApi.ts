import { BASE_URL, getAdminAuthHeaders } from "./adminAuth";
import type { Question, Session } from "../context/SessionContext";

type CreateSessionPayload = {
  title: string;
  description: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
  introVideoUrl?: string;
  status: "draft" | "waiting";
  questions: Question[];
};

type UploadLabelImageResponse =
  | {
      success: true;
      message: string;
      url: string;
      path: string;
    }
  | {
      success: false;
      error: string;
    };

type CreateSessionResponse =
  | {
      success: true;
      message: string;
      session: Session;
    }
  | {
      success: false;
      error: string;
    };

export async function createSession(payload: CreateSessionPayload) {
  const res = await fetch(BASE_URL + "create_session.php", {
    method: "POST",
    headers: getAdminAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as CreateSessionResponse;

  if (!res.ok || !data.success) {
    throw new Error(data.success ? "Failed to create session" : data.error);
  }

  return data.session;
}

export async function uploadLabelImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(BASE_URL + "upload_label_image.php", {
    method: "POST",
    headers: getAdminAuthHeaders(),
    credentials: "include",
    body: formData,
  });

  const data = (await res.json()) as UploadLabelImageResponse;

  if (!res.ok || !data.success) {
    throw new Error(data.success ? "Failed to upload image" : data.error);
  }

  return {
    ...data,
    url: normalizeUploadedAssetUrl(data.url, data.path),
  };
}

/** Prefer API-origin assets; rewrite stale socket/old hosts. */
function normalizeUploadedAssetUrl(url: string, path: string) {
  const apiOrigin = new URL(BASE_URL, window.location.origin).origin;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  try {
    const parsed = new URL(url, apiOrigin);
    const isStaleHost =
      parsed.hostname.includes("conference-socket") ||
      parsed.hostname === "europe-conference.onrender.com" ||
      parsed.hostname.includes("103.249.82.251");

    if (isStaleHost || parsed.origin !== apiOrigin) {
      return `${apiOrigin}${normalizedPath}`;
    }

    return parsed.toString();
  } catch {
    if (url.startsWith("/")) {
      return `${apiOrigin}${url}`;
    }
    return `${apiOrigin}${normalizedPath}`;
  }
}
