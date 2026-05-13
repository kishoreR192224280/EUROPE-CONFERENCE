import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { User, IdCard, Play, Users, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useSession } from "../../context/SessionContext";
import { getPublicSession, joinLiveSession, participantStorageKey } from "../../api/liveSessionApi";

export function StudentJoin() {
  const navigate = useNavigate();
  const { code: routeCode } = useParams();
  const { setSession } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    registerNumber: "",
    code: routeCode?.toUpperCase() ?? ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(routeCode));
  const [sessionTitle, setSessionTitle] = useState("");
  const [isSessionUnavailable, setIsSessionUnavailable] = useState(false);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      code: routeCode?.toUpperCase() ?? prev.code,
    }));
  }, [routeCode]);

  useEffect(() => {
    if (!routeCode) {
      setSessionTitle("");
      setIsSessionUnavailable(false);
      setIsCheckingSession(false);
      return;
    }

    const normalizedCode = routeCode.toUpperCase();
    const existingParticipant = sessionStorage.getItem(participantStorageKey(normalizedCode));
    if (existingParticipant) {
      navigate(`/join/${normalizedCode}/waiting`, { replace: true });
      return;
    }

    let isMounted = true;
    setIsCheckingSession(true);

    const loadSession = async () => {
      try {
        const session = await getPublicSession(normalizedCode);
        if (!isMounted) {
          return;
        }

        setSessionTitle(session.title);
        setIsSessionUnavailable(false);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setSessionTitle("");
        setIsSessionUnavailable(true);
        toast.error(err instanceof Error ? err.message : "Session not found");
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, [navigate, routeCode]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedCode = formData.code.trim().toUpperCase();
    if (!normalizedCode) {
      toast.error("Please enter a session code");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!formData.registerNumber.trim()) {
      toast.error("Please enter your register number");
      return;
    }

    setIsLoading(true);

    try {
      const response = await joinLiveSession({
        code: normalizedCode,
        name: formData.name.trim(),
        registerNumber: formData.registerNumber.trim(),
      });

      sessionStorage.setItem(
        participantStorageKey(normalizedCode),
        JSON.stringify(response.participant)
      );
      setSession(response.session);
      navigate(`/join/${normalizedCode}/waiting`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join session");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 pb-12">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-xl shadow-indigo-100">
          Q
        </div>
        <h1 className="text-2xl font-black text-gray-900">
          {routeCode ? "Join This Session" : "Join Session"}
        </h1>
        <p className="text-gray-500 mt-1">
          {routeCode
            ? "Enter your details once to join the live quiz."
            : "Enter the session code and your details to start the quiz."}
        </p>
      </div>

      {routeCode && (
        <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">Session Code</p>
              <p className="mt-1 text-lg font-black text-indigo-900">{routeCode.toUpperCase()}</p>
              <p className="mt-1 text-sm text-indigo-700">
                {isCheckingSession
                  ? "Checking session details..."
                  : sessionTitle
                    ? `Joining "${sessionTitle}"`
                    : isSessionUnavailable
                      ? "This session code could not be found or is not available."
                      : "Ready to join."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/join")}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-indigo-700 shadow-sm"
            >
              <ArrowLeft size={16} />
              Change
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleJoin} className="space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <IdCard size={20} />
            </div>
            <input
              type="text"
              placeholder="Session Code (e.g. ABC123)"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              readOnly={Boolean(routeCode)}
              className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl outline-none transition-all font-black uppercase tracking-widest text-lg ${
                routeCode
                  ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gray-50 border-gray-100 focus:border-indigo-600 focus:bg-white"
              }`}
              required
            />
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <User size={20} />
            </div>
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <IdCard size={20} />
            </div>
            <input
              type="text"
              placeholder="Register Number"
              value={formData.registerNumber}
              onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || isCheckingSession || isSessionUnavailable}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              Join the Game
              <Play size={20} fill="currentColor" />
            </>
          )}
        </button>
      </form>

      <div className="mt-12 pt-8 border-t border-gray-100">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Live Check-in</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Name + Register Number saved for leaderboard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
