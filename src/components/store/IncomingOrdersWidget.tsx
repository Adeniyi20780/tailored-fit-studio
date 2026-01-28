import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ruler,
  Package,
  ChevronRight,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Expand,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import type { Json } from "@/integrations/supabase/types";

interface OrderWithMeasurements {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total_amount: number;
  currency: string;
  customer_id: string;
  product_id: string;
  measurement_id: string | null;
  customizations: Json | null;
  customer: {
    full_name: string | null;
    email: string | null;
  } | null;
  product: {
    name: string;
    category: string;
  } | null;
  measurements: {
    measurement_name: string | null;
    height: number | null;
    chest: number | null;
    waist: number | null;
    hips: number | null;
    shoulder_width: number | null;
    sleeve_length: number | null;
    inseam: number | null;
    neck: number | null;
    unit: string | null;
    additional_measurements: Json | null;
  } | null;
}

interface IncomingOrdersWidgetProps {
  tailorId: string;
}

const IncomingOrdersWidget = ({ tailorId }: IncomingOrdersWidgetProps) => {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithMeasurements | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["incoming-orders-with-measurements", tailorId],
    queryFn: async () => {
      // Fetch pending/processing orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("tailor_id", tailorId)
        .in("status", ["pending", "processing", "tailoring"])
        .order("created_at", { ascending: false })
        .limit(10);

      if (ordersError) throw ordersError;

      // Fetch related data
      const customerIds = [...new Set(ordersData?.map((o) => o.customer_id).filter(Boolean))];
      const productIds = [...new Set(ordersData?.map((o) => o.product_id).filter(Boolean))];
      const measurementIds = [...new Set(ordersData?.map((o) => o.measurement_id).filter(Boolean))];

      const [customers, products, measurements] = await Promise.all([
        customerIds.length > 0
          ? supabase.from("profiles").select("user_id, full_name, email").in("user_id", customerIds)
          : { data: [] },
        productIds.length > 0
          ? supabase.from("products").select("id, name, category").in("id", productIds)
          : { data: [] },
        measurementIds.length > 0
          ? supabase.from("customer_measurements").select("*").in("id", measurementIds)
          : { data: [] },
      ]);

      return (ordersData || []).map((order): OrderWithMeasurements => ({
        id: order.id,
        order_number: order.order_number,
        status: order.status || "pending",
        created_at: order.created_at,
        total_amount: order.total_amount,
        currency: order.currency || "USD",
        customer_id: order.customer_id || "",
        product_id: order.product_id || "",
        measurement_id: order.measurement_id,
        customizations: order.customizations,
        customer: customers.data?.find((c) => c.user_id === order.customer_id) || null,
        product: products.data?.find((p) => p.id === order.product_id) || null,
        measurements: measurements.data?.find((m) => m.id === order.measurement_id) || null,
      }));
    },
    enabled: !!tailorId,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "processing":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processing</Badge>;
      case "tailoring":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Tailoring</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatMeasurement = (value: number | null, unit: string | null) => {
    if (value === null) return "—";
    return `${value} ${unit || "cm"}`;
  };

  const getAdditionalMeasurement = (additional: Json | null, key: string): number | null => {
    if (!additional || typeof additional !== "object" || Array.isArray(additional)) return null;
    const value = (additional as Record<string, unknown>)[key];
    return typeof value === "number" ? value : null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Ruler className="w-5 h-5 text-primary" />
            Incoming Orders with Measurements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Ruler className="w-5 h-5 text-primary" />
            Incoming Orders with Measurements
          </CardTitle>
          <CardDescription>
            Orders ready for production with pre-filled AI scan data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!orders || orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No incoming orders at the moment</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {orders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{order.order_number}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.product?.name || "Unknown Product"}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {order.customer?.full_name || "Unknown"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(order.created_at), "MMM d, h:mm a")}
                      </span>
                    </div>

                    {/* Measurements Preview */}
                    {order.measurements ? (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span className="text-xs font-medium text-success">
                            AI Measurements Available
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="text-center p-2 bg-muted/50 rounded">
                            <p className="text-xs text-muted-foreground">Chest</p>
                            <p className="text-sm font-medium">
                              {formatMeasurement(order.measurements.chest, order.measurements.unit)}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded">
                            <p className="text-xs text-muted-foreground">Waist</p>
                            <p className="text-sm font-medium">
                              {formatMeasurement(order.measurements.waist, order.measurements.unit)}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded">
                            <p className="text-xs text-muted-foreground">Shoulder</p>
                            <p className="text-sm font-medium">
                              {formatMeasurement(order.measurements.shoulder_width, order.measurements.unit)}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded">
                            <p className="text-xs text-muted-foreground">Sleeve</p>
                            <p className="text-sm font-medium">
                              {formatMeasurement(order.measurements.sleeve_length, order.measurements.unit)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            No AI measurements—manual entry required
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Detailed Measurement Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order {selectedOrder.order_number}
                </DialogTitle>
                <DialogDescription>
                  {selectedOrder.product?.name} • {selectedOrder.customer?.full_name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-medium">
                      {selectedOrder.currency} {selectedOrder.total_amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Email</p>
                    <p className="text-sm">{selectedOrder.customer?.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="text-sm">
                      {format(new Date(selectedOrder.created_at), "MMMM d, yyyy h:mm a")}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Measurements Section */}
                {selectedOrder.measurements ? (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Ruler className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">AI Body Measurements</h3>
                      <Badge variant="outline" className="text-success border-success">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Pre-filled
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                      {selectedOrder.measurements.measurement_name || "AI Scan"}
                    </p>

                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {[
                        { label: "Height", value: selectedOrder.measurements.height },
                        { label: "Neck", value: selectedOrder.measurements.neck },
                        { label: "Shoulder", value: selectedOrder.measurements.shoulder_width },
                        { label: "Chest", value: selectedOrder.measurements.chest },
                        { label: "Waist", value: selectedOrder.measurements.waist },
                        { label: "Hips", value: selectedOrder.measurements.hips },
                        { label: "Sleeve", value: selectedOrder.measurements.sleeve_length },
                        { label: "Inseam", value: selectedOrder.measurements.inseam },
                      ].map((m) => (
                        <div
                          key={m.label}
                          className="p-3 rounded-lg bg-muted/50 text-center"
                        >
                          <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                          <p className="font-medium">
                            {formatMeasurement(m.value, selectedOrder.measurements?.unit)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Additional Measurements */}
                    {selectedOrder.measurements.additional_measurements && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Additional Measurements</p>
                        <div className="grid grid-cols-4 gap-2">
                          {["bicep", "wrist", "thigh", "calf"].map((key) => {
                            const val = getAdditionalMeasurement(
                              selectedOrder.measurements?.additional_measurements || null,
                              key
                            );
                            return (
                              <div key={key} className="p-2 bg-muted/30 rounded text-center">
                                <p className="text-xs text-muted-foreground capitalize">{key}</p>
                                <p className="text-sm font-medium">
                                  {formatMeasurement(val, selectedOrder.measurements?.unit)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-muted/30 rounded-lg">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium mb-1">No AI Measurements</p>
                    <p className="text-sm text-muted-foreground">
                      This customer hasn't used the AI body scanner. Manual measurements may be required.
                    </p>
                  </div>
                )}

                <Separator />

                {/* Customizations */}
                {selectedOrder.customizations && (
                  <div>
                    <h3 className="font-semibold mb-3">Customizations</h3>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(selectedOrder.customizations, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default IncomingOrdersWidget;
