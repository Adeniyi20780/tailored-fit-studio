import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

export interface AdminStats {
  totalUsers: number;
  totalTailors: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  pendingRefunds: number;
}

export interface RevenueTrend {
  date: string;
  revenue: number;
  orders: number;
}

export interface OrderStatusDistribution {
  status: string;
  count: number;
}

export const useAdminAnalytics = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  // Fetch all users (profiles)
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && isAdmin(),
  });

  // Fetch all tailors
  const { data: tailors, isLoading: tailorsLoading } = useQuery({
    queryKey: ["admin-tailors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tailors")
        .select("*");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && isAdmin(),
  });

  // Fetch all orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, products(*), tailors(store_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && isAdmin(),
  });

  // Fetch all products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && isAdmin(),
  });

  // Fetch all refund requests
  const { data: refundRequests, isLoading: refundsLoading } = useQuery({
    queryKey: ["admin-refund-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refund_requests" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && isAdmin(),
  });

  // Fetch all user roles
  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && isAdmin(),
  });

  // Calculate stats
  const stats: AdminStats = {
    totalUsers: profiles?.length || 0,
    totalTailors: tailors?.length || 0,
    totalOrders: orders?.length || 0,
    totalRevenue: orders?.filter(o => o.status !== "cancelled" && o.status !== "refunded")
      .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0,
    totalProducts: products?.length || 0,
    pendingRefunds: (refundRequests as any[] || []).filter((r: any) => r.status === "pending").length,
  };

  // Calculate revenue trends (last 30 days)
  const revenueTrends: RevenueTrend[] = [];
  if (orders) {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const dailyData: Record<string, { revenue: number; orders: number }> = {};
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dailyData[dateStr] = { revenue: 0, orders: 0 };
    }

    orders.forEach((order) => {
      const orderDate = new Date(order.created_at).toISOString().split("T")[0];
      if (dailyData[orderDate] && order.status !== "cancelled" && order.status !== "refunded") {
        dailyData[orderDate].revenue += Number(order.total_amount);
        dailyData[orderDate].orders += 1;
      }
    });

    Object.entries(dailyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([date, data]) => {
        revenueTrends.push({ date, ...data });
      });
  }

  // Calculate order status distribution
  const orderStatusDistribution: OrderStatusDistribution[] = [];
  if (orders) {
    const statusCounts: Record<string, number> = {};
    orders.forEach((order) => {
      const status = order.status || "pending";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      orderStatusDistribution.push({ status, count });
    });
  }

  // Recent orders (last 10)
  const recentOrders = orders?.slice(0, 10).map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    customerEmail: order.customer_id,
    tailorName: order.tailors?.store_name || "Unknown",
    productName: order.products?.name || "Unknown",
    amount: order.total_amount,
    status: order.status,
    createdAt: order.created_at,
  })) || [];

  return {
    stats,
    revenueTrends,
    orderStatusDistribution,
    recentOrders,
    profiles: profiles || [],
    tailors: tailors || [],
    orders: orders || [],
    products: products || [],
    refundRequests: (refundRequests as any[] || []),
    userRoles: userRoles || [],
    isLoading: profilesLoading || tailorsLoading || ordersLoading || productsLoading || refundsLoading || rolesLoading,
  };
};
