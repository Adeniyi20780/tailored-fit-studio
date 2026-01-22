import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format, addDays, differenceInDays } from "date-fns";
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Store,
  Download,
  RefreshCw,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import OrderStatusTracker from "@/components/orders/OrderStatusTracker";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ORDER_STATUS_STEPS, getStatusIndex } from "@/hooks/useCustomerOrders";
import { generateOrderReceipt } from "@/lib/receiptGenerator";

interface OrderDetails {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  estimated_delivery: string | null;
  notes: string | null;
  customizations: Record<string, unknown> | null;
  shipping_address: Record<string, string> | null;
  product: {
    id: string;
    name: string;
    category: string;
    images: string[] | null;
  } | null;
  tailor: {
    id: string;
    store_name: string;
    store_slug: string;
  } | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case "processing":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "tailoring":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    case "packaging":
      return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
    case "shipped":
      return "bg-cyan-500/10 text-cyan-600 border-cyan-500/20";
    case "delivered":
    case "completed":
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "cancelled":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order-tracking", orderId],
    queryFn: async () => {
      if (!orderId || !user) return null;

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("customer_id", user.id)
        .maybeSingle();

      if (orderError) throw orderError;
      if (!orderData) return null;

      // Fetch product details
      let product = null;
      if (orderData.product_id) {
        const { data: productData } = await supabase
          .from("products")
          .select("id, name, category, images")
          .eq("id", orderData.product_id)
          .maybeSingle();
        product = productData;
      }

      // Fetch tailor details
      let tailor = null;
      if (orderData.tailor_id) {
        const { data: tailorData } = await supabase
          .from("tailors")
          .select("id, store_name, store_slug")
          .eq("id", orderData.tailor_id)
          .maybeSingle();
        tailor = tailorData;
      }

      return {
        ...orderData,
        product,
        tailor,
        shipping_address: orderData.shipping_address as Record<string, string> | null,
        customizations: orderData.customizations as Record<string, unknown> | null,
      } as OrderDetails;
    },
    enabled: !!orderId && !!user,
  });

  // Real-time subscription for order updates
  useEffect(() => {
    if (!orderId || !user) return;

    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log("Order update:", payload);
          queryClient.invalidateQueries({ queryKey: ["order-tracking", orderId] });
          toast.success("Order status updated!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, user, queryClient]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["order-tracking", orderId] });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleDownloadReceipt = () => {
    if (!order) return;
    generateOrderReceipt(order);
    toast.success("Receipt downloaded!");
  };

  const getEstimatedDeliveryInfo = () => {
    if (!order) return null;
    
    if (order.estimated_delivery) {
      const deliveryDate = new Date(order.estimated_delivery);
      const daysRemaining = differenceInDays(deliveryDate, new Date());
      return {
        date: deliveryDate,
        daysRemaining: Math.max(0, daysRemaining),
        isPast: daysRemaining < 0,
      };
    }
    
    // Estimate based on order date if no estimated delivery
    const orderDate = new Date(order.created_at);
    const estimatedDate = addDays(orderDate, 14); // Default 14 days
    const daysRemaining = differenceInDays(estimatedDate, new Date());
    
    return {
      date: estimatedDate,
      daysRemaining: Math.max(0, daysRemaining),
      isPast: daysRemaining < 0,
      isEstimate: true,
    };
  };

  if (!user) {
    navigate("/auth?redirect=/my-orders");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-20">
          <div className="container py-8 max-w-4xl">
            <Skeleton className="h-8 w-48 mb-8" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <div className="text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't find this order. It may have been removed or you don't have access to it.
            </p>
            <Button onClick={() => navigate("/my-orders")}>
              View All Orders
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const deliveryInfo = getEstimatedDeliveryInfo();
  const currentStatusIndex = getStatusIndex(order.status);
  const currentStep = ORDER_STATUS_STEPS[currentStatusIndex];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20">
        <div className="container py-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/my-orders")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Order {order.order_number}
                </h1>
                <p className="text-muted-foreground text-sm">
                  Placed on {format(new Date(order.created_at), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" onClick={handleDownloadReceipt}>
                <Download className="w-4 h-4 mr-2" />
                Receipt
              </Button>
            </div>
          </div>

          {/* Status Overview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status === "delivered" || order.status === "completed" ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : order.status === "shipped" ? (
                        <Truck className="w-6 h-6" />
                      ) : (
                        <Package className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <Badge className={`${getStatusColor(order.status)} capitalize text-sm`}>
                        {order.status.replace(/_/g, " ")}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentStep?.description || "Processing your order"}
                      </p>
                    </div>
                  </div>
                  
                  {deliveryInfo && order.status !== "delivered" && order.status !== "completed" && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {deliveryInfo.isEstimate ? "Estimated" : "Expected"} Delivery
                      </p>
                      <p className="text-lg font-semibold">
                        {format(deliveryInfo.date, "MMM d, yyyy")}
                      </p>
                      {deliveryInfo.daysRemaining > 0 && (
                        <p className="text-sm text-accent">
                          {deliveryInfo.daysRemaining} day{deliveryInfo.daysRemaining !== 1 ? "s" : ""} remaining
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                {/* Progress Tracker */}
                <OrderStatusTracker currentStatus={order.status} />
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Product Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="w-5 h-5" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {order.product?.images?.[0] ? (
                      <img
                        src={order.product.images[0]}
                        alt={order.product?.name || "Product"}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold">
                        {order.product?.name || "Custom Product"}
                      </h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {order.product?.category || "Category"}
                      </p>
                      {order.tailor && (
                        <Link 
                          to={`/tailor/${order.tailor.store_slug}`}
                          className="text-sm text-accent hover:underline flex items-center gap-1 mt-1"
                        >
                          <Store className="w-3 h-3" />
                          {order.tailor.store_name}
                        </Link>
                      )}
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span className="text-xl font-bold">
                      {order.currency} {order.total_amount.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Shipping Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="w-5 h-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order.shipping_address ? (
                    <div className="space-y-1">
                      <p className="font-medium">{order.shipping_address.fullName}</p>
                      <p className="text-muted-foreground">{order.shipping_address.address}</p>
                      <p className="text-muted-foreground">
                        {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postalCode}
                      </p>
                      <p className="text-muted-foreground">{order.shipping_address.country}</p>
                      {order.shipping_address.phone && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Phone: {order.shipping_address.phone}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No shipping address provided</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5" />
                    Order Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderTimeline orderId={order.id} />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Notes & Customizations */}
          {(order.notes || (order.customizations && Object.keys(order.customizations).length > 0)) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.customizations && Object.keys(order.customizations).length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Customizations</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(order.customizations).map(([key, value]) => (
                          <div key={key} className="bg-muted/50 rounded-md p-2">
                            <p className="text-xs text-muted-foreground capitalize">
                              {key.replace(/_/g, " ")}
                            </p>
                            <p className="text-sm font-medium">
                              {typeof value === 'object' && value !== null 
                                ? (value as any).name || JSON.stringify(value)
                                : String(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {order.notes && (
                    <div>
                      <h4 className="font-medium mb-2">Order Notes</h4>
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                        {order.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
