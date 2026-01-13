import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  product_name: string;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
}

interface RecentOrdersTableProps {
  orders: Order[];
  isLoading: boolean;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "in_progress":
    case "processing":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "pending":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "cancelled":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
};

const RecentOrdersTable = ({ orders, isLoading }: RecentOrdersTableProps) => {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>Your latest customer orders</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No orders yet. Start promoting your store!
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>{order.product_name}</TableCell>
                  <TableCell>
                    {order.currency} {order.total_amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(order.created_at), "MMM dd, yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentOrdersTable;
