import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface RefundRequest {
  id: string;
  order_id: string;
  customer_id: string;
  tailor_id: string;
  amount: number;
  reason: string;
  status: string;
  refund_type: string;
  admin_notes: string | null;
  tailor_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
}

interface AdminRefundsTableProps {
  refundRequests: RefundRequest[];
  currentAdminLevel: number | null;
}

const refundRequestsTable = () => supabase.from("refund_requests" as any);
const walletsTable = () => supabase.from("wallets" as any);
const walletTransactionsTable = () => supabase.from("wallet_transactions" as any);

const AdminRefundsTable = ({ refundRequests, currentAdminLevel }: AdminRefundsTableProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  // Process refund mutation
  const processRefund = useMutation({
    mutationFn: async ({
      refundId,
      status,
      notes,
      customerId,
      amount,
      refundType,
    }: {
      refundId: string;
      status: "approved" | "rejected";
      notes: string;
      customerId: string;
      amount: number;
      refundType: string;
    }) => {
      if (!user) throw new Error("Must be logged in");

      // Update refund request
      const { error: updateError } = await refundRequestsTable()
        .update({
          status: status === "approved" ? "processed" : "rejected",
          admin_notes: notes,
          processed_by: user.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", refundId);

      if (updateError) throw updateError;

      // If approved and wallet refund, add to customer wallet
      if (status === "approved" && refundType === "wallet") {
        // Get customer wallet
        const { data: wallet, error: walletError } = await walletsTable()
          .select("*")
          .eq("user_id", customerId)
          .maybeSingle();

        if (walletError) throw walletError;

        if (wallet) {
          // Update wallet balance
          const { error: balanceError } = await walletsTable()
            .update({ balance: (wallet as any).balance + amount })
            .eq("id", (wallet as any).id);

          if (balanceError) throw balanceError;

          // Create transaction record
          const { error: txError } = await walletTransactionsTable()
            .insert({
              wallet_id: (wallet as any).id,
              amount,
              type: "refund",
              description: `Admin refund processed`,
            });

          if (txError) throw txError;
        }
      }
    },
    onSuccess: (_, variables) => {
      toast.success(`Refund ${variables.status === "approved" ? "approved and processed" : "rejected"}`);
      queryClient.invalidateQueries({ queryKey: ["admin-refund-requests"] });
      setSelectedRefund(null);
      setAdminNotes("");
    },
    onError: (error) => {
      console.error("Error processing refund:", error);
      toast.error("Failed to process refund");
    },
  });

  // Filter refunds
  const filteredRefunds = refundRequests.filter((refund) => {
    const matchesSearch =
      !searchQuery ||
      refund.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      refund.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || refund.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "processed":
        return "default" as const;
      case "approved":
        return "secondary" as const;
      case "rejected":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processed":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const statuses = ["all", "pending", "approved", "processed", "rejected"];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Refund Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "all" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[120px]">{currentAdminLevel !== 3 ? "Actions" : "View"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRefunds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No refund requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRefunds.map((refund) => (
                    <TableRow key={refund.id}>
                      <TableCell className="font-mono text-sm">
                        {refund.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${Number(refund.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {refund.refund_type === "wallet" ? "Wallet Credit" : "Original Payment"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {refund.reason}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(refund.status)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(refund.status)}
                          {refund.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(refund.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {refund.status === "pending" && currentAdminLevel !== 3 ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRefund(refund);
                              setAdminNotes("");
                            }}
                          >
                            Review
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRefund(refund);
                              setAdminNotes(refund.admin_notes || "");
                            }}
                          >
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredRefunds.length} of {refundRequests.length} refund requests
          </div>
        </CardContent>
      </Card>

      {/* Review/View Refund Modal */}
      <Dialog open={!!selectedRefund} onOpenChange={() => setSelectedRefund(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedRefund?.status === "pending" ? "Review Refund Request" : "Refund Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-semibold text-lg">
                    ${Number(selectedRefund.amount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Refund Type</p>
                  <Badge variant="outline">
                    {selectedRefund.refund_type === "wallet" ? "Wallet Credit" : "Original Payment"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusBadgeVariant(selectedRefund.status)}>
                    {selectedRefund.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requested</p>
                  <p className="font-medium">
                    {format(new Date(selectedRefund.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Reason</p>
                <p className="p-3 bg-muted rounded-lg">{selectedRefund.reason}</p>
              </div>

              {selectedRefund.tailor_notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tailor Notes</p>
                  <p className="p-3 bg-muted rounded-lg">{selectedRefund.tailor_notes}</p>
                </div>
              )}

              {selectedRefund.status === "pending" && currentAdminLevel !== 3 ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Admin Notes</p>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this refund decision..."
                    rows={3}
                  />
                </div>
              ) : selectedRefund.admin_notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Admin Notes</p>
                  <p className="p-3 bg-muted rounded-lg">{selectedRefund.admin_notes}</p>
                </div>
              )}

              {selectedRefund.processed_at && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Processed on {format(new Date(selectedRefund.processed_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              )}
            </div>
          )}
          {selectedRefund?.status === "pending" && currentAdminLevel !== 3 && (
            <DialogFooter className="gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  processRefund.mutate({
                    refundId: selectedRefund.id,
                    status: "rejected",
                    notes: adminNotes,
                    customerId: selectedRefund.customer_id,
                    amount: selectedRefund.amount,
                    refundType: selectedRefund.refund_type,
                  });
                }}
                disabled={processRefund.isPending}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => {
                  processRefund.mutate({
                    refundId: selectedRefund.id,
                    status: "approved",
                    notes: adminNotes,
                    customerId: selectedRefund.customer_id,
                    amount: selectedRefund.amount,
                    refundType: selectedRefund.refund_type,
                  });
                }}
                disabled={processRefund.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve & Process
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminRefundsTable;
