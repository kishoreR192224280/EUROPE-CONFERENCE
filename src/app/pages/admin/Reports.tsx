import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { AlertCircle, CheckCircle, FileText, RefreshCw, TrendingUp, Users } from "lucide-react";
import { getAdminReports, type ReportsPayload } from "../../api/reportsApi";

const ACCURACY_COLORS = ["#10b981", "#ef4444"];

function formatReportDate(value: string | null) {
  if (!value) {
    return "Unknown date";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export function Reports() {
  const [reports, setReports] = useState<ReportsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      try {
        const payload = await getAdminReports();
        if (!isMounted) {
          return;
        }

        setReports(payload);
        setLoadError("");
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setLoadError(err instanceof Error ? err.message : "Failed to load reports");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadReports();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshReports = async () => {
    setIsLoading(true);
    try {
      const payload = await getAdminReports();
      setReports(payload);
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  const accuracyData = reports
    ? [
        { name: "Correct", value: reports.overview.correctAnswers, color: "#10b981" },
        {
          name: "Incorrect",
          value: Math.max(0, reports.overview.totalAnswers - reports.overview.correctAnswers),
          color: "#ef4444",
        },
      ]
    : [];

  if (isLoading && !reports) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-gray-600">
          <RefreshCw className="animate-spin" size={18} />
          <span className="font-semibold">Loading reports...</span>
        </div>
      </div>
    );
  }

  if (loadError && !reports) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 text-red-500" size={18} />
          <div>
            <h2 className="text-lg font-bold text-gray-900">Unable to Load Reports</h2>
            <p className="mt-2 text-gray-500">{loadError}</p>
            <button
              onClick={() => void refreshReports()}
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!reports) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Reports</h1>
          <p className="text-gray-500">Track real participation, accuracy, and recent session outcomes.</p>
        </div>
        <button
          onClick={() => void refreshReports()}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">Overall Accuracy</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-900">{reports.overview.overallAccuracy.toFixed(1)}%</h3>
          <p className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
            <TrendingUp size={12} />
            Based on all submitted answers
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">Unique Students</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-900">{reports.overview.totalStudents}</h3>
          <p className="mt-2 flex items-center gap-1 text-xs font-bold text-blue-600">
            <Users size={12} />
            Reused across multiple sessions
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">Total Sessions</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-900">{reports.overview.totalSessions}</h3>
          <p className="mt-2 flex items-center gap-1 text-xs font-bold text-indigo-600">
            <FileText size={12} />
            Sessions created under this admin
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">Correct Answers</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-900">{reports.overview.correctAnswers}</h3>
          <p className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
            <CheckCircle size={12} />
            Out of {reports.overview.totalAnswers} answers recorded
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900">Correct vs Incorrect</h3>
            <p className="text-sm text-gray-500">Live answer quality across all sessions</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={accuracyData} innerRadius={58} outerRadius={82} paddingAngle={4} dataKey="value">
                  {accuracyData.map((entry, index) => (
                    <Cell key={entry.name} fill={ACCURACY_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-6">
            <h3 className="font-bold text-gray-900">Recent Question Accuracy</h3>
            <p className="text-sm text-gray-500">How players performed on your latest questions</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reports.questionAccuracy}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{ borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 12px 30px rgba(15,23,42,0.08)" }}
                  formatter={(value: number) => [`${value}%`, "Accuracy"]}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload;
                    return row ? `${row.sessionTitle} • ${row.questionText}` : "";
                  }}
                />
                <Bar dataKey="accuracy" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div>
            <h3 className="font-bold text-gray-900">Recent Sessions</h3>
            <p className="text-sm text-gray-500">Your latest sessions with real participation and accuracy.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-bold uppercase tracking-widest text-gray-500">
              <tr>
                <th className="px-6 py-4">Session Name</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Participants</th>
                <th className="px-6 py-4">Avg. Accuracy</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm font-medium text-gray-500">
                    No sessions available yet. Create and run a session to start generating reports.
                  </td>
                </tr>
              ) : (
                reports.sessions.map((session) => (
                  <tr key={session.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                          <FileText size={18} />
                        </div>
                        <span className="font-semibold text-gray-900">{session.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatReportDate(session.date)}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-gray-700">
                        {session.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-700">{session.participants}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-green-500" style={{ width: `${session.avgAccuracy}%` }}></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{session.avgAccuracy.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold capitalize tracking-wide text-indigo-600">
                        {formatStatusLabel(session.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          Showing last loaded report snapshot. Refresh failed: {loadError}
        </div>
      ) : null}
    </div>
  );
}
