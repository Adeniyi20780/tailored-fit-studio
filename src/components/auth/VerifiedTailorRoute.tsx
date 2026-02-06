import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useTailorVerification } from "@/hooks/useTailorVerification";
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface VerifiedTailorRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * VerifiedTailorRoute - Only allows verified tailors to access the route
 * Unverified tailors see a pending verification message
 */
export const VerifiedTailorRoute = ({
  children,
  redirectTo = "/auth",
}: VerifiedTailorRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasRole, loading: roleLoading } = useUserRole();
  const { isVerified, isPending, isLoading: verificationLoading } = useTailorVerification();

  if (authLoading || roleLoading || verificationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!hasRole("tailor")) {
    return <Navigate to="/dashboard" replace />;
  }

  // If tailor exists but is not verified, show pending message
  if (isPending) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-lg mx-auto">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-semibold mb-3">Verification Pending</h2>
              <p className="text-muted-foreground mb-6">
                Your tailor store is currently under review. Our team will verify your
                application and you'll be notified once approved.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                This usually takes 1-2 business days. Thank you for your patience!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="outline">
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button asChild>
                  <Link to="/">Browse Marketplace</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // If not verified and no pending status, they haven't registered
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-lg mx-auto">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-semibold mb-3">Store Not Set Up</h2>
              <p className="text-muted-foreground mb-6">
                You need to complete your tailor registration to access the store dashboard.
              </p>
              <Button asChild>
                <Link to="/become-a-tailor">Complete Registration</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return <>{children}</>;
};

export default VerifiedTailorRoute;
