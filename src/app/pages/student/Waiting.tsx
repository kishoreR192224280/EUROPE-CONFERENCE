import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Loader2, Users, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { useSession } from "../../context/SessionContext";
import { getPublicSession, participantStorageKey } from "../../api/liveSessionApi";
import { StudentSessionEnded } from "./StudentSessionEnded";

export function StudentWaiting() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { currentSession, setSession } = useSession();
  const participantJson = code ? sessionStorage.getItem(participantStorageKey(code)) : null;
  const participant = participantJson
    ? (JSON.parse(participantJson) as { name?: string; registerNumber?: string | null })
    : null;

  useEffect(() => {
    if (!code) {
      return;
    }

    const participant = sessionStorage.getItem(participantStorageKey(code));
    if (!participant) {
      navigate(`/join/${code}`, { replace: true });
      return;
    }

    const participantToken = (() => {
      try {
        return (JSON.parse(participant) as { token?: string }).token ?? "";
      } catch {
        return "";
      }
    })();

    let isMounted = true;

    const loadSession = async () => {
      try {
        const session = await getPublicSession(code, participantToken);
        if (!isMounted) {
          return;
        }

        setSession(session);
        if (session.status === "active") {
          navigate(`/join/${code}/question`);
        }
      } catch {
        // Keep the waiting page mounted on transient network errors.
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
  }, [code, navigate, setSession]);

  if (currentSession?.status === "ended") {
    return (
      <StudentSessionEnded
        code={code}
        title={currentSession.title}
        participantName={participant?.name}
        registerNumber={participant?.registerNumber}
        participantSummary={currentSession.participantSummary}
        leaderboard={currentSession.leaderboard}
      />
    );
  }

  return (
    <div className="flex flex-col items-center p-8 pb-12 text-center min-h-[400px] justify-center">
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center mb-8 relative"
      >
        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin-slow" />
        <div className="absolute top-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg">
          <CheckCircle2 size={16} />
        </div>
      </motion.div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black text-gray-900 leading-tight">You're In!</h1>
        <p className="text-gray-500 font-medium">Session: <span className="font-bold text-indigo-600">{code}</span></p>
      </div>

      <div className="mt-12 w-full max-w-[280px] space-y-6">
        <div className="p-6 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Waiting for Host</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse [animation-delay:0.2s]"></span>
            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse [animation-delay:0.4s]"></span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 text-gray-400">
          <Users size={20} />
          <span className="text-sm font-bold uppercase tracking-wider">
            {currentSession?.participantSummary?.participantCount ?? currentSession?.participants ?? 0} players waiting
          </span>
        </div>
      </div>

      <div className="mt-auto pt-12">
        <div className="flex -space-x-3">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="w-10 h-10 rounded-full border-4 border-white bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white shadow-md"
            >
              {String.fromCharCode(65 + i)}
            </motion.div>
          ))}
          <div className="w-10 h-10 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shadow-md">
            +26
          </div>
        </div>
      </div>
    </div>
  );
}
