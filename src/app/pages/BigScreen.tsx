import { useState, useEffect, useRef, memo } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowRight, MonitorPlay, Search, Users, Trophy, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import { useSession } from "../context/SessionContext";
import { getPublicSession } from "../api/liveSessionApi";
import { toast } from "sonner";
import { io, type Socket } from "socket.io-client";

import { config } from "../../config/env";

function getSocketServerUrl() {
  return config.socketUrl;
}

function getPrimaryLabelAnswer(label: { acceptedAnswers?: string[]; prompt: string; marker: number }) {
  return label.acceptedAnswers?.find((answer) => answer.trim())?.trim() || label.prompt || `Item ${label.marker}`;
}

function shuffleMatchingPairs<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

const LeaderboardRow = memo(({ item, index }: { item: any; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative flex items-center justify-between rounded-[1.75rem] border-2 p-4 lg:p-5 transition-all ${index === 0 ? "scale-[1.02] border-amber-500/50 bg-gradient-to-r from-amber-500/20 to-transparent shadow-2xl" :
          index === 1 ? "scale-[1.01] border-slate-400/30 bg-gradient-to-r from-slate-400/20 to-transparent" :
            index === 2 ? "scale-[1.005] border-amber-700/30 bg-gradient-to-r from-amber-700/20 to-transparent" :
              "border-white/5 bg-white/5"
        }`}
    >
      <div className="flex items-center gap-4 sm:gap-8 min-w-0">
        <span className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl text-lg sm:text-xl font-black shadow-lg shrink-0 ${index === 0 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-[#0f172a]" :
            index === 1 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-[#0f172a]" :
              index === 2 ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white" : "bg-white/10 text-white"
          }`}>
          {item.rank}
        </span>
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#0f172a] bg-indigo-500 text-sm sm:text-base font-black shadow-xl">
          {getInitials(item.name)}
        </div>
        <div className="space-y-0.5 min-w-0">
          <span className="block text-xl sm:text-2xl font-black tracking-tight text-white truncate">{item.name}</span>
          <span className="block text-[10px] sm:text-xs font-black uppercase tracking-[0.24em] text-slate-500 truncate">
            {item.phoneNumber ?? "Participant"}
          </span>
        </div>
      </div>
      <div className="flex items-baseline gap-2 shrink-0">
        <span className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter text-indigo-400">{item.score}</span>
        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500">PTS</span>
      </div>
    </motion.div>
  );
});

export function BigScreenEntry() {
  const navigate = useNavigate();
  const { setSession } = useSession();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenSession = async (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      toast.error("Please enter a session code");
      return;
    }

    setIsLoading(true);
    try {
      const session = await getPublicSession(normalizedCode, undefined, "display");
      if (session.status === "ended" || session.status === "archived") {
        toast.error("This session has already ended and cannot be opened on the big screen");
        return;
      }

      setSession(session);
      navigate(`/big-screen/${normalizedCode}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to find that session");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] px-6 py-10 text-white sm:px-10">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[45%] w-[45%] rounded-full bg-indigo-600/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] h-[45%] w-[45%] rounded-full bg-blue-600/20 blur-[120px]"></div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full overflow-hidden rounded-[3rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-3xl"
        >
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="border-b border-white/10 px-8 py-10 lg:border-b-0 lg:border-r lg:px-12 lg:py-14">
              <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-2xl shadow-indigo-500/20">
                <MonitorPlay size={36} />
              </div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-indigo-300">Projector Access</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Open Any Live Session on the Big Screen
              </h1>
              <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-slate-300 sm:text-lg">
                Enter the session code to load the projector view. Draft, waiting, active, results, and leaderboard
                sessions can be opened here. Ended sessions are blocked automatically.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Fast access", value: "Jump into the projector instantly" },
                  { label: "Live sync", value: "Uses real session status from backend" },
                  { label: "Safe guard", value: "Prevents ended sessions from opening" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-8 py-10 lg:px-12 lg:py-14">
              <div className="rounded-[2.5rem] border border-white/10 bg-[#121b39]/70 p-6 shadow-inner shadow-black/10 sm:p-8">
                <p className="text-sm font-black uppercase tracking-[0.24em] text-indigo-300">Session Lookup</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Enter Session Code</h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
                  Use the code generated when the quiz was created. Example: <span className="font-black text-white">87AA4F</span>
                </p>

                <form onSubmit={handleOpenSession} className="mt-8 space-y-5">
                  <label className="block">
                    <span className="mb-3 block text-xs font-black uppercase tracking-[0.2em] text-indigo-300">
                      Big Screen Code
                    </span>
                    <div className="flex items-center gap-3 rounded-[1.75rem] border border-white/10 bg-white/5 px-5 py-4 shadow-lg shadow-black/5 transition focus-within:border-indigo-400">
                      <Search size={18} className="shrink-0 text-indigo-300" />
                      <input
                        type="text"
                        value={code}
                        onChange={(event) => setCode(event.target.value.toUpperCase())}
                        placeholder="Enter code like ABC123"
                        className="w-full bg-transparent text-lg font-black uppercase tracking-[0.24em] text-white outline-none placeholder:text-slate-500"
                        maxLength={12}
                        autoFocus
                      />
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-3 rounded-[1.75rem] bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-4 text-base font-black text-white shadow-2xl shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? "Checking session..." : "Open Big Screen"}
                    {!isLoading ? <ArrowRight size={18} /> : null}
                  </button>
                </form>

                <div className="mt-6 rounded-[1.5rem] border border-indigo-400/15 bg-indigo-500/10 px-4 py-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300">What happens next</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                    If the code is valid and the session has not ended, we’ll open the matching projector view immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
export function BigScreen() {
  const { code } = useParams();
  const { currentSession, setSession, updateSession, updateParticipantCount } = useSession();
  const [view, setView] = useState<"lobby" | "question" | "results" | "leaderboard" | "ended">("lobby");
  const [timeLeft, setTimeLeft] = useState(30);
  // Track socket connection state locally so we can suppress the fallback poll.
  const socketConnectedRef = useRef(false);
  const fallbackTimerRef = useRef<number | null>(null);

  const [shuffledMatchingPairs, setShuffledMatchingPairs] = useState<Array<{
    id: string;
    leftText: string;
    leftImageUrl?: string;
    rightText: string;
    rightImageUrl?: string;
  }>>([]);
  const leaderboard = currentSession?.leaderboard ?? [];
  const currentQuestion = currentSession?.currentQuestion;

  const labelItems = [...(currentQuestion?.labels ?? [])].sort((a, b) => a.marker - b.marker);
  const matchingPairs =
    currentQuestion?.matchingPairs ??
    (currentSession && currentSession.currentQuestionIndex >= 0
      ? currentSession.questions[currentSession.currentQuestionIndex]?.matchingPairs ?? []
      : []);

  useEffect(() => {
    if (!currentQuestion || currentQuestion.questionType !== "matching") {
      setShuffledMatchingPairs([]);
      return;
    }

    setShuffledMatchingPairs(shuffleMatchingPairs(matchingPairs));
  }, [currentQuestion?.id]);

  // --- WebSocket: join room and listen for state-change broadcasts ---
  useEffect(() => {
    if (!code || !currentSession?.id) {
      return;
    }

    const socket: Socket = io(getSocketServerUrl(), {
      transports: ["websocket"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    const joinDisplay = () => {
      socket.emit("display:join", { sessionId: String(currentSession.id) });
    };

    const handleUpdate = (payload: any) => {
      if (payload) {
        updateSession((prev) => {
          const updates = { ...payload };
          // Derive currentQuestion from bootstrap data when question changes.
          // The socket sends lightweight payloads without full question content.
          if (
            updates.currentQuestionId != null &&
            (updates.currentQuestionId !== prev.currentQuestionId || !prev.currentQuestion) &&
            prev.questions?.length
          ) {
            const qIdx = prev.questions.findIndex(
              (q: any) => String(q.id) === String(updates.currentQuestionId)
            );
            if (qIdx >= 0) {
              updates.currentQuestionIndex = qIdx;
              updates.currentQuestion = prev.questions[qIdx];
            }
          }
          return updates;
        });
      }
    };

    const handleConnect = () => {
      socketConnectedRef.current = true;
      // Stop the fallback poll as soon as the socket is delivering events.
      if (fallbackTimerRef.current !== null) {
        window.clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      joinDisplay();
    };

    const handleDisconnect = () => {
      socketConnectedRef.current = false;
    };

    const handleLeaderboard = (payload: any) => {
      if (payload?.leaderboard) {
        updateSession({ leaderboard: payload.leaderboard });
      }
    };

    // Lightweight: a student joined the lobby — only the participant count
    // needs to update. Routing through updateParticipantCount() avoids
    // re-rendering the question panel, timer, or leaderboard tree.
    const handleParticipantJoined = (payload: any) => {
      const count = payload?.participants ?? payload?.totalParticipants;
      if (typeof count === "number") {
        updateParticipantCount(count);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("reconnect", joinDisplay);
    socket.on("session:state-changed", handleUpdate);
    // session:answer-count intentionally NOT listened here — BigScreen does not
    // display an answer-progress bar, so these payloads are pure overhead.
    socket.on("session:participant-joined", handleParticipantJoined);
    socket.on("session:leaderboard", handleLeaderboard);
    socket.on("host-paused", handleUpdate);
    joinDisplay();

    return () => {
      socketConnectedRef.current = false;
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("reconnect", joinDisplay);
      socket.off("session:state-changed", handleUpdate);
      socket.off("host-paused", handleUpdate);
      socket.off("session:participant-joined", handleParticipantJoined);
      socket.off("session:leaderboard", handleLeaderboard);
      socket.disconnect();
    };
  }, [code, currentSession?.id, updateSession, updateParticipantCount]);

  // --- HTTP fallback polling (90s, only when socket is disconnected) ---
  useEffect(() => {
    if (!code) return;

    let isMounted = true;

    const loadSession = async () => {
      // Skip if the socket is healthy — it will push any changes.
      if (socketConnectedRef.current) return;
      try {
        const session = await getPublicSession(code, undefined, "display");
        if (isMounted) {
          setSession(session);
        }
      } catch {
        // Keep last good frame visible.
      }
    };

    // Initial load on mount (socket may not have connected yet)
    void loadSession();

    // 90-second fallback — longer than students because BigScreen is display-only
    // and doesn't interact. The socket handles all real-time updates.
    fallbackTimerRef.current = window.setInterval(() => {
      void loadSession();
    }, 90_000);

    return () => {
      isMounted = false;
      if (fallbackTimerRef.current !== null) {
        window.clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [code, setSession]);

  useEffect(() => {
    if (currentSession?.status === "active") {
      setView("question");
    } else if (currentSession?.status === "results") {
      setView("results");
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } else if (currentSession?.status === "leaderboard") {
      setView("leaderboard");
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
    } else if (currentSession?.status === "ended") {
      setView("ended");
    } else if (currentSession?.status === "waiting") {
      setView("lobby");
    }
  }, [currentSession?.status]);

  useEffect(() => {
    if (view !== "question" || !currentSession?.currentQuestion) {
      return;
    }

    setTimeLeft(currentSession.timeRemainingSeconds ?? currentSession.currentQuestion.timer);
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [view, currentSession?.currentQuestion, currentSession?.timeRemainingSeconds]);

  return (
    <div className="h-screen max-h-screen bg-[#0f172a] text-white overflow-hidden flex flex-col p-4 sm:p-6 lg:p-10 relative select-none">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/10 blur-[100px] rounded-full animate-bounce duration-[10s]"></div>
      </div>

      <header className="relative z-10 flex items-center justify-between gap-4 mb-6 sm:mb-8 lg:mb-10 shrink-0">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[1.25rem] sm:rounded-[1.75rem] flex items-center justify-center text-2xl sm:text-3xl font-black shadow-2xl shadow-indigo-500/20 shrink-0"
          >
            Q
          </motion.div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 truncate">
              {currentSession?.title || "Live Quiz Session"}
            </h1>
            <p className="text-indigo-400 font-black uppercase tracking-[0.2em] text-[9px] sm:text-xs mt-0.5">Join on session with code</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <motion.div
            layout
            className="bg-white/5 backdrop-blur-2xl px-5 py-2 sm:px-8 sm:py-3.5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 flex flex-col items-center shadow-2xl"
          >
            <span className="text-[9px] sm:text-xs font-black text-indigo-400 uppercase tracking-widest mb-0.5">Session Code</span>
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tighter">{code}</span>
          </motion.div>
          <div className="flex items-center gap-3 sm:gap-4 bg-white/5 backdrop-blur-2xl px-4 py-2 sm:px-6 sm:py-3.5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 shadow-2xl">
            <div className="p-2 sm:p-3 bg-indigo-600 rounded-xl shadow-xl shadow-indigo-500/20">
              <Users size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-none">{currentSession?.participants ?? 0}</p>
              <p className="text-[9px] sm:text-xs font-black text-indigo-400 uppercase tracking-widest mt-0.5">Connected</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-7xl mx-auto min-h-0 overflow-y-auto pr-1">
        <AnimatePresence mode="wait">
          {view === "lobby" && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-8 sm:space-y-12"
            >
              <div className="relative group inline-block">
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-white p-6 sm:p-8 rounded-[2rem] shadow-[0_0_100px_rgba(79,70,229,0.3)]">
                  <QRCodeSVG value={`${window.location.origin}/join/${code}`} size={260} />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight animate-pulse bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                  Waiting for players...
                </h2>
                <p className="text-lg sm:text-xl lg:text-2xl text-indigo-300/60 font-medium">Scan the QR code or enter the code manually to join!</p>
              </div>
            </motion.div>
          )}

          {view === "question" && currentQuestion && (
            <motion.div
              key="question"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-6 sm:space-y-8"
            >
              <div className="bg-white/5 backdrop-blur-3xl border border-white/10 px-6 py-8 sm:px-12 sm:py-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
                <div className="mx-auto mb-4 flex h-16 w-16 sm:h-20 sm:w-20 flex-col items-center justify-center rounded-[1.25rem] bg-gradient-to-b from-indigo-500 to-indigo-700 text-3xl sm:text-4xl font-black shadow-[0_0_50px_rgba(79,70,229,0.35)] ring-4 ring-indigo-300/10 group-hover:scale-105 transition-transform">
                  <span className={timeLeft < 6 ? "text-red-300 animate-pulse" : "text-white"}>{timeLeft}</span>
                  <span className="mt-0.5 text-[8px] sm:text-[9px] uppercase tracking-[0.28em] leading-none text-indigo-100">Sec</span>
                </div>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-center leading-tight tracking-tight">
                  {currentQuestion.text}
                </h2>
                {currentQuestion.instructions ? (
                  <p className="mt-3 text-center text-sm sm:text-base font-semibold text-slate-300">
                    {currentQuestion.instructions}
                  </p>
                ) : null}
              </div>

              {currentQuestion.questionType === "sorting" ? (
                <div className="space-y-3 sm:space-y-4">
                  {(currentQuestion.items ?? []).map((item, i) => (
                    <motion.div
                      key={`${item}-${i}`}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      className="flex items-center gap-4 rounded-[1.5rem] border-2 border-white/5 bg-white/5 p-4 backdrop-blur-xl"
                    >
                      <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-emerald-500 text-xl sm:text-2xl font-black shadow-xl shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-gray-100 min-w-0 break-words">{item}</span>
                    </motion.div>
                  ))}
                </div>
              ) : currentQuestion.questionType === "label_image" ? (
                <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 sm:p-6 backdrop-blur-xl">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-xs sm:text-sm font-black uppercase tracking-[0.22em] text-blue-300">Image Reference</p>
                      <p className="text-xs sm:text-sm font-semibold text-slate-400">{labelItems.length} markers to label</p>
                    </div>
                    <div className="relative mx-auto aspect-[4/3] max-w-2xl max-h-[40vh] overflow-hidden rounded-[1.5rem] bg-white">
                      {currentQuestion.mediaUrl ? (
                        <img src={currentQuestion.mediaUrl} alt="Question reference" className="h-full w-full object-contain" />
                      ) : null}
                      {labelItems.map((label) => (
                        <div
                          key={label.id}
                          className="absolute flex h-8 w-8 sm:h-10 sm:w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#0f172a] bg-blue-500 text-xs sm:text-sm font-black text-white shadow-2xl"
                          style={{ left: `${label.x}%`, top: `${label.y}%` }}
                        >
                          {label.marker}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {labelItems.map((label) => (
                      <div key={label.id} className="rounded-[1.25rem] border border-white/10 bg-white/5 p-3.5 sm:p-4 backdrop-blur-xl">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white shadow-xl">
                            {label.marker}
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] text-blue-300">Item {label.marker}</p>
                            <p className="mt-0.5 text-sm sm:text-base lg:text-lg font-bold tracking-tight text-white">Add label on your phone</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : currentQuestion.questionType === "matching" ? (
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 sm:p-6 backdrop-blur-xl">
                  <div className="mb-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-6 py-3">
                      <p className="text-xs sm:text-sm font-black uppercase tracking-[0.22em] text-blue-300">Options</p>
                    </div>
                    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-6 py-3">
                      <p className="text-xs sm:text-sm font-black uppercase tracking-[0.22em] text-violet-300">Match Bank</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {matchingPairs.map((pair, index) => {
                      const matchBankItem = shuffledMatchingPairs[index] ?? pair;

                      return (
                        <div key={pair.id} className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
                          <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-3.5 sm:p-4">
                            <div className="flex h-full items-start gap-3">
                              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white shadow-xl">
                                {index + 1}
                              </div>
                              <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center space-y-2">
                                {pair.leftImageUrl ? (
                                  <div className="overflow-hidden rounded-xl bg-white/95 max-h-20 sm:max-h-28">
                                    <img src={pair.leftImageUrl} alt={pair.leftText} className="h-full w-full object-contain" />
                                  </div>
                                ) : null}
                                {pair.leftText ? (
                                  <p className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-white leading-tight">{pair.leftText}</p>
                                ) : (
                                  <p className="text-sm font-semibold text-slate-300">Image prompt</p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-3.5 sm:p-4">
                            <div className="flex h-full items-start gap-3">
                              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-black text-white shadow-xl">
                                {String.fromCharCode(65 + index)}
                              </div>
                              <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center space-y-2">
                                {matchBankItem.rightImageUrl ? (
                                  <div className="overflow-hidden rounded-xl bg-white/95 max-h-20 sm:max-h-28">
                                    <img
                                      src={matchBankItem.rightImageUrl}
                                      alt={matchBankItem.rightText}
                                      className="h-full w-full object-contain"
                                    />
                                  </div>
                                ) : null}
                                <p className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-white leading-tight">
                                  {matchBankItem.rightText || "Image option"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  {currentQuestion.options.map((opt, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="relative flex items-center gap-4 sm:gap-6 overflow-hidden rounded-[1.5rem] border-2 border-white/5 bg-white/5 p-4 sm:p-6 lg:p-8 backdrop-blur-xl"
                    >
                      <div className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl text-xl sm:text-2xl font-black shadow-xl shrink-0 ${i === 0 ? "bg-amber-500" : i === 1 ? "bg-blue-500" : i === 2 ? "bg-emerald-500" : "bg-purple-500"
                        }`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="text-base sm:text-xl lg:text-2xl font-bold tracking-tight text-gray-100 min-w-0 break-words">{opt}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === "results" && currentQuestion && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full space-y-6 sm:space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight">Results reveal!</h2>
                <p className="text-sm sm:text-lg text-indigo-400 font-bold uppercase tracking-widest">How did everyone do?</p>
              </div>

              {currentQuestion.questionType === "sorting" ? (
                <div className="space-y-3 sm:space-y-4">
                  {(currentQuestion.correctOrder ?? currentQuestion.items ?? []).map((item, i) => (
                    <motion.div
                      key={`${item}-${i}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center gap-4 rounded-[1.5rem] border-2 border-emerald-400/30 bg-emerald-500/10 p-4"
                    >
                      <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-emerald-500 text-xl sm:text-2xl font-black text-white shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-white min-w-0 break-words">{item}</span>
                    </motion.div>
                  ))}
                </div>
              ) : currentQuestion.questionType === "label_image" ? (
                <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 sm:p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-xs sm:text-sm font-black uppercase tracking-[0.22em] text-emerald-300">Answer Key</p>
                      <p className="text-xs sm:text-sm font-semibold text-slate-400">{labelItems.length} labeled markers</p>
                    </div>
                    <div className="relative mx-auto aspect-[4/3] max-w-2xl max-h-[40vh] overflow-hidden rounded-[1.5rem] bg-white">
                      {currentQuestion.mediaUrl ? (
                        <img src={currentQuestion.mediaUrl} alt="Diagram answer key" className="h-full w-full object-contain" />
                      ) : null}
                      {labelItems.map((label) => (
                        <div
                          key={label.id}
                          className="absolute flex h-8 w-8 sm:h-10 sm:w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#0f172a] bg-emerald-500 text-xs sm:text-sm font-black text-white shadow-2xl"
                          style={{ left: `${label.x}%`, top: `${label.y}%` }}
                        >
                          {label.marker}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {labelItems.map((label) => (
                      <div key={label.id} className="rounded-[1.25rem] border border-emerald-400/20 bg-emerald-500/10 p-3.5 sm:p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-white shadow-xl">
                            {label.marker}
                          </div>
                          <div className="space-y-1 min-w-0">
                            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Item {label.marker}</p>
                            <p className="text-base sm:text-xl lg:text-2xl font-black text-white break-words">{getPrimaryLabelAnswer(label)}</p>
                            {label.acceptedAnswers && label.acceptedAnswers.length > 1 ? (
                              <p className="text-xs font-semibold text-slate-300 truncate">
                                Also accepted: {label.acceptedAnswers.slice(1).join(", ")}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : currentQuestion.questionType === "matching" ? (
                <div className="space-y-3">
                  {matchingPairs.map((pair, index) => (
                    <motion.div
                      key={pair.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="rounded-[1.5rem] border border-emerald-400/20 bg-emerald-500/10 p-4"
                    >
                      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                        <div className="space-y-2 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white shadow-xl">
                              {index + 1}
                            </div>
                            <p className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight text-white truncate">{pair.leftText}</p>
                          </div>
                          {pair.leftImageUrl ? (
                            <div className="overflow-hidden rounded-xl bg-white/95 max-h-20 sm:max-h-28">
                              <img src={pair.leftImageUrl} alt={pair.leftText} className="h-full w-full object-contain" />
                            </div>
                          ) : null}
                        </div>

                        <div className="mx-auto rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#0f172a] shrink-0">
                          Correct Match
                        </div>

                        <div className="space-y-2 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-black text-white shadow-xl">
                              {String.fromCharCode(65 + index)}
                            </div>
                            <p className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight text-white truncate">{pair.rightText}</p>
                          </div>
                          {pair.rightImageUrl ? (
                            <div className="overflow-hidden rounded-xl bg-white/95 max-h-20 sm:max-h-28">
                              <img src={pair.rightImageUrl} alt={pair.rightText} className="h-full w-full object-contain" />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  {currentQuestion.options.map((opt, i) => {
                    const isCorrect = i === currentQuestion.correctAnswer;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: 1,
                          scale: isCorrect ? 1.02 : 0.98,
                          borderColor: isCorrect ? "rgba(16, 185, 129, 0.5)" : "rgba(255, 255, 255, 0.05)",
                        }}
                        className={`flex items-center justify-between rounded-[1.5rem] border-2 p-4 sm:p-6 transition-all ${isCorrect ? "bg-emerald-500/20 shadow-[0_0_80px_rgba(16,185,129,0.2)]" : "bg-white/5 opacity-50"
                          }`}
                      >
                        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                          <div className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl text-xl sm:text-2xl font-black shrink-0 ${isCorrect ? "bg-emerald-500 text-white" : "bg-gray-700 text-gray-400"
                            }`}>
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span className="text-base sm:text-xl lg:text-2xl font-bold tracking-tight min-w-0 break-words">{opt}</span>
                        </div>
                        {isCorrect ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 shadow-lg shrink-0"
                          >
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        ) : null}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {view === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-5xl space-y-6 sm:space-y-8"
            >
              <div className="text-center space-y-3 mb-6 sm:mb-8">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <Trophy className="w-14 h-14 sm:w-18 sm:h-18 text-amber-400 mx-auto drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]" />
                </motion.div>
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
                  Current Standings
                </h2>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {leaderboard.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-[2rem] border border-dashed border-white/10 bg-white/5 px-10 py-12 text-center"
                  >
                    <Trophy className="mx-auto h-12 w-12 text-amber-400/70" />
                    <h3 className="mt-4 text-2xl font-black tracking-tight">Leaderboard is warming up</h3>
                    <p className="mt-2 text-base text-slate-400">
                      Standings will appear here as soon as player scores are available.
                    </p>
                  </motion.div>
                ) : (
                  leaderboard.slice(0, 5).map((item, i) => (
                    <LeaderboardRow key={item.id} item={item} index={i} />
                  ))
                )}
              </div>
            </motion.div>
          )}

          {view === "ended" && (
            <motion.div
              key="ended"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 sm:space-y-8"
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-emerald-500/20 rounded-[2rem] sm:rounded-[2.5rem] border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-[0_0_100px_rgba(16,185,129,0.3)]">
                <Award className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-500" />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter">Congratulations!</h2>
                <p className="text-base sm:text-xl text-gray-400 max-w-xl mx-auto">The session has ended. Thank you everyone for participating in this interactive experience!</p>
              </div>
              <div className="pt-6">
                <div className="inline-block px-6 py-3 sm:px-8 sm:py-4 bg-white/5 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 text-base sm:text-lg font-black text-indigo-400 uppercase tracking-[0.3em]">
                  Final Results coming soon
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 flex items-center justify-between pt-6 border-t border-white/5 mt-auto shrink-0">
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            {currentSession?.questionCount || currentSession?.questions.length || 0} ROUNDS TOTAL
          </div>
          <div className="px-4 py-2 bg-indigo-600/10 rounded-xl border border-indigo-600/20 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
            FASTEST ANSWER WINS
          </div>
        </div>
      </footer>
    </div>
  );
}
