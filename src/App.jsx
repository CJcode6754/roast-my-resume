import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import RoasterPage from './pages/RoasterPage';
import AdminPage from './pages/AdminPage';
import HallOfShamePage from './pages/HallOfShamePage';

export default function App() {
  return (
    <div className="h-screen flex flex-col bg-paper-bg overflow-hidden">
      <Navbar />
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoasterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hall-of-shame"
            element={
              <ProtectedRoute>
                <HallOfShamePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}
