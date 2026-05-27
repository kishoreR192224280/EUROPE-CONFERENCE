import { BASE_URL } from "./adminAuth";
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
    headers: { "Content-Type": "application/json" },
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
    credentials: "include",
    body: formData,
  });

  const data = (await res.json()) as UploadLabelImageResponse;

  if (!res.ok || !data.success) {
    throw new Error(data.success ? "Failed to upload image" : data.error);
  }

  return data;
}
