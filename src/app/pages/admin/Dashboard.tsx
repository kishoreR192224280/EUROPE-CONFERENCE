import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertCircle,
  BarChart3,
  FileText,
  MoreVertical,
  Plus,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getAdminReports, type ReportsPayload } from "../../api/reportsApi";

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function formatDashboardDate(value: string | null) {
  if (!value) {
    return "Recently";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Recently";
  }

  const diffMs = Date.now() - parsed.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    return "Just now";
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function buildActivitySeries(sessions: ReportsPayload["sessions"]) {
  const today = new Date();
  const buckets = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setHours(0, 0, 0, 0);
    day.setDate(today.getDate() - (6 - index));

    return {
      key: day.toISOString().slice(0, 10),
      name: day.toLocaleDateString("en-US", { weekday: "short" }),
      sessions: 0,
      participants: 0,
    };
  });

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  sessions.forEach((session) => {
    if (!session.date) {
      return;
    }

    const parsed = new Date(session.date);
    if (Number.isNaN(parsed.getTime())) {
      return;
    }

    const key = parsed.toISOString().slice(0, 10);
    const bucket = bucketMap.get(key);
    if (!bucket) {
      return;
    }

    bucket.sessions += 1;
    bucket.participants += session.participants;
  });

  return buckets;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
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

        setLoadError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshDashboard = async () => {
    setIsLoading(true);
    try {
      const payload = await getAdminReports();
      setReports(payload);
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !reports) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-gray-600">
          <RefreshCw className="animate-spin" size={18} />
          <span className="font-semibold">Loading dashboard...</span>
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
            <h2 className="text-lg font-bold text-gray-900">Unable to Load Dashboard</h2>
            <p className="mt-2 text-gray-500">{loadError}</p>
            <button
              onClick={() => void refreshDashboard()}
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

  const recentSessions = reports.sessions.slice(0, 5);
  const activitySeries = buildActivitySeries(reports.sessions);
  const avgScore = reports.overview.overallAccuracy;
  const engagedStudents =
    reports.overview.totalSessions > 0
      ? Math.round(reports.overview.totalStudents / reports.overview.totalSessions)
      : 0;
  const liveOrRecentlyUsed = recentSessions.filter((session) =>
    ["waiting", "active", "leaderboard", "results", "ended"].includes(session.status)
  ).length;

  const stats = [
    {
      label: "Unique Students",
      value: formatCompactNumber(reports.overview.totalStudents),
      helper: "Across all your sessions",
      icon: Users,
      iconClass: "bg-violet-50 text-violet-600",
    },
    {
      label: "Average Score",
      value: `${avgScore.toFixed(1)}%`,
      helper: "Based on submitted answers",
      icon: BarChart3,
      iconClass: "bg-amber-50 text-amber-600",
    },
    {
      label: "Total Sessions",
      value: formatCompactNumber(reports.overview.totalSessions),
      helper: `${liveOrRecentlyUsed} recent sessions with activity`,
      icon: FileText,
      iconClass: "bg-blue-50 text-blue-600",
    },
    {
      label: "Students Per Session",
      value: formatCompactNumber(engagedStudents),
      helper: "Average participation depth",
      icon: TrendingUp,
      iconClass: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Monitor recent activity, participation, and performance from real session data.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => void refreshDashboard()}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => navigate("/admin/create-session")}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-md shadow-blue-100 transition-all hover:bg-blue-700"
          >
            <Plus size={20} />
            Create New Session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className={`rounded-xl p-3 ${stat.iconClass}`}>
                <stat.icon size={22} />
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-500">{stat.label}</p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{stat.value}</h3>
            <p className="mt-2 text-xs font-medium text-gray-500">{stat.helper}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Session Activity</h3>
              <p className="text-sm text-gray-500">Sessions created over the last 7 days from your real data.</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              7 day view
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activitySeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2ff" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={26} />
                <Tooltip
                  cursor={{ stroke: "#c7d2fe", strokeWidth: 1 }}
                  contentStyle={{
                    borderRadius: "16px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
                  }}
                  formatter={(value: number, name: string) => [
                    value,
                    name === "sessions" ? "Sessions" : "Participants",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#2563eb" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="participants"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#10b981" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Recent Sessions</h3>
              <p className="text-sm text-gray-500">Quick access to the latest sessions you created.</p>
            </div>
            <button
              onClick={() => navigate("/admin/reports")}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              View Reports
            </button>
          </div>

          <div className="space-y-4">
            {recentSessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-10 text-center">
                <p className="font-semibold text-gray-700">No sessions yet</p>
                <p className="mt-2 text-sm text-gray-500">Create your first session to start seeing live dashboard activity.</p>
              </div>
            ) : (
              recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-2xl border border-transparent p-4 transition-colors hover:border-gray-100 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        onClick={() => navigate(`/admin/session/${session.id}/control`)}
                        className="truncate text-left text-sm font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {session.name}
                      </button>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDashboardDate(session.date)} • {session.participants} participant{session.participants === 1 ? "" : "s"}
                      </p>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600" aria-label="Session options">
                      <MoreVertical size={16} />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                      {session.code}
                    </span>
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      {formatStatusLabel(session.status)}
                    </span>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                      {session.avgAccuracy.toFixed(1)}% accuracy
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          Showing the last loaded dashboard snapshot. Refresh failed: {loadError}
        </div>
      ) : null}
    </div>
  );
}
