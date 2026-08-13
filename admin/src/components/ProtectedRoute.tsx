import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import Spinner from './Spinner';

export function ProtectedRoute({ superadminOnly = false }: { superadminOnly?: boolean }) {
  const { admin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!admin) return <Navigate to="/login" state={{ from: location }} replace />;
  if (superadminOnly && admin.role !== 'superadmin') return <Navigate to="/" replace />;

  return <Outlet />;
}
