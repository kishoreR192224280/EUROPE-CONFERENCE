import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Download, FileText, Filter, MoreVertical, TrendingUp, Users, CheckCircle } from "lucide-react";

const ACCURACY_DATA = [
  { name: "Correct", value: 72, color: "#10b981" },
  { name: "Incorrect", value: 28, color: "#ef4444" },
];

const QUESTION_DATA = [
  { q: "Q1", accuracy: 85 },
  { q: "Q2", accuracy: 42 },
  { q: "Q3", accuracy: 91 },
  { q: "Q4", accuracy: 76 },
  { q: "Q5", accuracy: 55 },
];

export function Reports() {
  const sessions = [
    { id: "1", name: "Science Quiz - Grade 10", date: "May 12, 2026", participants: 45, avgScore: "78%", status: "Ready" },
    { id: "2", name: "Corporate Compliance", date: "May 10, 2026", participants: 120, avgScore: "92%", status: "Ready" },
    { id: "3", name: "Weekly General Knowledge", date: "May 08, 2026", participants: 88, avgScore: "65%", status: "Ready" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Reports</h1>
          <p className="text-gray-500">Analyze participation and performance data.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
            <Filter size={18} />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-100">
            <Download size={18} />
            Export All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Key Stats */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Overall Accuracy</p>
            <h3 className="text-3xl font-bold text-gray-900">76.4%</h3>
            <p className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1">
              <TrendingUp size={12} />
              +4.2% from last month
            </p>
          </div>
          <div className="h-40 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ACCURACY_DATA}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ACCURACY_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-gray-900 mb-6">Accuracy by Question</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={QUESTION_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="q" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: "#f3f4f6" }}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="accuracy" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Recent Sessions</h3>
          <button className="text-sm font-semibold text-blue-600 hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Session Name</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Participants</th>
                <th className="px-6 py-4">Avg. Accuracy</th>
                <th className="px-6 py-4">Report</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                        <FileText size={18} />
                      </div>
                      <span className="font-semibold text-gray-900">{session.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{session.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-700">{session.participants}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500" 
                          style={{ width: session.avgScore }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{session.avgScore}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                      <Download size={14} />
                      PDF
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
