import { Navigate } from 'react-router-dom';
import { memo } from 'react';
import { useAuth } from '../hooks/useAuth';

function ProtectedRouteComponent({ children, adminOnly = false }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-full bg-paper-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-3">
            <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full"></div>
          </div>
          <p className="font-body text-ink-muted text-sm">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export const ProtectedRoute = memo(ProtectedRouteComponent);
