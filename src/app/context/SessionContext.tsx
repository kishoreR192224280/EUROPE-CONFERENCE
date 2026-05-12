import { createContext, useContext, useState, ReactNode } from "react";

export interface Question {
  id: string | number;
  text: string;
  options: string[];
  correctAnswer: number;
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
  status: "draft" | "scheduled" | "waiting" | "active" | "results" | "leaderboard" | "ended" | "archived";
  currentQuestionIndex: number;
  participants: number;
}

interface SessionContextType {
  currentSession: Session | null;
  setSession: (session: Session) => void;
  updateSession: (updates: Partial<Session>) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  const setSession = (session: Session) => setCurrentSession(session);
  const updateSession = (updates: Partial<Session>) => {
    setCurrentSession((prev) => (prev ? { ...prev, ...updates } : null));
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
