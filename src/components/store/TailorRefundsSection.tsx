import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useTailorRefunds, RefundRequest } from "@/hooks/useRefundRequests";

interface TailorRefundsSectionProps {
  tailorId: string;
}

const TailorRefundsSection = ({ tailorId }: TailorRefundsSectionProps) => {
  const { tailorRefunds, isLoading, processRefund, isProcessing } = useTailorRefunds(tailorId);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [notes, setNotes] = useState("");

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

  const pendingCount = tailorRefunds?.filter(r => r.status === "pending").length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Refund Requests
            {pendingCount > 0 && (
              <Badge variant="destructive">{pendingCount} pending</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!tailorRefunds || tailorRefunds.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No refund requests yet</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tailorRefunds.map((refund) => (
                    <TableRow key={refund.id}>
                      <TableCell className="font-semibold">
                        ${Number(refund.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {refund.refund_type === "wallet" ? "Wallet" : "Payment"}
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
                        {format(new Date(refund.created_at), "MMM d")}
                      </TableCell>
                      <TableCell>
                        {refund.status === "pending" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRefund(refund);
                              setNotes("");
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
                              setNotes(refund.tailor_notes || "");
                            }}
                          >
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review/View Modal */}
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
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Customer's Reason</p>
                <p className="p-3 bg-muted rounded-lg">{selectedRefund.reason}</p>
              </div>

              {selectedRefund.status === "pending" ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Your Notes (optional)</p>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this refund decision..."
                    rows={3}
                  />
                </div>
              ) : selectedRefund.tailor_notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Your Notes</p>
                  <p className="p-3 bg-muted rounded-lg">{selectedRefund.tailor_notes}</p>
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
          {selectedRefund?.status === "pending" && (
            <DialogFooter className="gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  processRefund({
                    refundId: selectedRefund.id,
                    status: "rejected",
                    notes,
                    customerId: selectedRefund.customer_id,
                    amount: selectedRefund.amount,
                    refundType: selectedRefund.refund_type as "wallet" | "original_payment",
                  });
                  setSelectedRefund(null);
                }}
                disabled={isProcessing}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => {
                  processRefund({
                    refundId: selectedRefund.id,
                    status: "approved",
                    notes,
                    customerId: selectedRefund.customer_id,
                    amount: selectedRefund.amount,
                    refundType: selectedRefund.refund_type as "wallet" | "original_payment",
                  });
                  setSelectedRefund(null);
                }}
                disabled={isProcessing}
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

export default TailorRefundsSection;
