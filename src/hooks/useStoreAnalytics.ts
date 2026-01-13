import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export const useStoreAnalytics = () => {
  const { user } = useAuth();

  // Get tailor ID for the current user
  const { data: tailor } = useQuery({
    queryKey: ["tailor", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("tailors")
        .select("id, store_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch orders with related data
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["store-orders", tailor?.id],
    queryFn: async () => {
      if (!tailor?.id) return [];
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          total_amount,
          currency,
          status,
          created_at,
          customer_id,
          product_id
        `)
        .eq("tailor_id", tailor.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tailor?.id,
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ["store-products", tailor?.id],
    queryFn: async () => {
      if (!tailor?.id) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, base_price")
        .eq("tailor_id", tailor.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!tailor?.id,
  });

  // Fetch customer profiles for orders
  const { data: customerProfiles } = useQuery({
    queryKey: ["store-customers", orders?.map((o) => o.customer_id)],
    queryFn: async () => {
      if (!orders || orders.length === 0) return [];
      const customerIds = [...new Set(orders.map((o) => o.customer_id).filter(Boolean))];
      if (customerIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", customerIds);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orders && orders.length > 0,
  });

  // Calculate stats
  const stats = {
    totalOrders: orders?.length || 0,
    totalRevenue: orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0,
    completedOrders: orders?.filter((o) => o.status === "completed").length || 0,
    pendingOrders: orders?.filter((o) => o.status === "pending").length || 0,
    inProgressOrders: orders?.filter((o) => ["in_progress", "processing"].includes(o.status)).length || 0,
    cancelledOrders: orders?.filter((o) => o.status === "cancelled").length || 0,
    totalProducts: products?.length || 0,
  };

  // Calculate revenue trends (last 30 days)
  const revenueTrends = (() => {
    if (!orders || orders.length === 0) return [];
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return {
        date: format(date, "MMM dd"),
        start: startOfDay(date),
        end: endOfDay(date),
        revenue: 0,
      };
    });

    orders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      const dayData = last30Days.find(
        (day) => orderDate >= day.start && orderDate <= day.end
      );
      if (dayData && order.status !== "cancelled") {
        dayData.revenue += Number(order.total_amount);
      }
    });

    return last30Days.map(({ date, revenue }) => ({ date, revenue }));
  })();

  // Calculate best selling products
  const bestSellingProducts = (() => {
    if (!orders || !products || orders.length === 0) return [];
    const productSales: Record<string, { name: string; sales: number; revenue: number }> = {};

    orders.forEach((order) => {
      if (order.product_id && order.status !== "cancelled") {
        const product = products.find((p) => p.id === order.product_id);
        if (product) {
          if (!productSales[order.product_id]) {
            productSales[order.product_id] = {
              name: product.name,
              sales: 0,
              revenue: 0,
            };
          }
          productSales[order.product_id].sales += 1;
          productSales[order.product_id].revenue += Number(order.total_amount);
        }
      }
    });

    return Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  })();

  // Customer demographics (orders by category)
  const customerDemographics = (() => {
    if (!orders || !products || orders.length === 0) return [];
    const categoryCounts: Record<string, number> = {};

    orders.forEach((order) => {
      if (order.product_id && order.status !== "cancelled") {
        const product = products.find((p) => p.id === order.product_id);
        if (product) {
          categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
        }
      }
    });

    return Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  })();

  // Format recent orders for display
  const recentOrders = (() => {
    if (!orders || orders.length === 0) return [];
    return orders.slice(0, 10).map((order) => {
      const customer = customerProfiles?.find((p) => p.user_id === order.customer_id);
      const product = products?.find((p) => p.id === order.product_id);
      return {
        id: order.id,
        order_number: order.order_number,
        customer_name: customer?.full_name || "Unknown Customer",
        product_name: product?.name || "Unknown Product",
        total_amount: Number(order.total_amount),
        currency: order.currency || "USD",
        status: order.status || "pending",
        created_at: order.created_at,
      };
    });
  })();

  return {
    tailor,
    stats,
    revenueTrends,
    bestSellingProducts,
    customerDemographics,
    recentOrders,
    isLoading: ordersLoading,
  };
};
