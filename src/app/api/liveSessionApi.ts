import { BASE_URL } from "./adminAuth";
import type { Session } from "../context/SessionContext";

export const participantStorageKey = (code: string) => `participant:${code.toUpperCase()}`;

type ApiFailure = {
  success: false;
  error: string;
};

type JoinSessionResponse =
  | {
      success: true;
      participant: {
        id: number;
        name: string;
        registerNumber: string | null;
        token: string;
      };
      session: Session;
    }
  | ApiFailure;

type SessionResponse =
  | {
      success: true;
      session: Session;
    }
  | ApiFailure;

type SubmitAnswerResponse =
  | {
      success: true;
      answer: {
        isCorrect: boolean;
        scoreAwarded: number;
        responseTimeMs: number | null;
      };
    }
  | ApiFailure;

async function readJson<T>(res: Response) {
  return (await res.json()) as T;
}

export async function joinLiveSession(payload: {
  code: string;
  name: string;
  registerNumber: string;
}) {
  const res = await fetch(BASE_URL + "join_session.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await readJson<JoinSessionResponse>(res);
  if (!res.ok || !data.success) {
    throw new Error(data.success ? "Failed to join session" : data.error);
  }

  return data;
}

export async function getPublicSession(code: string, participantToken?: string) {
  const params = new URLSearchParams({ code });
  if (participantToken) {
    params.set("participantToken", participantToken);
  }

  const res = await fetch(BASE_URL + `get_session.php?${params.toString()}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await readJson<SessionResponse>(res);
  if (!res.ok || !data.success) {
    throw new Error(data.success ? "Failed to load session" : data.error);
  }

  return data.session;
}

export async function getAdminSession(sessionId: string | number) {
  const res = await fetch(BASE_URL + `get_admin_session.php?id=${encodeURIComponent(String(sessionId))}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await readJson<SessionResponse>(res);
  if (!res.ok || !data.success) {
    throw new Error(data.success ? "Failed to load session" : data.error);
  }

  return data.session;
}

export async function updateAdminSessionState(
  sessionId: string | number,
  action: "launch_next" | "reveal_results" | "show_leaderboard" | "end"
) {
  const res = await fetch(BASE_URL + "update_session_state.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ sessionId, action }),
  });

  const data = await readJson<SessionResponse>(res);
  if (!res.ok || !data.success) {
    throw new Error(data.success ? "Failed to update session state" : data.error);
  }

  return data.session;
}

export async function submitParticipantAnswer(payload: {
  participantToken: string;
  questionId: string | number;
  selectedOptionIndex: number;
}) {
  const res = await fetch(BASE_URL + "submit_answer.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await readJson<SubmitAnswerResponse>(res);
  if (!res.ok || !data.success) {
    throw new Error(data.success ? "Failed to submit answer" : data.error);
  }

  return data.answer;
}
