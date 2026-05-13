import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import { Play, Pause, Users, SkipForward, BarChart2, Award, ArrowRight, LayoutDashboard, QrCode as QrIcon, Eye, Clock3, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { useSession } from "../../context/SessionContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toast } from "sonner";
import { getAdminSession, updateAdminSessionState } from "../../api/liveSessionApi";

const MOCK_STATS = [
  { name: "A", count: 12, color: "#3b82f6" },
  { name: "B", count: 28, color: "#10b981" },
  { name: "C", count: 8, color: "#f59e0b" },
  { name: "D", count: 4, color: "#ef4444" },
];

export function AdminControl() {
  const { id } = useParams();
  const { currentSession, setSession } = useSession();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  const normalizedSessionId = id && /^\d+$/.test(id) ? id : null;

  useEffect(() => {
    if (!normalizedSessionId) {
      setLoadError("No active live session was selected.");
      return;
    }

    let isMounted = true;

    const loadSession = async () => {
      try {
        const session = await getAdminSession(normalizedSessionId);
        if (isMounted) {
          setLoadError("");
          setSession(session);
        }
      } catch (err) {
        if (isMounted) {
          setLoadError(err instanceof Error ? err.message : "Failed to load session");
        }
      }
    };

    void loadSession();
    const intervalId = window.setInterval(() => {
      void loadSession();
    }, 3000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [normalizedSessionId, setSession]);

  const currentQuestion = currentSession
    ? currentSession.currentQuestion ?? currentSession.questions[currentSession.currentQuestionIndex]
    : null;
  const isQuestionActive = currentSession?.status === "active";
  const isSessionEnded = currentSession?.status === "ended";
  const shouldOfferLeaderboard =
    !!currentQuestion &&
    currentSession?.status !== "leaderboard" &&
    currentQuestion.showLeaderboardAfter;

  const formatLastActivity = (value: string | null) => {
    if (!value) {
      return "No recent activity";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "Recently active";
    }

    const diffSeconds = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 1000));
    if (diffSeconds < 10) {
      return "Just now";
    }
    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    }

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  };

  useEffect(() => {
    if (!isQuestionActive || !currentQuestion || !currentSession?.questionStartedAt) {
      return;
    }

    const syncTimer = () => {
      const startedAtMs = new Date(currentSession.questionStartedAt as string).getTime();
      const elapsedSeconds = Math.floor((Date.now() - startedAtMs) / 1000);
      setTimeLeft(Math.max(0, currentQuestion.timer - elapsedSeconds));
    };

    syncTimer();
    const timer = window.setInterval(syncTimer, 1000);
    return () => window.clearInterval(timer);
  }, [currentQuestion, currentSession?.questionStartedAt, isQuestionActive]);

  if (!normalizedSessionId) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">No Live Session Selected</h2>
        <p className="mt-2 text-gray-500">Create a session or open one from the success screen to manage it here.</p>
        <Link
          to="/admin/create-session"
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
        >
          Create Session
        </Link>
      </div>
    );
  }

  if (!currentSession) return <div>No active session</div>;

  const liveFeed = currentSession.liveFeed ?? [];
  const liveMetrics = currentSession.liveMetrics ?? {
    totalParticipants: currentSession.participants,
    answeredParticipants: 0,
    waitingParticipants: currentSession.participants,
  };

  if (loadError) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">Unable to Load Session</h2>
        <p className="mt-2 text-gray-500">{loadError}</p>
        <Link
          to="/admin/dashboard"
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const sendAction = async (
    action: "launch_next" | "reveal_results" | "show_leaderboard" | "end",
    successMessage: string
  ) => {
    if (!normalizedSessionId) {
      return;
    }

    setIsBusy(true);
    try {
      const session = await updateAdminSessionState(normalizedSessionId, action);
      setSession(session);
      toast.success(successMessage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update session");
    } finally {
      setIsBusy(false);
    }
  };

  const launchQuestion = () => {
    const nextQuestionNumber = currentSession.currentQuestionIndex + 2;
    const isFinishing = currentSession.currentQuestionIndex + 1 >= currentSession.questions.length;
    void sendAction("launch_next", isFinishing ? "Session completed!" : `Question ${nextQuestionNumber} launched!`);
  };

  const revealResults = () => {
    void sendAction("reveal_results", "Results revealed to players");
  };

  const showLeaderboardView = () => {
    void sendAction("show_leaderboard", "Leaderboard displayed on big screen");
  };

  const endSession = () => {
    if (isSessionEnded) {
      return;
    }
    void sendAction("end", "Session ended");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Session</span>
            <h2 className="text-xl font-bold text-gray-900">{currentSession.title}</h2>
          </div>
          <div className="h-10 w-px bg-gray-100"></div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold">
              <Users size={18} />
              <span>{currentSession.participants}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg font-bold">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="capitalize">{currentSession.status}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={endSession}
            disabled={isBusy || isSessionEnded}
            className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold transition-colors text-gray-600 disabled:opacity-60"
          >
            End Session
          </button>
          <button 
            onClick={showLeaderboardView}
            disabled={isBusy}
            className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-semibold shadow-md shadow-amber-100 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60"
          >
            <Award size={18} />
            Show Leaderboard
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[450px] flex flex-col relative overflow-hidden">
            {currentSession.status === "waiting" && currentSession.currentQuestionIndex === -1 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center"
                >
                  <Play size={48} fill="currentColor" className="ml-1" />
                </motion.div>
                <div className="max-w-md">
                  <h3 className="text-3xl font-bold text-gray-900">Get the party started!</h3>
                  <p className="text-gray-500 mt-3 text-lg">
                    {currentSession.participants} participants are waiting in the lobby. Launch the first question when you're ready.
                  </p>
                </div>
                <button 
                  onClick={launchQuestion}
                  disabled={isBusy}
                  className="px-10 py-4 bg-indigo-600 text-white font-black text-lg rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-3 active:scale-95 disabled:opacity-60"
                >
                  Launch Question 1
                  <ArrowRight size={24} />
                </button>
              </div>
            ) : currentSession.status === "ended" ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center">
                  <Award size={48} />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900">Session Completed</h3>
                  <p className="text-gray-500 mt-2 text-lg">You've successfully finished this quiz session.</p>
                </div>
                <button 
                  onClick={() => window.location.href = "/admin/reports"}
                  className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all flex items-center gap-2"
                >
                  View Final Reports
                  <BarChart2 size={20} />
                </button>
              </div>
            ) : currentQuestion ? (
              <div className="flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black uppercase tracking-wider">
                        Question {currentSession.currentQuestionIndex + 1} of {currentSession.questions.length}
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                        isQuestionActive ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                      }`}>
                        {isQuestionActive ? "Accepting Answers" : "Results Revealed"}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                      {currentQuestion.text}
                    </h3>
                  </div>
                  <div className="ml-8">
                    <motion.div 
                      key={timeLeft}
                      initial={{ scale: 1.1, color: "#ef4444" }}
                      animate={{ scale: 1, color: timeLeft < 5 ? "#ef4444" : "#4f46e5" }}
                      className={`w-24 h-24 rounded-3xl flex flex-col items-center justify-center border-4 ${
                        timeLeft < 5 ? "border-red-500 text-red-500 animate-pulse" : "border-indigo-600 text-indigo-600"
                      } bg-white shadow-xl shadow-gray-100`}
                    >
                      <span className="text-4xl font-black">{timeLeft}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Sec</span>
                    </motion.div>
                  </div>
                </div>

                {isQuestionActive ? (
                  <div className="flex-1 flex flex-col">
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      {currentQuestion.options.map((opt, i) => (
                        <div key={i} className="p-5 rounded-2xl border-2 border-gray-50 bg-gray-50/50 flex items-center gap-4 transition-all hover:border-indigo-100">
                          <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center font-black text-gray-400 shadow-sm">
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span className="font-bold text-gray-700">{opt}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-auto flex justify-center gap-4">
                      <button 
                        onClick={revealResults}
                        disabled={isBusy}
                        className="px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all flex items-center gap-3 shadow-xl shadow-gray-200 disabled:opacity-60"
                      >
                        <Pause size={20} fill="currentColor" />
                        Stop Timer & Reveal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <div className="h-64 mb-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={MOCK_STATS}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip 
                            cursor={{ fill: "transparent" }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100">
                                    <p className="font-black text-gray-900">{payload[0].value} Players</p>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Option {payload[0].payload.name}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="count" radius={[12, 12, 0, 0]}>
                            {MOCK_STATS.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={index === currentQuestion.correctAnswer ? "#10b981" : entry.color} 
                                fillOpacity={index === currentQuestion.correctAnswer ? 1 : 0.4} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="mt-auto flex justify-center gap-4">
                      <button 
                        onClick={shouldOfferLeaderboard ? showLeaderboardView : launchQuestion}
                        disabled={isBusy}
                        className="px-10 py-4 bg-indigo-600 text-white font-black text-lg rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-60"
                      >
                        {currentSession.currentQuestionIndex + 1 === currentSession.questions.length
                          ? "Finish Quiz"
                          : shouldOfferLeaderboard
                            ? "Show Leaderboard"
                            : "Next Question"}
                        <SkipForward size={24} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-black text-gray-900 mb-4 flex items-center justify-between">
              Live Feed
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black uppercase tracking-widest">
                {isQuestionActive ? "Voting Open" : "Standby"}
              </span>
            </h3>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-indigo-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Joined</p>
                <p className="mt-1 text-xl font-black text-indigo-700">{liveMetrics.totalParticipants}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Answered</p>
                <p className="mt-1 text-xl font-black text-emerald-700">{liveMetrics.answeredParticipants}</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Waiting</p>
                <p className="mt-1 text-xl font-black text-amber-700">{liveMetrics.waitingParticipants}</p>
              </div>
            </div>
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
              {liveFeed.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                  <Users size={24} className="mx-auto text-gray-300" />
                  <p className="mt-3 text-sm font-bold text-gray-900">No participant activity yet</p>
                  <p className="mt-1 text-xs font-medium text-gray-500">
                    Joined students and answer submissions will appear here in real time.
                  </p>
                </div>
              ) : liveFeed.map((entry, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  key={entry.id} 
                  className="flex items-center gap-3 rounded-2xl border border-transparent bg-gray-50 p-3 transition-all hover:border-indigo-100 hover:bg-white"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-sm">
                    {entry.name
                      .split(" ")
                      .map((part) => part[0] ?? "")
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-black text-gray-900">{entry.name}</p>
                      {entry.selectedOptionIndex !== null ? (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                          {String.fromCharCode(65 + entry.selectedOptionIndex)}
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-[10px] font-bold uppercase tracking-tight text-gray-500">
                      {entry.activityLabel}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-[10px] font-semibold text-gray-400">
                      <span>{entry.registerNumber ?? "No reg no."}</span>
                      <span>{formatLastActivity(entry.lastActivityAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-black text-gray-700">{entry.score} pts</span>
                    <div className="flex items-center gap-1">
                      {entry.presence === "active" ? (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      ) : entry.presence === "waiting" ? (
                        <Eye size={14} className="text-amber-500" />
                      ) : (
                        <Clock3 size={14} className="text-gray-300" />
                      )}
                      <span className={`h-2 w-2 rounded-full ${
                        entry.presence === "active"
                          ? "bg-emerald-500"
                          : entry.presence === "waiting"
                            ? "bg-amber-400"
                            : "bg-gray-300"
                      }`}></span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
            <h3 className="font-black mb-4 relative z-10 flex items-center gap-2">
              <LayoutDashboard size={20} />
              Display Controls
            </h3>
            <div className="space-y-3 relative z-10">
              <button 
                onClick={() => window.open(`/big-screen/${currentSession.code}`, '_blank')}
                className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-sm font-black active:scale-[0.98]"
              >
                Open Projector View
                <ArrowRight size={18} />
              </button>
              <button 
                onClick={showLeaderboardView}
                className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-sm font-black active:scale-[0.98]"
              >
                Reveal Leaderboard
                <Award size={18} />
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-sm font-black active:scale-[0.98]">
                Show QR Code
                <QrIcon size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
