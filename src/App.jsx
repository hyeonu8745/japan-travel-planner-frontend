import { useSyncExternalStore } from "react";
import { getSession, subscribeSession } from "./auth/token";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import RequireAuth from "./auth/RequireAuth";
import AuthPage from "./pages/AuthPage";
import GuidePage from "./pages/GuidePage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import PlannerPage from "./pages/PlannerPage";
import PosterPage from "./pages/PosterPage";
import TripSetupPage from "./pages/TripSetupPage";
import TripsPage from "./pages/TripsPage";

export default function App() {
  const { message } = useSyncExternalStore(subscribeSession, getSession);
  const location = useLocation();
  if (message && location.pathname !== "/auth") {
    return <Navigate to="/auth" replace state={{ from: location.pathname + location.search }} />;
  }
  return (
    <Routes>
      {/* 누구나 */}
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/guide" element={<GuidePage />} />

      {/* 로그인 필요 */}
      <Route element={<RequireAuth />}>
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/new" element={<TripSetupPage />} />
        <Route path="/trips/:tripId/planner" element={<PlannerPage />} />
        <Route path="/trips/:tripId/poster" element={<PosterPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
