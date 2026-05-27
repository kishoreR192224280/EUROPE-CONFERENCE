import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export const ACTIVE_ADMIN_SESSION_ID_STORAGE_KEY = "activeAdminSessionId";

export type QuestionType = "multiple_choice" | "sorting" | "label_image" | "matching";

export type MatchingPair = {
  id: string;
  leftText: string;
  leftImageUrl?: string;
  rightText: string;
  rightImageUrl?: string;
};

export type LabelImageZone = {
  id: string;
  marker: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  prompt: string;
  acceptedAnswers?: string[];
};

export interface Question {
  id: string | number;
  questionType: QuestionType;
  text: string;
  instructions?: string;
  mediaUrl?: string;
  options: string[];
  optionIds?: number[];
  correctAnswer?: number;
  items?: string[];
  correctOrder?: string[];
  labels?: LabelImageZone[];
  matchingPairs?: MatchingPair[];
  timer: number;
  showLeaderboardAfter: boolean;
}

export interface Session {
  id: string | number;
  code: string;
  title: string;
  description: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  introVideoUrl?: string;
  questions: Question[];
  questionCount?: number;
  status: "draft" | "scheduled" | "waiting" | "active" | "paused" | "results" | "leaderboard" | "ended" | "archived";
  currentQuestionId?: string | number | null;
  currentQuestionIndex: number;
  currentQuestion?: Question | null;
  currentQuestionResponse?: {
    id: number;
    selectedOptionIndex: number | null;
    selectedOptionId?: number | null;
    responseData?: {
      items?: string[];
      labels?: Record<string, string>;
      matches?: Record<string, string>;
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
    } | null;
    isCorrect: boolean;
    responseTimeMs: number | null;
    scoreAwarded: number;
    answeredAt: string | null;
    submitted: true;
  } | null;
  questionStartedAt?: string | null;
  serverNow?: string | null;
  hostConnectionStatus?: "connected" | "reconnecting" | "disconnected";
  hostLastSeenAt?: string | null;
  pausedAt?: string | null;
  pauseReason?: string | null;
  timeRemainingSeconds?: number | null;
  participants: number;
  participantSummary?: {
    id: number;
    studentId?: number;
    name: string;
    phoneNumber: string | null;
    score: number;
    rank: number;
    participantCount: number;
    answersSubmitted: number;
    correctAnswers: number;
    fullyCorrectAnswers?: number;
    partiallyCorrectAnswers?: number;
    correctParts?: number;
    totalParts?: number;
    totalResponseTimeMs: number;
  } | null;
  leaderboard?: Array<{
    id: number;
    studentId?: number;
    name: string;
    phoneNumber: string | null;
    score: number;
    rank: number;
  }>;
  liveFeed?: Array<{
    id: number;
    studentId?: number;
    name: string;
    phoneNumber: string | null;
    score: number;
    hasAnsweredCurrentQuestion: boolean;
    selectedOptionIndex: number | null;
    activityLabel: string;
    presence: "active" | "waiting" | "idle";
    lastActivityAt: string | null;
  }>;
  liveMetrics?: {
    totalParticipants: number;
    answeredParticipants: number;
    waitingParticipants: number;
  };
  currentQuestionStats?: {
    optionCounts?: Array<{
      name: string;
      optionText: string;
      count: number;
      isCorrect: boolean;
    }>;
  } | null;
}

interface SessionContextType {
  currentSession: Session | null;
  setSession: (session: Session) => void;
  updateSession: (updates: Partial<Session> | ((prev: Session) => Partial<Session>)) => void;
  /** Lightweight: update only the participant count without touching anything else. */
  updateParticipantCount: (count: number) => void;
  /** Lightweight: update only live metrics (answer counts) without touching anything else. */
  updateLiveMetrics: (answeredParticipants: number, totalParticipants: number) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

/**
 * Strips undefined (but NOT null) values from a socket payload so lightweight
 * socket events — which omit most fields — don't accidentally overwrite valid
 * session state with undefined. Null is kept because some fields legitimately
 * need to be cleared (e.g. currentQuestionResponse = null on question change).
 */
function stripUndefined<T extends object>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && (obj[key] as unknown) !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

function persistSessionId(id: string | number | undefined | null) {
  if (typeof window !== "undefined" && id !== undefined && id !== null) {
    window.localStorage.setItem(ACTIVE_ADMIN_SESSION_ID_STORAGE_KEY, String(id));
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  const setSession = useCallback((session: Session) => {
    setCurrentSession(session);
    persistSessionId(session?.id);
  }, []);

  const updateSession = useCallback((updates: Partial<Session> | ((prev: Session) => Partial<Session>)) => {
    setCurrentSession((prev) => {
      if (!prev) return null;

      const rawUpdates = typeof updates === "function" ? updates(prev) : updates;

      // Strip undefined fields so lightweight socket payloads (which omit most
      // fields) don't overwrite valid state. Null is intentionally kept so
      // things like currentQuestionResponse can be explicitly cleared.
      const nextUpdates = stripUndefined(rawUpdates);

      // Auto-clear transient per-question state when the active question changes.
      const cleanedUpdates = { ...nextUpdates };
      if (
        nextUpdates.currentQuestionId !== undefined &&
        nextUpdates.currentQuestionId !== prev.currentQuestionId
      ) {
        if (!("currentQuestionResponse" in nextUpdates)) {
          cleanedUpdates.currentQuestionResponse = null;
        }
        if (!("currentQuestionStats" in nextUpdates)) {
          cleanedUpdates.currentQuestionStats = null;
        }
      }

      const nextSession = { ...prev, ...cleanedUpdates };
      persistSessionId(nextSession.id);
      return nextSession;
    });
  }, []);

  /**
   * Lightweight helper — updates only the participant count.
   * Skips the update entirely if the count hasn't changed, preventing
   * unnecessary React renders in any component that reads participants.
   */
  const updateParticipantCount = useCallback((count: number) => {
    setCurrentSession((prev) => {
      if (!prev || prev.participants === count) return prev;
      return { ...prev, participants: count };
    });
  }, []);

  /**
   * Lightweight helper — updates only liveMetrics (answered/total counts).
   * Used by session:answer-count socket events so the admin's metrics bar
   * can refresh without triggering re-renders in question/leaderboard trees.
   */
  const updateLiveMetrics = useCallback((answeredParticipants: number, totalParticipants: number) => {
    setCurrentSession((prev) => {
      if (!prev) return null;
      const prevMetrics = prev.liveMetrics;
      if (
        prevMetrics?.answeredParticipants === answeredParticipants &&
        prevMetrics?.totalParticipants === totalParticipants
      ) {
        return prev; // No-op
      }
      return {
        ...prev,
        liveMetrics: {
          totalParticipants,
          answeredParticipants,
          waitingParticipants: Math.max(0, totalParticipants - answeredParticipants),
        },
      };
    });
  }, []);

  const clearSession = useCallback(() => {
    setCurrentSession(null);
  }, []);

  return (
    <SessionContext.Provider value={{ currentSession, setSession, updateSession, updateParticipantCount, updateLiveMetrics, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within SessionProvider");
  return context;
}
