import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";

interface RecentOrder {
  id: string;
  order_number: string;
  product_name: string;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
}

interface RecentCustomerOrdersProps {
  orders: RecentOrder[];
  isLoading: boolean;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  tailoring: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  packaging: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  shipped: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const RecentCustomerOrders = ({ orders, isLoading }: RecentCustomerOrdersProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Your latest purchases</CardDescription>
          </div>
          <Link to="/my-orders">
            <Button variant="outline" size="sm">
              View All
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex justify-between items-center">
                <div className="space-y-2">
                  <div className="bg-muted h-4 rounded w-32"></div>
                  <div className="bg-muted h-3 rounded w-24"></div>
                </div>
                <div className="bg-muted h-6 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground mb-4">No orders yet</p>
            <Link to="/catalog">
              <Button>Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order.id} to={`/order/${order.id}`}>
                <div className="flex items-center justify-between p-3 rounded-lg border hover:border-accent/50 transition-colors cursor-pointer">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{order.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      #{order.order_number} • {format(new Date(order.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-primary">
                      ${order.total_amount.toFixed(2)}
                    </span>
                    <Badge className={statusColors[order.status] || statusColors.pending}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentCustomerOrders;
