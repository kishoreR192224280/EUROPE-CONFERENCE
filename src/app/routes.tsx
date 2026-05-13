import { createBrowserRouter } from "react-router";
import { AdminLayout } from "./layouts/AdminLayout";
import { StudentLayout } from "./layouts/StudentLayout";
import { Login } from "./pages/admin/Login";
import { Dashboard } from "./pages/admin/Dashboard";
import { CreateSession } from "./pages/admin/CreateSession";
import { SessionSuccess } from "./pages/admin/SessionSuccess";
import { AdminControl } from "./pages/admin/AdminControl";
import { Reports } from "./pages/admin/Reports";
import { StudentJoin } from "./pages/student/Join";
import { StudentWaiting } from "./pages/student/Waiting";
import { StudentQuestion } from "./pages/student/Question";
import { BigScreen } from "./pages/BigScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/join",
    element: <StudentLayout />,
    children: [
      { index: true, element: <StudentJoin /> },
      { path: ":code", element: <StudentJoin /> },
      { path: ":code/waiting", element: <StudentWaiting /> },
      { path: ":code/question", element: <StudentQuestion /> },
    ],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "create-session", element: <CreateSession /> },
      { path: "session/:id/success", element: <SessionSuccess /> },
      { path: "session/:id/control", element: <AdminControl /> },
      { path: "reports", element: <Reports /> },
    ],
  },
  {
    path: "/student",
    element: <StudentLayout />,
    children: [
      { path: "join", element: <StudentJoin /> },
      { path: "session/:code", element: <StudentWaiting /> },
      { path: "session/:code/question", element: <StudentQuestion /> },
    ],
  },
  {
    path: "/big-screen/:code",
    element: <BigScreen />,
  },
]);
