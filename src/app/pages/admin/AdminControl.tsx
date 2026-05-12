import { useState, useEffect } from "react";
import { Play, Pause, Square, Users, SkipForward, BarChart2, Award, ArrowRight, LayoutDashboard, QrCode as QrIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSession } from "../../context/SessionContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toast } from "sonner";

const MOCK_STATS = [
  { name: "A", count: 12, color: "#3b82f6" },
  { name: "B", count: 28, color: "#10b981" },
  { name: "C", count: 8, color: "#f59e0b" },
  { name: "D", count: 4, color: "#ef4444" },
];

export function AdminControl() {
  const { currentSession, updateSession } = useSession();
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResults, setShowResults] = useState(false);

  if (!currentSession) return <div>No active session</div>;

  const currentQuestion = currentSession.questions[currentSession.currentQuestionIndex];
  const shouldOfferLeaderboard = currentSession.status !== "leaderboard" && currentQuestion.showLeaderboardAfter;

  const launchQuestion = () => {
    const nextIndex = currentSession.currentQuestionIndex + 1;
    if (nextIndex < currentSession.questions.length) {
      updateSession({ currentQuestionIndex: nextIndex, status: "active" });
      setIsQuestionActive(true);
      setShowResults(false);
      setTimeLeft(currentSession.questions[nextIndex].timer);
      toast.success(`Question ${nextIndex + 1} launched!`);
    } else {
      updateSession({ status: "ended" });
      toast.info("Session completed!");
    }
  };

  const revealResults = () => {
    setIsQuestionActive(false);
    setShowResults(true);
    updateSession({ status: "results" });
    toast.info("Results revealed to players");
  };

  const showLeaderboardView = () => {
    updateSession({ status: "leaderboard" });
    toast.info("Leaderboard displayed on big screen");
  };

  const endSession = () => {
    updateSession({ status: "ended" });
    toast.error("Session ended");
  };

  useEffect(() => {
    let timer: any;
    if (isQuestionActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isQuestionActive) {
      revealResults();
    }
    return () => clearInterval(timer);
  }, [isQuestionActive, timeLeft]);

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
              <span>{currentSession.participants + 42}</span>
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
            className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold transition-colors text-gray-600"
          >
            End Session
          </button>
          <button 
            onClick={showLeaderboardView}
            className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-semibold shadow-md shadow-amber-100 flex items-center gap-2 transition-all active:scale-95"
          >
            <Award size={18} />
            Show Leaderboard
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Control Area */}
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
                    {currentSession.participants + 42} participants are waiting in the lobby. Launch the first question when you're ready.
                  </p>
                </div>
                <button 
                  onClick={launchQuestion}
                  className="px-10 py-4 bg-indigo-600 text-white font-black text-lg rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-3 active:scale-95"
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
            ) : (
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
                        className="px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all flex items-center gap-3 shadow-xl shadow-gray-200"
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
                        className="px-10 py-4 bg-indigo-600 text-white font-black text-lg rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-xl shadow-indigo-100 active:scale-95"
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
            )}
          </div>
        </div>

        {/* Sidebar / Live Feed */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-black text-gray-900 mb-4 flex items-center justify-between">
              Live Feed
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black uppercase tracking-widest">
                {isQuestionActive ? "Voting Open" : "Standby"}
              </span>
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {[...Array(6)].map((_, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-transparent hover:border-indigo-100 transition-all"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold">
                    {String.fromCharCode(65 + i)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-gray-900 truncate">Student_{1234 + i}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                      {isQuestionActive ? "Just submitted answer A" : "Waiting for next round"}
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${isQuestionActive ? "bg-emerald-500 animate-pulse" : "bg-gray-300"}`}></div>
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
