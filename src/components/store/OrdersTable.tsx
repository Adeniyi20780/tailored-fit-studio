import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { MoreHorizontal, Eye, Edit, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderWithDetails, ORDER_STATUSES, getStatusColor } from "@/hooks/useStoreOrders";

interface OrdersTableProps {
  orders: OrderWithDetails[];
  isLoading: boolean;
  onViewOrder: (order: OrderWithDetails) => void;
  onQuickStatusChange: (orderId: string, status: string) => void;
}

const OrdersTable = ({
  orders,
  isLoading,
  onViewOrder,
  onQuickStatusChange,
}: OrdersTableProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No orders found</p>
        <p className="text-sm">Try adjusting your filters or search query</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Est. Delivery</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow 
              key={order.id} 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onViewOrder(order)}
            >
              <TableCell className="font-medium">{order.order_number}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{order.customer_name}</p>
                  {order.customer_email && (
                    <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p>{order.product_name}</p>
                  <p className="text-xs text-muted-foreground">{order.product_category}</p>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {order.currency} {order.total_amount.toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge className={cn(getStatusColor(order.status), "hover:opacity-80")}>
                  {order.status.replace(/_/g, " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(order.created_at), "MMM dd, yyyy")}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {order.estimated_delivery
                  ? format(new Date(order.estimated_delivery), "MMM dd, yyyy")
                  : "—"}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onViewOrder(order)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Quick Status Change</DropdownMenuLabel>
                    {ORDER_STATUSES.filter((s) => s.value !== order.status).slice(0, 4).map((status) => (
                      <DropdownMenuItem
                        key={status.value}
                        onClick={() => onQuickStatusChange(order.id, status.value)}
                      >
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full mr-2",
                            status.color.split(" ")[0]
                          )}
                        />
                        {status.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrdersTable;
