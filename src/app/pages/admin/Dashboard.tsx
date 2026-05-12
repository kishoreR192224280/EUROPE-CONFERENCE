import { useNavigate } from "react-router";
import { Users, Play, Clock, BarChart, Plus, MoreVertical, Search } from "lucide-react";
import { motion } from "motion/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Mon", sessions: 4 },
  { name: "Tue", sessions: 7 },
  { name: "Wed", sessions: 5 },
  { name: "Thu", sessions: 12 },
  { name: "Fri", sessions: 9 },
  { name: "Sat", sessions: 3 },
  { name: "Sun", sessions: 2 },
];

export function Dashboard() {
  const navigate = useNavigate();

  const stats = [
    { label: "Total Sessions", value: "124", change: "+12%", icon: BarChart, color: "blue" },
    { label: "Active Sessions", value: "3", change: "Live now", icon: Play, color: "green" },
    { label: "Total Students", value: "2,840", change: "+4.5%", icon: Users, color: "purple" },
    { label: "Avg Score", value: "78%", change: "+2%", icon: BarChart, color: "orange" },
  ];

  const recentSessions = [
    { id: "1", title: "Product Training Q2", date: "2 hours ago", students: 45, status: "completed", code: "PROD24" },
    { id: "2", title: "Monthly General Knowledge", date: "5 hours ago", students: 120, status: "completed", code: "GKNOV" },
    { id: "3", title: "Team Building Quiz", date: "Yesterday", students: 12, status: "completed", code: "TEAM24" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here's what's happening with your sessions.</p>
        </div>
        <button
          onClick={() => navigate("/admin/create-session")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-100"
        >
          <Plus size={20} />
          Create New Session
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                <stat.icon size={24} />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                stat.change.includes("+") ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sessions Activity Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-gray-900">Sessions Activity</h3>
            <select className="text-sm border-none bg-gray-50 rounded-lg py-1 px-3 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#2563eb" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Recent Sessions</h3>
            <button className="text-blue-600 text-sm font-medium hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {recentSessions.map((session) => (
              <div key={session.id} className="p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{session.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{session.date} • {session.students} students</p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={16} />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {session.code}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600 px-2 py-0.5 rounded">
                    {session.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
