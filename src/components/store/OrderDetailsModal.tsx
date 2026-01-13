import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Package, User, MapPin, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderWithDetails, ORDER_STATUSES, getStatusColor } from "@/hooks/useStoreOrders";

interface OrderDetailsModalProps {
  order: OrderWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (orderId: string, status: string, notes?: string) => void;
  onUpdateDelivery: (orderId: string, estimatedDelivery: string) => void;
  isUpdating: boolean;
}

const OrderDetailsModal = ({
  order,
  open,
  onOpenChange,
  onUpdateStatus,
  onUpdateDelivery,
  isUpdating,
}: OrderDetailsModalProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);

  // Reset state when order changes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && order) {
      setSelectedStatus(order.status);
      setNotes(order.notes || "");
      setDeliveryDate(order.estimated_delivery ? new Date(order.estimated_delivery) : undefined);
    }
    onOpenChange(isOpen);
  };

  const handleUpdateStatus = () => {
    if (order && selectedStatus) {
      onUpdateStatus(order.id, selectedStatus, notes);
    }
  };

  const handleUpdateDelivery = () => {
    if (order && deliveryDate) {
      onUpdateDelivery(order.id, format(deliveryDate, "yyyy-MM-dd"));
    }
  };

  if (!order) return null;

  const shippingAddress = order.shipping_address as Record<string, string> | null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order {order.order_number}
          </DialogTitle>
          <DialogDescription>
            View and manage order details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={cn(getStatusColor(order.status), "text-sm")}>
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
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {format(new Date(order.updated_at), "MMM dd, yyyy 'at' HH:mm")}
              </p>
            </div>
          </div>

          <Separator />

          {/* Customer Info */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Information
            </h4>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{order.customer_name}</p>
              </div>
              {order.customer_email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{order.customer_email}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Product Info */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Product Details
            </h4>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <p className="text-sm text-muted-foreground">Product</p>
                <p className="font-medium">{order.product_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{order.product_category}</p>
              </div>
            </div>
            {order.customizations && Object.keys(order.customizations).length > 0 && (
              <div className="pl-6">
                <p className="text-sm text-muted-foreground mb-1">Customizations</p>
                <div className="bg-muted/50 rounded-md p-3 text-sm">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(order.customizations, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Shipping Address */}
          {shippingAddress && Object.keys(shippingAddress).length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Shipping Address
                </h4>
                <div className="pl-6 bg-muted/50 rounded-md p-3">
                  <p>{shippingAddress.street || shippingAddress.address}</p>
                  <p>
                    {[shippingAddress.city, shippingAddress.state, shippingAddress.zip]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p>{shippingAddress.country}</p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Update Status Section */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Update Order
            </h4>

            <div className="grid gap-4">
              {/* Status Update */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              status.color.replace("text-", "bg-").split(" ")[0]
                            )}
                          />
                          {status.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Estimated Delivery */}
              <div className="space-y-2">
                <Label>Estimated Delivery</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !deliveryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deliveryDate ? format(deliveryDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deliveryDate}
                      onSelect={setDeliveryDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes about this order..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleUpdateStatus}
                disabled={isUpdating || selectedStatus === order.status}
              >
                {isUpdating ? "Updating..." : "Update Status"}
              </Button>
              {deliveryDate && (
                <Button
                  variant="outline"
                  onClick={handleUpdateDelivery}
                  disabled={isUpdating}
                >
                  Update Delivery Date
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsModal;
