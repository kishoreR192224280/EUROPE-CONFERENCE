import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { AlertTriangle, ArrowRight, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { participantSocketStorageKey, participantStorageKey } from "../../api/liveSessionApi";

export function StudentSessionExpired() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason");
  const isConnectionExpired = reason === "connection";

  useEffect(() => {
    if (code) {
      sessionStorage.removeItem(participantStorageKey(code));
      sessionStorage.removeItem(participantSocketStorageKey(code));
    }
  }, [code]);

  const normalizedCode = code?.toUpperCase() ?? "";

  return (
    <div className="flex min-h-[400px] flex-1 items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-6 text-center shadow-2xl backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/10 text-amber-300">
          <AlertTriangle size={30} />
        </div>

        <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-amber-300">
          {isConnectionExpired ? "Connection expired" : "Session access revoked"}
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          {isConnectionExpired ? "Please rejoin the session" : "Logged in from another tab or device"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          {isConnectionExpired
            ? "Your connection could not be restored in time. Please rejoin to continue participating."
            : "Your account was logged in from another device. To protect the quiz session, this connection was closed."}
        </p>

        {normalizedCode ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Session Code</p>
            <p className="mt-1 text-2xl font-black tracking-[0.2em] text-white">{normalizedCode}</p>
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => navigate(code ? `/join/${code}` : "/join", { replace: true })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-4 font-black text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500"
          >
            <LogOut size={18} />
            Return to login
            <ArrowRight size={18} />
          </button>
          <p className="text-xs font-medium text-slate-400">
            {code ? "Rejoin with your details if the host allows it." : "Please sign in again to continue."}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
