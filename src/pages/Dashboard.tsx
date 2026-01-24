import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useCustomerAnalytics } from "@/hooks/useCustomerAnalytics";
import { useStoreAnalytics } from "@/hooks/useStoreAnalytics";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CustomerOrderStats from "@/components/dashboard/CustomerOrderStats";
import CustomerSpendingChart from "@/components/dashboard/CustomerSpendingChart";
import SpendingByCategory from "@/components/dashboard/SpendingByCategory";
import ProductRecommendations from "@/components/dashboard/ProductRecommendations";
import RecentCustomerOrders from "@/components/dashboard/RecentCustomerOrders";
import StatsCard from "@/components/store/StatsCard";
import RevenueChart from "@/components/store/RevenueChart";
import BestSellingProducts from "@/components/store/BestSellingProducts";
import CustomerDemographics from "@/components/store/CustomerDemographics";
import OrderCompletionRate from "@/components/store/OrderCompletionRate";
import {
  Store,
  ShoppingBag,
  Ruler,
  Settings,
  TrendingUp,
  Package,
  Users,
  PlusCircle,
  DollarSign,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const { isTailor, isCustomer, loading: roleLoading } = useUserRole();
  
  // Customer analytics
  const customerAnalytics = useCustomerAnalytics();
  
  // Tailor analytics
  const tailorAnalytics = useStoreAnalytics();

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const customerQuickActions = [
    {
      title: "Browse Tailors",
      description: "Find the perfect tailor for your style",
      icon: Store,
      href: "/tailors",
      color: "bg-primary/10 text-primary",
    },
    {
      title: "My Orders",
      description: "Track your custom orders",
      icon: Package,
      href: "/my-orders",
      color: "bg-accent/10 text-accent",
    },
    {
      title: "Browse Catalog",
      description: "Explore the latest custom clothing",
      icon: ShoppingBag,
      href: "/catalog",
      color: "bg-terracotta/10 text-terracotta",
    },
    {
      title: "My Profile",
      description: "Manage your profile and preferences",
      icon: Settings,
      href: "/profile",
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
      title: "Store Settings",
      description: "Customize your store",
      icon: Settings,
      href: "/store/settings",
      color: "bg-muted text-muted-foreground",
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
            className="mb-8"
          >
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">
              {isTailor() 
                ? `${tailorAnalytics.tailor?.store_name || "Store"} Dashboard`
                : "Your Dashboard"}
            </h1>
            <p className="text-muted-foreground text-lg">
              {isTailor()
                ? "Manage your store and view performance analytics."
                : "Track your orders, spending, and discover personalized recommendations."}
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

          {/* Customer Dashboard */}
          {isCustomer() && !isTailor() && (
            <>
              {/* Order Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-8"
              >
                <CustomerOrderStats 
                  stats={customerAnalytics.orderStats} 
                  isLoading={customerAnalytics.isLoading} 
                />
              </motion.div>

              {/* Charts Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid gap-6 lg:grid-cols-3 mb-8"
              >
                <CustomerSpendingChart 
                  data={customerAnalytics.monthlySpending} 
                  isLoading={customerAnalytics.isLoading} 
                />
                <SpendingByCategory 
                  data={customerAnalytics.spendingByCategory} 
                  isLoading={customerAnalytics.isLoading} 
                />
              </motion.div>

              {/* Recent Orders and Recommendations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="grid gap-6 lg:grid-cols-2 mb-8"
              >
                <RecentCustomerOrders 
                  orders={customerAnalytics.recentOrders} 
                  isLoading={customerAnalytics.isLoading} 
                />
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Navigate to your favorite sections</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {quickActions.map((action) => (
                        <Link key={action.title} to={action.href}>
                          <div className="flex items-center gap-3 p-3 rounded-lg border hover:border-accent/50 transition-colors cursor-pointer group">
                            <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <action.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">{action.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{action.description}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Product Recommendations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <ProductRecommendations 
                  products={customerAnalytics.recommendations}
                  favoriteCategories={customerAnalytics.favoriteCategories}
                  isLoading={customerAnalytics.isLoading} 
                />
              </motion.div>
            </>
          )}

          {/* Tailor Dashboard */}
          {isTailor() && (
            <>
              {/* Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8"
              >
                <StatsCard
                  title="Total Revenue"
                  value={`$${tailorAnalytics.stats.totalRevenue.toFixed(2)}`}
                  description="from all orders"
                  icon={DollarSign}
                  trend={tailorAnalytics.stats.totalRevenue > 0 ? { value: 12, isPositive: true } : undefined}
                />
                <StatsCard
                  title="Total Orders"
                  value={tailorAnalytics.stats.totalOrders}
                  description="all time"
                  icon={ShoppingBag}
                />
                <StatsCard
                  title="Products"
                  value={tailorAnalytics.stats.totalProducts}
                  description="in your catalog"
                  icon={Package}
                />
                <StatsCard
                  title="Completion Rate"
                  value={
                    tailorAnalytics.stats.totalOrders > 0
                      ? `${((tailorAnalytics.stats.completedOrders / tailorAnalytics.stats.totalOrders) * 100).toFixed(0)}%`
                      : "0%"
                  }
                  description="orders completed"
                  icon={TrendingUp}
                />
              </motion.div>

              {/* Secondary Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8"
              >
                <StatsCard
                  title="Completed"
                  value={tailorAnalytics.stats.completedOrders}
                  description="orders"
                  icon={CheckCircle}
                />
                <StatsCard
                  title="In Progress"
                  value={tailorAnalytics.stats.inProgressOrders}
                  description="orders"
                  icon={Clock}
                />
                <StatsCard
                  title="Pending"
                  value={tailorAnalytics.stats.pendingOrders}
                  description="awaiting action"
                  icon={Clock}
                />
                <StatsCard
                  title="Customers"
                  value={new Set(tailorAnalytics.recentOrders.map(o => o.customer_name)).size}
                  description="unique customers"
                  icon={Users}
                />
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mb-8"
              >
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((action) => (
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

              {/* Charts Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid gap-6 lg:grid-cols-3 mb-8"
              >
                <RevenueChart data={tailorAnalytics.revenueTrends} isLoading={tailorAnalytics.isLoading} />
                <OrderCompletionRate
                  completed={tailorAnalytics.stats.completedOrders}
                  inProgress={tailorAnalytics.stats.inProgressOrders}
                  pending={tailorAnalytics.stats.pendingOrders}
                  cancelled={tailorAnalytics.stats.cancelledOrders}
                  isLoading={tailorAnalytics.isLoading}
                />
              </motion.div>

              {/* Analytics Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="grid gap-6 lg:grid-cols-2 mb-8"
              >
                <BestSellingProducts products={tailorAnalytics.bestSellingProducts} isLoading={tailorAnalytics.isLoading} />
                <CustomerDemographics data={tailorAnalytics.customerDemographics} isLoading={tailorAnalytics.isLoading} />
              </motion.div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
