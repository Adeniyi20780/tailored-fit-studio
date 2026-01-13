import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type OrderStatus = "pending" | "processing" | "tailoring" | "packaging" | "shipped" | "delivered" | "completed" | "cancelled";

export interface CustomerOrder {
  id: string;
  order_number: string;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  estimated_delivery: string | null;
  notes: string | null;
  customizations: Record<string, unknown> | null;
  shipping_address: Record<string, unknown> | null;
  product_id: string | null;
  product_name: string;
  product_category: string;
  product_image: string | null;
  tailor_id: string | null;
  tailor_name: string;
}

export const ORDER_STATUS_STEPS: { value: OrderStatus; label: string; description: string }[] = [
  { value: "pending", label: "Order Placed", description: "Your order has been received" },
  { value: "processing", label: "Processing", description: "Order is being reviewed" },
  { value: "tailoring", label: "Tailoring", description: "Your garment is being crafted" },
  { value: "packaging", label: "Packaging", description: "Preparing for shipment" },
  { value: "shipped", label: "Shipped", description: "On its way to you" },
  { value: "delivered", label: "Delivered", description: "Package has arrived" },
];

export const getStatusIndex = (status: string): number => {
  const index = ORDER_STATUS_STEPS.findIndex(s => s.value === status);
  return index >= 0 ? index : 0;
};

export const useCustomerOrders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch customer's orders
  const { data: rawOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["customer-orders", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch products for the orders
  const productIds = [...new Set((rawOrders || []).map(o => o.product_id).filter(Boolean))];
  const { data: products } = useQuery({
    queryKey: ["customer-order-products", productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, images, tailor_id")
        .in("id", productIds);
      if (error) throw error;
      return data || [];
    },
    enabled: productIds.length > 0,
  });

  // Fetch tailors for the products
  const tailorIds = [...new Set((products || []).map(p => p.tailor_id).filter(Boolean))];
  const { data: tailors } = useQuery({
    queryKey: ["customer-order-tailors", tailorIds],
    queryFn: async () => {
      if (tailorIds.length === 0) return [];
      const { data, error } = await supabase
        .from("tailors")
        .select("id, store_name")
        .in("id", tailorIds);
      if (error) throw error;
      return data || [];
    },
    enabled: tailorIds.length > 0,
  });

  // Set up realtime subscription for order updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('customer-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Order update received:', payload);
          // Invalidate query to refetch orders
          queryClient.invalidateQueries({ queryKey: ["customer-orders", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Transform orders with product and tailor details
  const orders: CustomerOrder[] = (rawOrders || []).map((order) => {
    const product = products?.find(p => p.id === order.product_id);
    const tailor = tailors?.find(t => t.id === product?.tailor_id);
    
    return {
      id: order.id,
      order_number: order.order_number,
      total_amount: Number(order.total_amount),
      currency: order.currency || "USD",
      status: order.status || "pending",
      created_at: order.created_at,
      updated_at: order.updated_at,
      estimated_delivery: order.estimated_delivery,
      notes: order.notes,
      customizations: order.customizations as Record<string, unknown> | null,
      shipping_address: order.shipping_address as Record<string, unknown> | null,
      product_id: order.product_id,
      product_name: product?.name || "Unknown Product",
      product_category: product?.category || "Unknown",
      product_image: product?.images?.[0] || null,
      tailor_id: order.tailor_id,
      tailor_name: tailor?.store_name || "Unknown Tailor",
    };
  });

  // Separate active and completed orders
  const activeOrders = orders.filter(o => 
    !["delivered", "completed", "cancelled"].includes(o.status)
  );
  const completedOrders = orders.filter(o => 
    ["delivered", "completed", "cancelled"].includes(o.status)
  );

  return {
    orders,
    activeOrders,
    completedOrders,
    isLoading: ordersLoading,
  };
};
