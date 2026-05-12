import { useState } from "react";
import { ADMIN_USER_STORAGE_KEY, adminLogin } from "../../api/adminAuth";
import { useNavigate } from "react-router";
import { Mail, Lock, ArrowRight, Github } from "lucide-react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { motion } from "motion/react";

export function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await adminLogin(username, password);
      if (res.success) {
        localStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(res.user));
        navigate("/admin/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-gray-50">
      {/* Left side: Login Form */}
      <div className="flex-1 flex flex-col justify-center px-12 lg:px-24">
        <div className="max-w-md w-full mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-6 shadow-lg shadow-blue-200">
              Q
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Admin</h1>
            <p className="text-gray-500">Enter your credentials to manage your live sessions.</p>
          </motion.div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  required
                  type="text"
                  placeholder="Enter your username"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <a href="#" className="text-sm font-medium text-blue-600 hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm font-medium text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Login to Dashboard
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          
        </div>
      </div>

      {/* Right side: Illustration & Background */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-blue-600 to-indigo-900 overflow-hidden items-center justify-center p-12">
        {/* Animated Background blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-400 opacity-20 blur-3xl rounded-full"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.5, 1],
              rotate: [0, -90, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/4 -right-1/4 w-2/3 h-2/3 bg-indigo-400 opacity-20 blur-3xl rounded-full"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-2xl"
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1763718528755-4bca23f82ac3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhZG1pbiUyMGRhc2hib2FyZCUyMGlsbHVzdHJhdGlvbnxlbnwxfHx8fDE3Nzg1NjM1NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Admin Illustration"
              className="rounded-2xl shadow-xl mb-8"
            />
            <div className="text-white text-center">
              <h2 className="text-2xl font-bold mb-2">Real-time Audience Engagement</h2>
              <p className="text-blue-100">Create interactive quizzes, live polls, and detailed reports in seconds.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
