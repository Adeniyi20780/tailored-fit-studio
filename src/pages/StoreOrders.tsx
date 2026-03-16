import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Clock, CheckCircle, XCircle, Truck, AlertCircle, ArrowLeft } from "lucide-react";
import { useStoreOrders, OrderWithDetails, ORDER_STATUSES } from "@/hooks/useStoreOrders";
import OrdersTable from "@/components/store/OrdersTable";
import OrdersFilters from "@/components/store/OrdersFilters";
import OrderDetailsModal from "@/components/store/OrderDetailsModal";

const StoreOrders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    tailor,
    orders,
    allOrders,
    isLoading,
    updateStatus,
    updateDelivery,
    isUpdating,
  } = useStoreOrders(statusFilter, searchQuery);

  const handleViewOrder = (order: OrderWithDetails) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleQuickStatusChange = (orderId: string, status: string) => {
    updateStatus({ orderId, status });
  };

  const handleUpdateStatus = (orderId: string, status: string, notes?: string, sendWhatsApp?: boolean) => {
    updateStatus({ orderId, status, notes, sendWhatsApp });
  };

  const handleUpdateDelivery = (orderId: string, estimatedDelivery: string) => {
    updateDelivery({ orderId, estimatedDelivery });
  };

  // Calculate quick stats
  const stats = {
    total: allOrders.length,
    pending: allOrders.filter((o) => o.status === "pending").length,
    inProgress: allOrders.filter((o) => 
      ["processing", "tailoring", "packaging"].includes(o.status)
    ).length,
    shipped: allOrders.filter((o) => o.status === "shipped").length,
    completed: allOrders.filter((o) => ["delivered", "completed"].includes(o.status)).length,
    cancelled: allOrders.filter((o) => o.status === "cancelled").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Orders Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all customer orders for {tailor?.store_name || "your store"}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-8">
          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setStatusFilter("all")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-yellow-500 transition-colors"
            onClick={() => setStatusFilter("pending")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                Pending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => setStatusFilter("processing")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                In Progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-cyan-500 transition-colors"
            onClick={() => setStatusFilter("shipped")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-cyan-600" />
                Shipped
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-cyan-600">{stats.shipped}</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-green-500 transition-colors"
            onClick={() => setStatusFilter("completed")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-red-500 transition-colors"
            onClick={() => setStatusFilter("cancelled")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Cancelled
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Orders Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>All Orders</CardTitle>
                <CardDescription>
                  {orders.length} order{orders.length !== 1 ? "s" : ""} 
                  {statusFilter !== "all" && ` • Filtered by ${statusFilter}`}
                </CardDescription>
              </div>
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="self-start">
                  Showing: {ORDER_STATUSES.find(s => s.value === statusFilter)?.label}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <OrdersFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />

            {/* Orders Table */}
            <OrdersTable
              orders={orders}
              isLoading={isLoading}
              onViewOrder={handleViewOrder}
              onQuickStatusChange={handleQuickStatusChange}
            />
          </CardContent>
        </Card>

        {/* Order Details Modal */}
        <OrderDetailsModal
          order={selectedOrder}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onUpdateStatus={handleUpdateStatus}
          onUpdateDelivery={handleUpdateDelivery}
          isUpdating={isUpdating}
        />
      </div>
    </div>
  );
};

export default StoreOrders;
