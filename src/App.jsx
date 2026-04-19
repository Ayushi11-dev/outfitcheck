import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import WardrobePage from "./pages/WardrobePage";
import OutfitsPage from "./pages/OutfitsPage";
import LooksPage from "./pages/LooksPage";
import FitCheckPage from "./pages/FitCheckPage";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import Layout from "./components/Layout";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute><Layout /></ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="wardrobe" element={<WardrobePage />} />
            <Route path="outfits" element={<OutfitsPage />} />
            <Route path="looks" element={<LooksPage />} />
            <Route path="fitcheck" element={<FitCheckPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}