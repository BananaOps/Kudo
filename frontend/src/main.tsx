import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { UserProvider, useUser } from "./context/UserContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { MyKudosPage } from "./pages/MyKudosPage";
import { AdminSettingsPage } from "./pages/AdminSettingsPage";
import { ChallengesPage } from "./pages/ChallengesPage";

/** Redirects to /leaderboard while auth is resolving or when not authenticated. */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { authStatus } = useUser();
  if (authStatus === 'loading') return null;
  if (authStatus === 'unauthenticated') return <Navigate to="/leaderboard" replace />;
  return <>{children}</>;
}

/** Redirects to / when the user is authenticated but not an admin. */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { authStatus, isAdmin } = useUser();
  if (authStatus === 'loading') return null;
  if (authStatus === 'unauthenticated') return <Navigate to="/leaderboard" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<PrivateRoute><HomePage /></PrivateRoute>} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="kudos" element={<PrivateRoute><MyKudosPage /></PrivateRoute>} />
            <Route path="challenges" element={<PrivateRoute><ChallengesPage /></PrivateRoute>} />
            <Route path="admin" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
    </ThemeProvider>
  </StrictMode>
);
