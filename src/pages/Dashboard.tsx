import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Store,
  ShoppingBag,
  Ruler,
  Settings,
  TrendingUp,
  Package,
  Users,
  PlusCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isTailor, isCustomer, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const customerQuickActions = [
    {
      title: "Browse Tailors",
      description: "Find the perfect tailor for your style",
      icon: Store,
      href: "/marketplace",
      color: "bg-primary/10 text-primary",
    },
    {
      title: "My Orders",
      description: "Track your custom orders",
      icon: Package,
      href: "/orders",
      color: "bg-accent/10 text-accent",
    },
    {
      title: "My Measurements",
      description: "View and update your body measurements",
      icon: Ruler,
      href: "/measurements",
      color: "bg-terracotta/10 text-terracotta",
    },
    {
      title: "Account Settings",
      description: "Manage your profile and preferences",
      icon: Settings,
      href: "/settings",
      color: "bg-muted text-muted-foreground",
    },
  ];

  const tailorQuickActions = [
    {
      title: "My Store",
      description: "Manage your storefront",
      icon: Store,
      href: "/store",
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Add Product",
      description: "List a new item for sale",
      icon: PlusCircle,
      href: "/store/products/new",
      color: "bg-accent/10 text-accent",
    },
    {
      title: "Orders",
      description: "View and manage incoming orders",
      icon: ShoppingBag,
      href: "/store/orders",
      color: "bg-terracotta/10 text-terracotta",
    },
    {
      title: "Analytics",
      description: "View your sales and performance",
      icon: TrendingUp,
      href: "/store/analytics",
      color: "bg-success/10 text-success",
    },
  ];

  const quickActions = isTailor() ? tailorQuickActions : customerQuickActions;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">
              Welcome back!
            </h1>
            <p className="text-muted-foreground text-lg">
              {isTailor()
                ? "Manage your store and connect with customers worldwide."
                : "Discover tailored fashion and track your orders."}
            </p>
          </motion.div>

          {/* Become a Tailor CTA for customers */}
          {isCustomer() && !isTailor() && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <Card className="bg-gradient-to-r from-primary/10 via-accent/5 to-terracotta/10 border-accent/20">
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                      <Store className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Are you a tailor?
                      </h3>
                      <p className="text-muted-foreground">
                        Create your storefront and start selling globally.
                      </p>
                    </div>
                  </div>
                  <Link to="/become-tailor">
                    <Button variant="hero">Become a Tailor</Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Quick Actions Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-display text-xl font-semibold text-foreground mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Link key={action.title} to={action.href}>
                  <Card className="h-full hover:border-accent/50 transition-colors cursor-pointer group">
                    <CardHeader className="pb-2">
                      <div
                        className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}
                      >
                        <action.icon className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{action.description}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Stats for tailors */}
          {isTailor() && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12"
            >
              <h2 className="font-display text-xl font-semibold text-foreground mb-6">
                Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">
                          Total Orders
                        </p>
                        <p className="text-3xl font-semibold text-foreground">
                          0
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Revenue</p>
                        <p className="text-3xl font-semibold text-foreground">
                          $0
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-success" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">
                          Customers
                        </p>
                        <p className="text-3xl font-semibold text-foreground">
                          0
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-accent" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
