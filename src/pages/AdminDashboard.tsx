import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAdminAnalytics } from "@/hooks/useAdminAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Store,
  Package,
  DollarSign,
  ShoppingBag,
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { format } from "date-fns";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
import AdminOrdersTable from "@/components/admin/AdminOrdersTable";
import AdminRefundsTable from "@/components/admin/AdminRefundsTable";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--terracotta))", "hsl(var(--success))", "hsl(var(--muted))"];

const AdminDashboard = () => {
  const { 
    stats, 
    revenueTrends, 
    orderStatusDistribution,
    recentOrders,
    profiles,
    tailors,
    orders,
    refundRequests,
    userRoles,
    isLoading 
  } = useAdminAnalytics();

  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Active Tailors",
      value: stats.totalTailors,
      icon: Store,
      color: "bg-accent/10 text-accent",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: Package,
      color: "bg-terracotta/10 text-terracotta",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-success/10 text-success",
    },
    {
      title: "Products Listed",
      value: stats.totalProducts,
      icon: ShoppingBag,
      color: "bg-muted text-muted-foreground",
    },
    {
      title: "Pending Refunds",
      value: stats.pendingRefunds,
      icon: RefreshCw,
      color: stats.pendingRefunds > 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Monitor platform performance and manage users, orders, and refunds.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
          >
            {statCards.map((stat, index) => (
              <Card key={stat.title} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="refunds">
                Refunds
                {stats.pendingRefunds > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {stats.pendingRefunds}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend (30 Days)</CardTitle>
                    <CardDescription>Daily platform revenue</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueTrends}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) => format(new Date(value), "MMM d")}
                            className="text-muted-foreground"
                          />
                          <YAxis
                            tickFormatter={(value) => `$${value}`}
                            className="text-muted-foreground"
                          />
                          <Tooltip
                            formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                            labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
                          />
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="hsl(var(--primary))"
                            fill="url(#colorRevenue)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Orders Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Orders Trend (30 Days)</CardTitle>
                    <CardDescription>Daily order count</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueTrends}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) => format(new Date(value), "MMM d")}
                            className="text-muted-foreground"
                          />
                          <YAxis className="text-muted-foreground" />
                          <Tooltip
                            formatter={(value: number) => [value, "Orders"]}
                            labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
                          />
                          <Bar dataKey="orders" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Status Distribution</CardTitle>
                    <CardDescription>Current status breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={orderStatusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            dataKey="count"
                            nameKey="status"
                            label={({ status, count }) => `${status}: ${count}`}
                          >
                            {orderStatusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Last 10 orders across the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentOrders.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No orders yet</p>
                      ) : (
                        recentOrders.map((order) => (
                          <div
                            key={order.id}
                            className="flex items-center justify-between p-3 rounded-lg border"
                          >
                            <div>
                              <p className="font-medium text-foreground">{order.orderNumber}</p>
                              <p className="text-sm text-muted-foreground">{order.tailorName}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">${Number(order.amount).toFixed(2)}</p>
                              <Badge variant={
                                order.status === "delivered" ? "default" :
                                order.status === "cancelled" ? "destructive" :
                                "secondary"
                              }>
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <AdminUsersTable
                profiles={profiles}
                tailors={tailors}
                userRoles={userRoles}
              />
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <AdminOrdersTable orders={orders} />
            </TabsContent>

            {/* Refunds Tab */}
            <TabsContent value="refunds">
              <AdminRefundsTable refundRequests={refundRequests} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
