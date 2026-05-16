import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore.js';

// Protects any route — redirects to login if not authenticated
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Role-based protection — redirects to dashboard if insufficient role
export const RoleRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    const defaultPath = user?.role === 'staff' ? '/staff-home' : '/dashboard';
    return <Navigate to={defaultPath} replace />;
  }

  return children;
};

// Guest only — redirects to dashboard if already logged in
export const GuestRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    const defaultPath = user?.role === 'staff' ? '/staff-home' : '/dashboard';
    return <Navigate to={defaultPath} replace />;
  }

  return children;
};
