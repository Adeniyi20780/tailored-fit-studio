import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

export interface SpendingByCategory {
  category: string;
  amount: number;
  count: number;
}

export interface MonthlySpending {
  month: string;
  amount: number;
}

export interface RecommendedProduct {
  id: string;
  name: string;
  category: string;
  base_price: number;
  images: string[] | null;
  tailor_name: string;
  tailor_slug: string;
}

export const useCustomerAnalytics = () => {
  const { user } = useAuth();

  // Fetch customer orders with product details
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["customer-analytics-orders", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          total_amount,
          currency,
          status,
          created_at,
          product_id,
          tailor_id,
          products (
            id,
            name,
            category,
            base_price
          )
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Calculate order stats
  const orderStats = {
    totalOrders: orders?.length || 0,
    completedOrders: orders?.filter((o) => o.status === "completed" || o.status === "delivered").length || 0,
    pendingOrders: orders?.filter((o) => o.status === "pending").length || 0,
    inProgressOrders: orders?.filter((o) => ["in_progress", "processing", "tailoring", "packaging", "shipped"].includes(o.status || "")).length || 0,
    totalSpent: orders?.filter((o) => o.status !== "cancelled" && o.status !== "refunded")
      .reduce((sum, order) => sum + Number(order.total_amount), 0) || 0,
    averageOrderValue: 0,
  };
  
  if (orderStats.completedOrders > 0) {
    orderStats.averageOrderValue = orderStats.totalSpent / orderStats.completedOrders;
  }

  // Calculate spending by category
  const spendingByCategory: SpendingByCategory[] = (() => {
    if (!orders || orders.length === 0) return [];
    const categoryMap: Record<string, { amount: number; count: number }> = {};

    orders.forEach((order) => {
      if (order.products && order.status !== "cancelled" && order.status !== "refunded") {
        const category = order.products.category;
        if (!categoryMap[category]) {
          categoryMap[category] = { amount: 0, count: 0 };
        }
        categoryMap[category].amount += Number(order.total_amount);
        categoryMap[category].count += 1;
      }
    });

    return Object.entries(categoryMap)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.amount - a.amount);
  })();

  // Calculate monthly spending (last 12 months)
  const monthlySpending: MonthlySpending[] = (() => {
    if (!orders || orders.length === 0) return [];
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i);
      return {
        month: format(date, "MMM yyyy"),
        start: startOfMonth(date),
        end: endOfMonth(date),
        amount: 0,
      };
    });

    orders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      const monthData = months.find(
        (m) => orderDate >= m.start && orderDate <= m.end
      );
      if (monthData && order.status !== "cancelled" && order.status !== "refunded") {
        monthData.amount += Number(order.total_amount);
      }
    });

    return months.map(({ month, amount }) => ({ month, amount }));
  })();

  // Get favorite categories for recommendations
  const favoriteCategories = spendingByCategory.slice(0, 3).map((s) => s.category);

  // Get tailors the customer has purchased from
  const purchasedTailorIds = [...new Set(orders?.map((o) => o.tailor_id).filter(Boolean) || [])];

  // Fetch recommended products based on purchase history
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ["customer-recommendations", favoriteCategories, purchasedTailorIds],
    queryFn: async () => {
      if (favoriteCategories.length === 0) {
        // If no purchase history, get popular products
        const { data, error } = await supabase
          .from("products")
          .select(`
            id,
            name,
            category,
            base_price,
            images,
            tailors (
              store_name,
              store_slug
            )
          `)
          .eq("is_active", true)
          .limit(6);
        if (error) throw error;
        return (data || []).map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          base_price: p.base_price,
          images: p.images,
          tailor_name: p.tailors?.store_name || "Unknown",
          tailor_slug: p.tailors?.store_slug || "",
        }));
      }

      // Get products from favorite categories that customer hasn't purchased
      const purchasedProductIds = orders?.map((o) => o.product_id).filter(Boolean) || [];
      
      let query = supabase
        .from("products")
        .select(`
          id,
          name,
          category,
          base_price,
          images,
          tailors (
            store_name,
            store_slug
          )
        `)
        .eq("is_active", true)
        .in("category", favoriteCategories)
        .limit(12);

      if (purchasedProductIds.length > 0) {
        query = query.not("id", "in", `(${purchasedProductIds.join(",")})`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).slice(0, 6).map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        base_price: p.base_price,
        images: p.images,
        tailor_name: p.tailors?.store_name || "Unknown",
        tailor_slug: p.tailors?.store_slug || "",
      }));
    },
    enabled: !!user?.id && !ordersLoading,
  });

  // Recent orders for display
  const recentOrders = orders?.slice(0, 5).map((order) => ({
    id: order.id,
    order_number: order.order_number,
    product_name: order.products?.name || "Unknown Product",
    total_amount: Number(order.total_amount),
    currency: order.currency || "USD",
    status: order.status || "pending",
    created_at: order.created_at,
  })) || [];

  return {
    orderStats,
    spendingByCategory,
    monthlySpending,
    recommendations: recommendations || [],
    recentOrders,
    favoriteCategories,
    isLoading: ordersLoading || recommendationsLoading,
  };
};
