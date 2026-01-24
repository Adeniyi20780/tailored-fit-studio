import { Card, CardContent } from "@/components/ui/card";
import { Package, CheckCircle, Clock, DollarSign, TrendingUp, ShoppingBag } from "lucide-react";

interface OrderStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  totalSpent: number;
  averageOrderValue: number;
}

interface CustomerOrderStatsProps {
  stats: OrderStats;
  isLoading: boolean;
}

const CustomerOrderStats = ({ stats, isLoading }: CustomerOrderStatsProps) => {
  const statCards = [
    {
      title: "Total Spent",
      value: `$${stats.totalSpent.toFixed(2)}`,
      icon: DollarSign,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: "bg-accent/10 text-accent",
    },
    {
      title: "Completed",
      value: stats.completedOrders,
      icon: CheckCircle,
      color: "bg-success/10 text-success",
    },
    {
      title: "In Progress",
      value: stats.inProgressOrders,
      icon: Clock,
      color: "bg-terracotta/10 text-terracotta",
    },
    {
      title: "Pending",
      value: stats.pendingOrders,
      icon: Package,
      color: "bg-muted text-muted-foreground",
    },
    {
      title: "Avg. Order",
      value: `$${stats.averageOrderValue.toFixed(2)}`,
      icon: TrendingUp,
      color: "bg-primary/10 text-primary",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="bg-muted h-4 rounded w-1/2 mb-2"></div>
                <div className="bg-muted h-8 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">{stat.title}</p>
                <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CustomerOrderStats;
