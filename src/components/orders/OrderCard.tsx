import { format } from "date-fns";
import { Package, Calendar, MapPin, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CustomerOrder } from "@/hooks/useCustomerOrders";
import OrderStatusTracker from "./OrderStatusTracker";

interface OrderCardProps {
  order: CustomerOrder;
  onClick: () => void;
  showTracker?: boolean;
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

const OrderCard = ({ order, onClick, showTracker = true }: OrderCardProps) => {
  const shippingAddress = order.shipping_address as Record<string, string> | null;

  return (
    <Card 
      className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            {/* Product Image */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
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

            {/* Order Info */}
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">{order.product_name}</h3>
              <p className="text-sm text-muted-foreground">{order.tailor_name}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {order.order_number}
                </Badge>
                <Badge className={cn("text-xs", getStatusBadgeColor(order.status))}>
                  {order.status.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
          </div>

          {/* Price & Arrow */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="font-bold text-lg">{order.currency} {order.total_amount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(order.created_at), "MMM dd, yyyy")}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>

        {/* Status Tracker */}
        {showTracker && !["cancelled", "delivered", "completed"].includes(order.status) && (
          <div className="mt-4 pt-4 border-t">
            <OrderStatusTracker currentStatus={order.status} />
          </div>
        )}

        {/* Delivery Info */}
        {order.estimated_delivery && (
          <div className="mt-4 pt-4 border-t flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Est. Delivery: </span>
              <span className="font-medium text-foreground">
                {format(new Date(order.estimated_delivery), "MMM dd, yyyy")}
              </span>
            </div>
          </div>
        )}

        {/* Shipping Address Preview */}
        {shippingAddress && shippingAddress.city && (
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {[shippingAddress.city, shippingAddress.country].filter(Boolean).join(", ")}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderCard;
