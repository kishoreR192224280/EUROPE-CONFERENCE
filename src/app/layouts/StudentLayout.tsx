import { Outlet } from "react-router";

export function StudentLayout() {
  return (
    <div className="min-h-[100dvh] bg-indigo-600 flex flex-col items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-3.5rem)] flex flex-col min-h-0">
        <Outlet />
      </div>
      <p className="mt-3 sm:mt-4 text-indigo-200 text-xs sm:text-sm font-medium text-center">
        Powered by Saveetha Medical Science and technologies
      </p>
    </div>
  );
}
