import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { UserProvider } from "./context/UserContext";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { MyKudosPage } from "./pages/MyKudosPage";
import { AdminSettingsPage } from "./pages/AdminSettingsPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="kudos" element={<MyKudosPage />} />
            <Route path="admin" element={<AdminSettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  </StrictMode>
);
