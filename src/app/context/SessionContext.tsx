import { createContext, useContext, useState, ReactNode } from "react";

export const ACTIVE_ADMIN_SESSION_ID_STORAGE_KEY = "activeAdminSessionId";

export type QuestionType = "multiple_choice" | "sorting" | "label_image";

export type LabelImageZone = {
  id: string;
  marker: number;
  x: number;
  y: number;
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
  correctAnswer?: number;
  items?: string[];
  correctOrder?: string[];
  labels?: LabelImageZone[];
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
  status: "draft" | "scheduled" | "waiting" | "active" | "results" | "leaderboard" | "ended" | "archived";
  currentQuestionId?: string | number | null;
  currentQuestionIndex: number;
  currentQuestion?: Question | null;
  currentQuestionResponse?: {
    id: number;
    selectedOptionIndex: number | null;
    responseData?: {
      items?: string[];
      labels?: Record<string, string>;
    } | null;
    isCorrect: boolean;
    responseTimeMs: number | null;
    scoreAwarded: number;
    answeredAt: string | null;
    submitted: true;
  } | null;
  questionStartedAt?: string | null;
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
}

interface SessionContextType {
  currentSession: Session | null;
  setSession: (session: Session) => void;
  updateSession: (updates: Partial<Session>) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  const setSession = (session: Session) => {
    setCurrentSession(session);

    if (typeof window !== "undefined" && session?.id !== undefined && session?.id !== null) {
      window.localStorage.setItem(
        ACTIVE_ADMIN_SESSION_ID_STORAGE_KEY,
        String(session.id)
      );
    }
  };
  const updateSession = (updates: Partial<Session>) => {
    setCurrentSession((prev) => {
      if (!prev) {
        return null;
      }

      const nextSession = { ...prev, ...updates };
      if (typeof window !== "undefined" && nextSession.id !== undefined && nextSession.id !== null) {
        window.localStorage.setItem(
          ACTIVE_ADMIN_SESSION_ID_STORAGE_KEY,
          String(nextSession.id)
        );
      }

      return nextSession;
    });
  };

  return (
    <SessionContext.Provider value={{ currentSession, setSession, updateSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within SessionProvider");
  return context;
}
