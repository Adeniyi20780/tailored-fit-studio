import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { ReactNode } from "react";

type AppRole = "admin" | "tailor" | "customer";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AppRole;
  redirectTo?: string;
}

/**
 * ProtectedRoute component for client-side route protection.
 * 
 * IMPORTANT: This provides UX-level protection only. All sensitive data
 * access is ultimately protected by Row Level Security (RLS) policies
 * in the database. This component prevents unauthorized users from
 * seeing protected UI, but the actual data security is enforced server-side.
 */
export const ProtectedRoute = ({
  children,
  requiredRole,
  redirectTo = "/auth",
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasRole, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
