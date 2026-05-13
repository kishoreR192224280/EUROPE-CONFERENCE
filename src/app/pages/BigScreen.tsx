import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { Users, Trophy, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import { useSession } from "../context/SessionContext";
import { getPublicSession } from "../api/liveSessionApi";

export function BigScreen() {
  const { code } = useParams();
  const { currentSession, setSession } = useSession();
  const [view, setView] = useState<"lobby" | "question" | "results" | "leaderboard" | "ended">("lobby");
  const [timeLeft, setTimeLeft] = useState(30);
  const leaderboard = currentSession?.leaderboard ?? [];

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase();

  useEffect(() => {
    if (!code) {
      return;
    }

    let isMounted = true;

    const loadSession = async () => {
      try {
        const session = await getPublicSession(code);
        if (isMounted) {
          setSession(session);
        }
      } catch {
        // Keep last good frame visible.
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
    if (view !== "question" || !currentSession?.currentQuestion || !currentSession.questionStartedAt) {
      return;
    }

    const syncTimer = () => {
      const startedAtMs = new Date(currentSession.questionStartedAt as string).getTime();
      const elapsedSeconds = Math.floor((Date.now() - startedAtMs) / 1000);
      setTimeLeft(Math.max(0, currentSession.currentQuestion!.timer - elapsedSeconds));
    };

    syncTimer();
    const timer = window.setInterval(syncTimer, 1000);
    return () => window.clearInterval(timer);
  }, [view, currentSession?.questionStartedAt, currentSession?.currentQuestion]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-hidden flex flex-col p-12 relative">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/10 blur-[100px] rounded-full animate-bounce duration-[10s]"></div>
      </div>

      <header className="relative z-10 flex items-center justify-between mb-16">
        <div className="flex items-center gap-6">
          <motion.div 
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-2xl shadow-indigo-500/20"
          >
            Q
          </motion.div>
          <div>
            <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              {currentSession?.title || "Live Quiz Session"}
            </h1>
            <p className="text-indigo-400 font-black uppercase tracking-[0.2em] text-sm mt-1">Join on localhost with code</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <motion.div 
            layout
            className="bg-white/5 backdrop-blur-2xl px-12 py-6 rounded-[2.5rem] border border-white/10 flex flex-col items-center shadow-2xl"
          >
            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Session Code</span>
            <span className="text-7xl font-black text-white tracking-tighter">{code}</span>
          </motion.div>
          <div className="flex items-center gap-6 bg-white/5 backdrop-blur-2xl px-10 py-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/20">
              <Users size={36} />
            </div>
            <div>
              <p className="text-5xl font-black text-white leading-none">{currentSession?.participants ?? 0}</p>
              <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mt-1">Connected</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {view === "lobby" && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-16"
            >
              <div className="relative group">
                <div className="absolute -inset-8 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-[4rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-white p-12 sm:p-16 rounded-[3rem] shadow-[0_0_100px_rgba(79,70,229,0.3)]">
                  <QRCodeSVG value={`${window.location.origin}/join/${code}`} size={350} />
                </div>
              </div>
              <div className="space-y-6">
                <h2 className="text-7xl font-black tracking-tight animate-pulse bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                  Waiting for players...
                </h2>
                <p className="text-3xl text-indigo-300/60 font-medium">Scan the QR code or enter the code manually to join!</p>
              </div>
            </motion.div>
          )}

          {view === "question" && currentSession?.currentQuestion && (
            <motion.div
              key="question"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-16"
            >
              <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-16 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-600 rounded-[2.5rem] flex flex-col items-center justify-center text-5xl font-black shadow-[0_0_50px_rgba(79,70,229,0.5)] border-8 border-[#0f172a] group-hover:scale-110 transition-transform">
                  <span className={timeLeft < 6 ? "text-red-400 animate-pulse" : "text-white"}>{timeLeft}</span>
                  <span className="text-[10px] uppercase tracking-widest leading-none mt-1">Sec</span>
                </div>
                <h2 className="text-6xl font-black text-center pt-10 leading-tight tracking-tight">
                  {currentSession.currentQuestion.text}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-10">
                {currentSession.currentQuestion.options.map((opt, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                    className="flex items-center gap-10 p-10 rounded-[3rem] border-2 border-white/5 bg-white/5 backdrop-blur-xl relative overflow-hidden"
                  >
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black shadow-xl ${
                      i === 0 ? "bg-amber-500" : i === 1 ? "bg-blue-500" : i === 2 ? "bg-emerald-500" : "bg-purple-500"
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span className="text-4xl font-bold tracking-tight text-gray-100">{opt}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {view === "results" && currentSession?.currentQuestion && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full space-y-16"
            >
              <div className="text-center space-y-4">
                <h2 className="text-6xl font-black tracking-tight">Results reveal!</h2>
                <p className="text-2xl text-indigo-400 font-bold uppercase tracking-widest">How did everyone do?</p>
              </div>

              <div className="grid grid-cols-2 gap-10">
                {currentSession.currentQuestion.options.map((opt, i) => {
                  const isCorrect = i === currentSession.currentQuestion?.correctAnswer;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: 1,
                        scale: isCorrect ? 1.05 : 0.95,
                        borderColor: isCorrect ? "rgba(16, 185, 129, 0.5)" : "rgba(255, 255, 255, 0.05)"
                      }}
                      className={`flex items-center justify-between p-10 rounded-[3rem] border-4 transition-all ${
                        isCorrect 
                          ? "bg-emerald-500/20 shadow-[0_0_80px_rgba(16,185,129,0.2)]" 
                          : "bg-white/5 opacity-50"
                      }`}
                    >
                      <div className="flex items-center gap-10">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black ${
                          isCorrect ? "bg-emerald-500 text-white" : "bg-gray-700 text-gray-400"
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="text-4xl font-bold tracking-tight">{opt}</span>
                      </div>
                      {isCorrect && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                        >
                          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {view === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-5xl space-y-12"
            >
              <div className="text-center space-y-6 mb-16">
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <Trophy className="w-24 h-24 text-amber-400 mx-auto drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]" />
                </motion.div>
                <h2 className="text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
                  Current Standings
                </h2>
              </div>
              
              <div className="space-y-6">
                {leaderboard.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-[2.5rem] border border-dashed border-white/10 bg-white/5 px-10 py-16 text-center"
                  >
                    <Trophy className="mx-auto h-16 w-16 text-amber-400/70" />
                    <h3 className="mt-6 text-3xl font-black tracking-tight">Leaderboard is warming up</h3>
                    <p className="mt-3 text-xl text-slate-400">
                      Standings will appear here as soon as player scores are available.
                    </p>
                  </motion.div>
                ) : (
                  leaderboard.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className={`relative flex items-center justify-between rounded-[2.5rem] border-2 p-8 transition-all ${
                        i === 0 ? "scale-105 border-amber-500/50 bg-gradient-to-r from-amber-500/20 to-transparent shadow-2xl" :
                        i === 1 ? "scale-[1.02] border-slate-400/30 bg-gradient-to-r from-slate-400/20 to-transparent" :
                        i === 2 ? "scale-[1.01] border-amber-700/30 bg-gradient-to-r from-amber-700/20 to-transparent" :
                        "border-white/5 bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-10">
                        <span className={`flex h-16 w-16 items-center justify-center rounded-[1.5rem] text-3xl font-black shadow-lg ${
                          i === 0 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-[#0f172a]" : 
                          i === 1 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-[#0f172a]" :
                          i === 2 ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white" : "bg-white/10 text-white"
                        }`}>
                          {item.rank}
                        </span>
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#0f172a] bg-indigo-500 text-2xl font-black shadow-xl">
                          {getInitials(item.name)}
                        </div>
                        <div className="space-y-1">
                          <span className="block text-4xl font-black tracking-tight">{item.name}</span>
                          <span className="block text-sm font-black uppercase tracking-[0.24em] text-slate-500">
                            {item.registerNumber ?? "Participant"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-5xl font-black tracking-tighter text-indigo-400">{item.score}</span>
                        <span className="text-sm font-black uppercase tracking-widest text-gray-500">PTS</span>
                      </div>
                    </motion.div>
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
              className="text-center space-y-12"
            >
              <div className="w-48 h-48 bg-emerald-500/20 rounded-[3rem] border-4 border-emerald-500 flex items-center justify-center mx-auto shadow-[0_0_100px_rgba(16,185,129,0.3)]">
                <Award className="w-24 h-24 text-emerald-500" />
              </div>
              <div className="space-y-6">
                <h2 className="text-8xl font-black tracking-tighter">Congratulations!</h2>
                <p className="text-3xl text-gray-400 max-w-2xl mx-auto">The session has ended. Thank you everyone for participating in this interactive experience!</p>
              </div>
              <div className="pt-12">
                <div className="inline-block px-12 py-6 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 text-xl font-black text-indigo-400 uppercase tracking-[0.3em]">
                  Final Results coming soon
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 flex items-center justify-between pt-16 border-t border-white/5 mt-auto">
        <div className="flex gap-6">
          <div className="px-8 py-4 bg-white/5 rounded-2xl border border-white/10 text-xs font-black uppercase tracking-[0.2em] text-gray-400">
            {currentSession?.questionCount || currentSession?.questions.length || 0} ROUNDS TOTAL
          </div>
          <div className="px-8 py-4 bg-indigo-600/10 rounded-2xl border border-indigo-600/20 text-xs font-black uppercase tracking-[0.2em] text-indigo-400">
            FASTEST ANSWER WINS
          </div>
        </div>
        <div className="text-gray-600 font-black uppercase tracking-[0.4em] text-[10px]">
          POWERED BY QUIZPRO INTERACTIVE ENGINE
        </div>
      </footer>
    </div>
  );
}
