import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Calendar, MapPin, Store, Palette, Ruler } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomerOrder } from "@/hooks/useCustomerOrders";
import OrderStatusTracker from "./OrderStatusTracker";

interface CustomerOrderDetailsModalProps {
  order: CustomerOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "processing":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "tailoring":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    case "packaging":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400";
    case "shipped":
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400";
    case "delivered":
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
};

const CustomerOrderDetailsModal = ({
  order,
  open,
  onOpenChange,
}: CustomerOrderDetailsModalProps) => {
  if (!order) return null;

  const shippingAddress = order.shipping_address as Record<string, string> | null;
  const customizations = order.customizations as Record<string, unknown> | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order {order.order_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Status Tracker */}
          <div className="bg-muted/30 rounded-lg p-4">
            <OrderStatusTracker currentStatus={order.status} />
          </div>

          {/* Order Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={cn(getStatusBadgeColor(order.status), "text-sm")}>
                {order.status.replace(/_/g, " ")}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-semibold text-lg">
                {order.currency} {order.total_amount.toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p className="font-medium">
                {format(new Date(order.created_at), "MMM dd, yyyy 'at' HH:mm")}
              </p>
            </div>
            {order.estimated_delivery && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Estimated Delivery
                </p>
                <p className="font-medium">
                  {format(new Date(order.estimated_delivery), "MMM dd, yyyy")}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Product Info */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Product Details
            </h4>
            <div className="flex items-start gap-4">
              {/* Product Image */}
              <div className="w-24 h-24 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                {order.product_image ? (
                  <img
                    src={order.product_image}
                    alt={order.product_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div>
                  <p className="font-semibold">{order.product_name}</p>
                  <p className="text-sm text-muted-foreground">{order.product_category}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Store className="h-4 w-4" />
                  <span>{order.tailor_name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customizations */}
          {customizations && Object.keys(customizations).length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Customizations
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(customizations).map(([key, value]) => (
                    <div key={key} className="bg-muted/50 rounded-md p-3">
                      <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
                      <p className="font-medium text-sm">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Shipping Address */}
          {shippingAddress && Object.keys(shippingAddress).length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Shipping Address
                </h4>
                <div className="bg-muted/50 rounded-md p-4">
                  {shippingAddress.name && <p className="font-medium">{shippingAddress.name}</p>}
                  <p>{shippingAddress.street || shippingAddress.address}</p>
                  <p>
                    {[shippingAddress.city, shippingAddress.state, shippingAddress.zip]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p>{shippingAddress.country}</p>
                  {shippingAddress.phone && (
                    <p className="text-sm text-muted-foreground mt-2">Phone: {shippingAddress.phone}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {order.notes && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Order Notes
                </h4>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                  {order.notes}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerOrderDetailsModal;
