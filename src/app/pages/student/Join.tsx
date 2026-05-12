import { useState } from "react";
import { useNavigate } from "react-router";
import { User, IdCard, Play, Users } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

export function StudentJoin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    rollNumber: "",
    code: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code) {
      toast.error("Please enter a session code");
      return;
    }
    setIsLoading(true);
    // Mock join delay
    setTimeout(() => {
      navigate(`/student/session/${formData.code.toUpperCase()}`);
    }, 1200);
  };

  return (
    <div className="p-8 pb-12">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-xl shadow-indigo-100">
          Q
        </div>
        <h1 className="text-2xl font-black text-gray-900">Join Session</h1>
        <p className="text-gray-500 mt-1">Enter your details to start the quiz.</p>
      </div>

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
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-black uppercase tracking-widest text-lg"
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
              placeholder="Roll Number / ID"
              value={formData.rollNumber}
              onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
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
              <p className="text-sm font-bold text-gray-900">4.2k+</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Players Today</p>
            </div>
          </div>
          <div className="flex -space-x-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 overflow-hidden">
                <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
