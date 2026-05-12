import { useNavigate } from "react-router";
import { Check, Copy, Share2, Play, Layout, QrCode as QrIcon } from "lucide-react";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { useSession } from "../../context/SessionContext";
import { toast } from "sonner";

export function SessionSuccess() {
  const navigate = useNavigate();
  const { currentSession } = useSession();

  if (!currentSession) return null;

  const joinLink = `https://quiz.pro/join/${currentSession.code}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-green-100"
        >
          <Check size={40} strokeWidth={3} />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Created Successfully!</h1>
        <p className="text-gray-500 text-lg">Your session "{currentSession.title}" is ready to go live.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Code and QR */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">Session Code</p>
            <div className="flex items-center justify-between gap-4">
              <span className="text-6xl font-black text-gray-900 tracking-tighter">{currentSession.code}</span>
              <button 
                onClick={() => copyToClipboard(currentSession.code)}
                className="p-3 bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              >
                <Copy size={24} />
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl flex items-center gap-8">
            <div className="p-4 bg-gray-50 rounded-2xl">
              <QRCodeSVG value={joinLink} size={120} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Scan to Join</h3>
              <p className="text-sm text-gray-500 mb-4">Direct your students to scan this QR code to join instantly.</p>
              <button className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
                <Share2 size={18} />
                Download QR Code
              </button>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 ml-2">Quick Actions</h3>
          
          <button 
            onClick={() => window.open(`/big-screen/${currentSession.code}`, '_blank')}
            className="w-full flex items-center gap-4 p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:shadow-lg transition-all group"
          >
            <div className="p-3 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
              <Layout size={24} />
            </div>
            <div className="text-left">
              <p className="font-bold text-lg">Open Big Screen</p>
              <p className="text-sm text-blue-100">Display for the audience/projector</p>
            </div>
          </button>

          <button 
            onClick={() => navigate(`/admin/session/${currentSession.id}/control`)}
            className="w-full flex items-center gap-4 p-5 bg-white border border-gray-200 text-gray-900 rounded-2xl hover:bg-gray-50 transition-all group"
          >
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <Play size={24} />
            </div>
            <div className="text-left">
              <p className="font-bold text-lg">Go to Control Panel</p>
              <p className="text-sm text-gray-500">Manage questions and live results</p>
            </div>
          </button>

          <div className="p-5 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">Share Join Link</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={joinLink}
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-500"
              />
              <button 
                onClick={() => copyToClipboard(joinLink)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-blue-600"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
