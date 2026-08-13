import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Loader2, Users, CheckCircle2, WifiOff } from "lucide-react";
import { motion } from "motion/react";
import { useSession } from "../../context/SessionContext";
import {
  getPublicSession,
  participantSocketStorageKey,
  participantStorageKey,
  parseParticipantRecord,
} from "../../api/liveSessionApi";
import { useParticipantSessionSocket } from "../../hooks/useParticipantSessionSocket";
import { useSingleParticipantTab } from "../../hooks/useSingleParticipantTab";
import { StudentSessionEnded } from "./StudentSessionEnded";

function getResumeRoute(code: string, status?: string) {
  if (status === "waiting" || status === "draft" || status === "scheduled") {
    return `/join/${code}/waiting`;
  }

  return `/join/${code}/question`;
}

export function StudentWaiting() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { currentSession, setSession, updateSession, updateParticipantCount, clearSession } = useSession();
  const participantJson = code ? sessionStorage.getItem(participantStorageKey(code)) : null;
  const participant = useMemo(() => parseParticipantRecord(participantJson), [participantJson]);

  // Track whether a fallback poll is active — we only start it when the socket
  // is NOT connected and stop it the moment the socket connects.
  const fallbackTimerRef = useRef<number | null>(null);
  const [socketReady, setSocketReady] = useState(false);

  const stopFallback = () => {
    if (fallbackTimerRef.current !== null) {
      window.clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  };

  const revokeParticipantAccess = () => {
    if (!code) return;
    sessionStorage.removeItem(participantStorageKey(code));
    sessionStorage.removeItem(participantSocketStorageKey(code));
    clearSession();
    navigate(`/join/${code}/expired`, { replace: true });
  };

  const expireConnection = () => {
    if (!code) return;
    sessionStorage.removeItem(participantStorageKey(code));
    sessionStorage.removeItem(participantSocketStorageKey(code));
    clearSession();
    navigate(`/join/${code}/expired?reason=connection`, { replace: true });
  };

  useSingleParticipantTab({
    code,
    participant,
    sessionId: currentSession?.id ?? null,
    enabled: Boolean(code && participant && currentSession?.id !== undefined && currentSession?.id !== null),
    onDuplicate: revokeParticipantAccess,
  });

  const participantSocket = useParticipantSessionSocket({
    code,
    participant,
    sessionId: currentSession?.id ?? null,
    enabled: Boolean(code && participant && currentSession?.id !== undefined && currentSession?.id !== null),
    onForceLogout: revokeParticipantAccess,
    onConnectionExpired: expireConnection,
    onSessionUpdate: (payload) => {
      updateSession((prev) => {
        const updates = { ...payload };
        // Derive currentQuestion from bootstrap data when question changes.
        // The socket sends lightweight payloads without full question content —
        // we look up the matching question from the bootstrapped list.
        if (
          updates.currentQuestionId != null &&
          (updates.currentQuestionId !== prev.currentQuestionId || !prev.currentQuestion) &&
          prev.questions?.length
        ) {
          const qIdx = prev.questions.findIndex(
            (q) => String(q.id) === String(updates.currentQuestionId)
          );
          if (qIdx >= 0) {
            updates.currentQuestionIndex = qIdx;
            updates.currentQuestion = prev.questions[qIdx];
          }
        }
        return updates;
      });
      const nextStatus = payload.status ?? currentSession?.status;
      if (nextStatus && code) {
        const resumeRoute = getResumeRoute(code, nextStatus);
        if (resumeRoute !== `/join/${code}/waiting`) {
          navigate(resumeRoute, { replace: true });
        }
      }
    },
    // Lightweight participant-count events: update only the count, nothing else.
    onParticipantUpdate: (count) => {
      updateParticipantCount(count);
    },
  });

  // ── Socket readiness gate ────────────────────────────────────────────────
  // Track when the socket becomes connected so we can stop any active fallback.
  useEffect(() => {
    if (participantSocket.isConnected && !socketReady) {
      setSocketReady(true);
      stopFallback(); // Immediately stop any in-progress fallback poll
    } else if (!participantSocket.isConnected && socketReady) {
      setSocketReady(false); // Socket lost — allow fallback to restart below
    }
  }, [participantSocket.isConnected, socketReady]);

  // ── Bootstrap + fallback poll ─────────────────────────────────────────────
  useEffect(() => {
    if (!code) return;

    const participantSession = sessionStorage.getItem(participantStorageKey(code));
    if (!participantSession) {
      navigate(`/join/${code}`, { replace: true });
      return;
    }

    const participantToken = parseParticipantRecord(participantSession)?.token ?? "";

    let isMounted = true;

    const loadSession = async () => {
      // Skip if socket is already delivering live updates
      if (participantSocket.isConnected) return;

      try {
        const session = await getPublicSession(code, participantToken);
        if (!isMounted) return;

        setSession(session);
        const resumeRoute = getResumeRoute(code, session.status);
        if (resumeRoute !== `/join/${code}/waiting`) {
          navigate(resumeRoute, { replace: true });
        }
      } catch {
        // Keep the waiting page mounted on transient network errors.
      }
    };

    // Initial load only when socket is not yet connected
    if (!participantSocket.isConnected) {
      void loadSession();
    }

    // Start the 60-second fallback ONLY when the socket is disconnected.
    // The interval is cleared as soon as the socket connects (see gate above).
    if (!participantSocket.isConnected && fallbackTimerRef.current === null) {
      fallbackTimerRef.current = window.setInterval(() => {
        // Double-check inside the interval — socket may have connected since
        // this interval was scheduled.
        if (!participantSocket.isConnected) {
          void loadSession();
        }
      }, 60_000);
    }

    return () => {
      isMounted = false;
      stopFallback();
    };
    // Re-run when connection status changes so we can (re)start the fallback
    // only when truly disconnected.
  }, [code, navigate, setSession, participantSocket.isConnected]);

  if (!currentSession) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-8 text-center">
        <div className="space-y-3">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-orange-500" />
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-gray-400">
            Restoring your session...
          </p>
        </div>
      </div>
    );
  }

  if (currentSession?.status === "ended") {
    return (
      <StudentSessionEnded
        code={code}
        title={currentSession.title}
        participantName={participant?.name}
        phoneNumber={participant?.phoneNumber}
        participantSummary={currentSession.participantSummary}
        leaderboard={currentSession.leaderboard}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-8 flex flex-col items-center justify-between min-h-0 text-center">
      {participantSocket.isReconnecting ? (
        <div className="mb-4 flex w-full max-w-sm items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-left text-green-700 shadow-sm shrink-0">
          <WifiOff size={18} className="shrink-0" />
          <div>
            <p className="text-sm font-black">Reconnecting...</p>
            <p className="text-xs font-semibold">Your place is reserved while the connection recovers.</p>
          </div>
        </div>
      ) : null}
      
      <div className="flex-1 flex flex-col items-center justify-center w-full py-4 sm:py-6">
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 3, -3, 0]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-24 h-24 sm:w-28 sm:h-28 bg-orange-50 rounded-full flex items-center justify-center mb-6 sm:mb-8 relative shrink-0"
        >
          <Loader2 className="w-12 h-12 sm:w-14 sm:h-14 text-orange-500 animate-spin-slow" />
          <div className="absolute top-0 right-0 w-7 h-7 sm:w-8 sm:h-8 bg-green-600 rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg">
            <CheckCircle2 size={14} />
          </div>
        </motion.div>

        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">You're In!</h1>
          <p className="text-sm sm:text-base text-gray-500 font-medium">Session: <span className="font-bold text-orange-500">{code}</span></p>
        </div>

        <div className="mt-6 sm:mt-8 w-full max-w-[260px] sm:max-w-[280px] space-y-4 sm:space-y-6">
          <div className="p-4 sm:p-6 bg-gray-50 rounded-[2rem] sm:rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center">
            <p className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mb-1.5 sm:mb-2">Waiting for Host</p>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-600 rounded-full animate-pulse"></span>
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-600 rounded-full animate-pulse [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-600 rounded-full animate-pulse [animation-delay:0.4s]"></span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-4 text-gray-400">
            <Users size={18} />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
              {currentSession?.participantSummary?.participantCount ?? currentSession?.participants ?? 0} players waiting
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 sm:pt-8 shrink-0">
        <div className="flex -space-x-2.5 sm:-space-x-3">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-3 sm:border-4 border-white bg-gradient-to-br from-orange-500 to-rose-400 flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white shadow-md"
            >
              {String.fromCharCode(65 + i)}
            </motion.div>
          ))}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-3 sm:border-4 border-white bg-gray-100 flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-gray-500 shadow-md">
            +26
          </div>
        </div>
      </div>
    </div>
  );
}
