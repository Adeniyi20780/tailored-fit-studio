import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type OrderStatus = "pending" | "processing" | "tailoring" | "packaging" | "shipped" | "delivered" | "completed" | "cancelled";

export interface OrderWithDetails {
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
  customer_id: string | null;
  product_id: string | null;
  measurement_id: string | null;
  customer_name: string;
  customer_email: string | null;
  product_name: string;
  product_category: string;
}

export const ORDER_STATUSES: { value: OrderStatus; label: string; color: string }[] = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "processing", label: "Processing", color: "bg-blue-100 text-blue-800" },
  { value: "tailoring", label: "Tailoring", color: "bg-purple-100 text-purple-800" },
  { value: "packaging", label: "Packaging", color: "bg-indigo-100 text-indigo-800" },
  { value: "shipped", label: "Shipped", color: "bg-cyan-100 text-cyan-800" },
  { value: "delivered", label: "Delivered", color: "bg-teal-100 text-teal-800" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
];

export const getStatusColor = (status: string) => {
  const statusConfig = ORDER_STATUSES.find(s => s.value === status);
  return statusConfig?.color || "bg-gray-100 text-gray-800";
};

export const useStoreOrders = (statusFilter?: string, searchQuery?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  // Fetch all orders for this tailor
  const { data: rawOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["store-all-orders", tailor?.id],
    queryFn: async () => {
      if (!tailor?.id) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("tailor_id", tailor.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tailor?.id,
  });

  // Fetch products for this tailor
  const { data: products } = useQuery({
    queryKey: ["store-products", tailor?.id],
    queryFn: async () => {
      if (!tailor?.id) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category")
        .eq("tailor_id", tailor.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!tailor?.id,
  });

  // Fetch customer profiles
  const { data: customerProfiles } = useQuery({
    queryKey: ["store-customers", rawOrders?.map((o) => o.customer_id)],
    queryFn: async () => {
      if (!rawOrders || rawOrders.length === 0) return [];
      const customerIds = [...new Set(rawOrders.map((o) => o.customer_id).filter(Boolean))];
      if (customerIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", customerIds);
      if (error) throw error;
      return data || [];
    },
    enabled: !!rawOrders && rawOrders.length > 0,
  });

  // Transform orders with details
  const orders: OrderWithDetails[] = (rawOrders || []).map((order) => {
    const customer = customerProfiles?.find((p) => p.user_id === order.customer_id);
    const product = products?.find((p) => p.id === order.product_id);
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
      customer_id: order.customer_id,
      product_id: order.product_id,
      measurement_id: order.measurement_id,
      customer_name: customer?.full_name || "Unknown Customer",
      customer_email: customer?.email || null,
      product_name: product?.name || "Unknown Product",
      product_category: product?.category || "Unknown",
    };
  });

  // Apply filters
  const filteredOrders = orders.filter((order) => {
    // Status filter
    if (statusFilter && statusFilter !== "all" && order.status !== statusFilter) {
      return false;
    }
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.order_number.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        order.product_name.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, notes }: { orderId: string; status: string; notes?: string }) => {
      const updateData: { status: string; notes?: string } = { status };
      if (notes !== undefined) {
        updateData.notes = notes;
      }
      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-all-orders"] });
      toast.success("Order status updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update order status");
      console.error("Update error:", error);
    },
  });

  // Update estimated delivery
  const updateDeliveryMutation = useMutation({
    mutationFn: async ({ orderId, estimatedDelivery }: { orderId: string; estimatedDelivery: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ estimated_delivery: estimatedDelivery })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-all-orders"] });
      toast.success("Estimated delivery updated");
    },
    onError: (error) => {
      toast.error("Failed to update delivery date");
      console.error("Update error:", error);
    },
  });

  return {
    tailor,
    orders: filteredOrders,
    allOrders: orders,
    isLoading: ordersLoading,
    updateStatus: updateStatusMutation.mutate,
    updateDelivery: updateDeliveryMutation.mutate,
    isUpdating: updateStatusMutation.isPending || updateDeliveryMutation.isPending,
  };
};
