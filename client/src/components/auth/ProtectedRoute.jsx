/**
 * DEVVERSE — Protected Route Guard
 *
 * Client-side convenience route protection:
 *   - Renders a loading state during session hydration so logged-in users aren't prematurely redirected.
 *   - Redirects unauthenticated visitors to `/login`, preserving target path in `state.from`.
 *   - Renders child component when authenticated.
 *
 * NOTE: This is for UI convenience only. Server endpoints strictly enforce
 * authentication as the security boundary.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingState from '../ui/LoadingState';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '0 20px' }}>
        <LoadingState message="Verifying developer session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
