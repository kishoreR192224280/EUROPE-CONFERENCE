import { RouterProvider } from "react-router";
import { router } from "./routes";
import { SessionProvider } from "./context/SessionContext";
import { Toaster } from "sonner";

export default function App() {
  return (
    <SessionProvider>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </SessionProvider>
  );
}
