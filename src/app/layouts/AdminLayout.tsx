import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { ADMIN_USER_STORAGE_KEY, adminLogout } from "../api/adminAuth";
import { ACTIVE_ADMIN_SESSION_ID_STORAGE_KEY, useSession } from "../context/SessionContext";
import { LayoutDashboard, PlusCircle, Radio, BarChart3, Settings, LogOut, Search, Bell, User } from "lucide-react";
import { toast } from "sonner";

type StoredAdminUser = {
  id: number;
  name: string;
  username: string;
};

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentSession } = useSession();
  const [adminUser, setAdminUser] = useState<StoredAdminUser | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem(ADMIN_USER_STORAGE_KEY);

    if (!storedUser) {
      return;
    }

    try {
      setAdminUser(JSON.parse(storedUser) as StoredAdminUser);
    } catch {
      localStorage.removeItem(ADMIN_USER_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (currentSession?.id !== undefined && currentSession?.id !== null) {
      const nextId = String(currentSession.id);
      setActiveSessionId(nextId);
      localStorage.setItem(ACTIVE_ADMIN_SESSION_ID_STORAGE_KEY, nextId);
      return;
    }

    setActiveSessionId(localStorage.getItem(ACTIVE_ADMIN_SESSION_ID_STORAGE_KEY));
  }, [currentSession?.id]);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
    { icon: PlusCircle, label: "Create Session", href: "/admin/create-session" },
    { icon: Radio, label: "Live Sessions", href: activeSessionId ? `/admin/session/${activeSessionId}/control` : null },
    { icon: BarChart3, label: "Reports", href: "/admin/reports" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">Q</div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              QuizAdmin
            </span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            item.href ? (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  location.pathname === item.href
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  toast.info("Create or reopen a session to access live controls.");
                  navigate("/admin/create-session");
                }}
                className="flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-colors text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <item.icon size={20} />
                {item.label}
              </button>
            )
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={async () => {
              await adminLogout();
              localStorage.removeItem(ADMIN_USER_STORAGE_KEY);
              navigate("/");
            }}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search sessions, reports..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-semibold">{adminUser?.name ?? "Admin User"}</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
