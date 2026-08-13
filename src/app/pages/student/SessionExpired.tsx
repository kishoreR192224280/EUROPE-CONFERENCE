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
    <div className="flex-1 overflow-y-auto p-5 sm:p-8 flex flex-col justify-between min-h-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 text-white text-center">
      <div className="flex-1 flex flex-col justify-center py-4 sm:py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full flex flex-col items-center"
        >
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 shrink-0">
            <AlertTriangle size={28} />
          </div>

          <p className="mt-4 sm:mt-5 text-[10px] sm:text-xs font-black uppercase tracking-[0.24em] text-green-300">
            {isConnectionExpired ? "Connection expired" : "Session access revoked"}
          </p>
          <h1 className="mt-2.5 sm:mt-3 text-xl sm:text-2xl font-black tracking-tight leading-tight max-w-xs sm:max-w-none">
            {isConnectionExpired ? "Please rejoin the session" : "Logged in from another device"}
          </h1>
          <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-300 max-w-sm">
            {isConnectionExpired
              ? "Your connection could not be restored in time. Please rejoin to continue participating."
              : "Your account was logged in from another device. To protect the quiz session, this connection was closed."}
          </p>

          {normalizedCode ? (
            <div className="mt-4 sm:mt-5 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-2.5 max-w-xs w-full">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Session Code</p>
              <p className="mt-0.5 text-xl sm:text-2xl font-black tracking-[0.2em] text-white">{normalizedCode}</p>
            </div>
          ) : null}
        </motion.div>
      </div>

      <div className="mt-6 space-y-3 shrink-0">
        <button
          type="button"
          onClick={() => navigate(code ? `/join/${code}` : "/join", { replace: true })}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-3.5 sm:py-4 font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-500 active:scale-[0.98] text-sm sm:text-base"
        >
          <LogOut size={16} />
          Return to login
          <ArrowRight size={16} />
        </button>
        <p className="text-[10px] sm:text-xs font-medium text-slate-400">
          {code ? "Rejoin with your details if the host allows it." : "Please sign in again to continue."}
        </p>
      </div>
    </div>
  );
}
