import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { UserRole } from '@machinebazaar/shared';
import { useAuth } from '../lib/auth-context';
import { LoadingBlock } from './ui';

const LOGIN_PATH_FOR_ROLE: Record<UserRole, string> = {
  [UserRole.ADMIN]: '/admin/login',
  [UserRole.SELLER]: '/login',
  [UserRole.BUYER]: '/login',
};

/** Gates a route subtree to authenticated users, optionally restricted to specific roles. */
export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingBlock />;

  if (!user) {
    const fallback = roles?.length === 1 ? LOGIN_PATH_FOR_ROLE[roles[0]] : '/login';
    return <Navigate to={fallback} replace state={{ from: location }} />;
  }

  if (roles) {
    // Seller routes: accessible when user has canSell capability (GST-verified),
    // regardless of activeMode — mode only affects which dashboard they see.
    const sellerAllowed = roles.includes(UserRole.SELLER) && user.canSell;
    const roleAllowed = roles.includes(user.role);
    if (!sellerAllowed && !roleAllowed) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}
