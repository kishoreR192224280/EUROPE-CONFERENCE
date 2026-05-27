import { BASE_URL } from "./adminAuth";
import type { Session } from "../context/SessionContext";

export const participantStorageKey = (code: string) => `participant:${code.toUpperCase()}`;
export const participantSocketStorageKey = (code: string) => `participant-socket:${code.toUpperCase()}`;
export const participantTabStorageKey = (
  code: string,
  sessionId: string | number,
  studentId: string | number
) => `participant-tab:${code.toUpperCase()}:${sessionId}:${studentId}`;
export const studentSessionSocketKey = (sessionId: string | number, studentId: string | number) =>
  `${sessionId}-${studentId}`;

export type ParticipantRecord = {
  id: number;
  studentId?: number;
  name: string;
  phoneNumber: string | null;
  token: string;
};

export function getParticipantStudentId(participant: ParticipantRecord) {
  return participant.studentId ?? participant.id;
}

function createClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getOrCreateParticipantTabId(
  code: string,
  sessionId: string | number,
  studentId: string | number
) {
  const key = participantTabStorageKey(code, sessionId, studentId);
  const existingTabId = sessionStorage.getItem(key);
  if (existingTabId) {
    return existingTabId;
  }

  const nextTabId = createClientId();
  sessionStorage.setItem(key, nextTabId);
  return nextTabId;
}

export function parseParticipantRecord(serialized: string | null | undefined) {
  if (!serialized) {
    return null;
  }

  try {
    return JSON.parse(serialized) as ParticipantRecord;
  } catch {
    return null;
  }
}

type ApiFailure = {
  success: false;
  error: string;
  code?: string;
};

type JoinSessionResponse =
  | {
      success: true;
      participant: ParticipantRecord;
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
        selectedOptionId?: number | null;
        timedOut?: boolean;
        deadlineExpired?: boolean;
        serverNow?: string;
        timeRemainingSeconds?: number;
        correctParts?: number;
        totalParts?: number;
        labelResults?: Record<
          string,
          {
            submitted: string;
            isCorrect: boolean;
            acceptedAnswers: string[];
          }
        >;
        matchingResults?: Record<
          string,
          {
            selectedPairId: string | null;
            selectedRightText: string;
            correctRightText: string;
            selectedRightLabel?: string;
            correctRightLabel?: string;
            selectedRightImageUrl?: string | null;
            correctRightImageUrl?: string | null;
            isCorrect: boolean;
          }
        >;
      };
    }
  | ApiFailure;

async function readJson<T>(res: Response) {
  return (await res.json()) as T;
}

export async function joinLiveSession(payload: {
  code: string;
  name: string;
  phoneNumber: string;
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

export async function getPublicSession(code: string, participantToken?: string, scope?: "public" | "display") {
  const params = new URLSearchParams({ code });
  if (participantToken) {
    params.set("participantToken", participantToken);
  }
  if (scope) {
    params.set("scope", scope);
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
  action: "launch_next" | "reveal_results" | "show_leaderboard" | "resume" | "end"
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
  selectedOptionIndex: number | null;
  selectedOptionId?: number | null;
  socketId?: string | null;
    responseData?: {
      items?: string[];
      labels?: Record<string, string>;
      matches?: Record<string, string>;
    } | null;
}) {
  const res = await fetch(BASE_URL + "submit_answer.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await readJson<SubmitAnswerResponse>(res);
  if (!res.ok || !data.success) {
    const error = new Error(data.success ? "Failed to submit answer" : data.error);
    if (!data.success && data.code) {
      (error as Error & { code?: string }).code = data.code;
    }
    throw error;
  }

  return data.answer;
}
