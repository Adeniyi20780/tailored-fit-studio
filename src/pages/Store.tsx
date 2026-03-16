import { useAuth } from "@/contexts/AuthContext";
import { useStoreAnalytics } from "@/hooks/useStoreAnalytics";
import StatsCard from "@/components/store/StatsCard";
import RecentOrdersTable from "@/components/store/RecentOrdersTable";
import RevenueChart from "@/components/store/RevenueChart";
import BestSellingProducts from "@/components/store/BestSellingProducts";
import OrderCompletionRate from "@/components/store/OrderCompletionRate";
import QuickActions from "@/components/store/QuickActions";
import CustomerDemographics from "@/components/store/CustomerDemographics";
import TailorRefundsSection from "@/components/store/TailorRefundsSection";
import { TailorAlterationsSection } from "@/components/store/TailorAlterationsSection";
import IncomingOrdersWidget from "@/components/store/IncomingOrdersWidget";
import TailorMessagesInbox from "@/components/store/TailorMessagesInbox";
import Header from "@/components/layout/Header";
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  CheckCircle,
  Clock,
} from "lucide-react";

const Store = () => {
  const { user } = useAuth();
  const {
    tailor,
    stats,
    revenueTrends,
    bestSellingProducts,
    customerDemographics,
    recentOrders,
    isLoading,
  } = useStoreAnalytics();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 pb-6 pt-24 lg:px-8 lg:pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {tailor?.store_name || "Store"} Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's an overview of your store performance.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toFixed(2)}`}
            description="from all orders"
            icon={DollarSign}
            trend={stats.totalRevenue > 0 ? { value: 12, isPositive: true } : undefined}
          />
          <StatsCard
            title="Total Orders"
            value={stats.totalOrders}
            description="all time"
            icon={ShoppingCart}
          />
          <StatsCard
            title="Products"
            value={stats.totalProducts}
            description="in your catalog"
            icon={Package}
          />
          <StatsCard
            title="Completion Rate"
            value={
              stats.totalOrders > 0
                ? `${((stats.completedOrders / stats.totalOrders) * 100).toFixed(0)}%`
                : "0%"
            }
            description="orders completed"
            icon={TrendingUp}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Completed"
            value={stats.completedOrders}
            description="orders"
            icon={CheckCircle}
          />
          <StatsCard
            title="In Progress"
            value={stats.inProgressOrders}
            description="orders"
            icon={Clock}
          />
          <StatsCard
            title="Pending"
            value={stats.pendingOrders}
            description="awaiting action"
            icon={Clock}
          />
          <StatsCard
            title="Cancelled"
            value={stats.cancelledOrders}
            description="orders"
            icon={ShoppingCart}
          />
        </div>

        {/* Charts and Tables Row */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <RevenueChart data={revenueTrends} isLoading={isLoading} />
          <QuickActions />
        </div>

        {/* Incoming Orders with Measurements */}
        {tailor?.id && (
          <div className="mb-8">
            <IncomingOrdersWidget tailorId={tailor.id} />
          </div>
        )}

        {/* Analytics Row */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <BestSellingProducts products={bestSellingProducts} isLoading={isLoading} />
          <OrderCompletionRate
            completed={stats.completedOrders}
            inProgress={stats.inProgressOrders}
            pending={stats.pendingOrders}
            cancelled={stats.cancelledOrders}
            isLoading={isLoading}
          />
          <CustomerDemographics data={customerDemographics} isLoading={isLoading} />
        </div>

        {/* Refunds and Alterations */}
        {tailor?.id && (
          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            <TailorRefundsSection tailorId={tailor.id} />
            <TailorAlterationsSection tailorId={tailor.id} />
          </div>
        )}

        {/* Customer Messages */}
        {tailor?.id && (
          <div className="mb-8">
            <TailorMessagesInbox tailorId={tailor.id} />
          </div>
        )}

        {/* Recent Orders */}
        <div className="grid gap-6">
          <RecentOrdersTable orders={recentOrders} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default Store;
