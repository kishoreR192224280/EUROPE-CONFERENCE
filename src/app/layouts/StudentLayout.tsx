import { Outlet } from "react-router";

export function StudentLayout() {
  return (
    <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <Outlet />
      </div>
      <p className="mt-8 text-indigo-200 text-sm font-medium">
        Powered by Interactive Sessions Pro
      </p>
    </div>
  );
}
