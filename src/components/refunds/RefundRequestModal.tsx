import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRefundRequests } from "@/hooks/useRefundRequests";
import { AlertCircle, Wallet, CreditCard } from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  tailor_id: string;
  status: string;
}

interface RefundRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

const RefundRequestModal = ({ open, onOpenChange, order }: RefundRequestModalProps) => {
  const { createRefundRequest, isCreatingRefund } = useRefundRequests();
  const [reason, setReason] = useState("");
  const [refundType, setRefundType] = useState<"wallet" | "original_payment">("wallet");

  const handleSubmit = () => {
    if (!order || !reason.trim()) return;

    createRefundRequest({
      orderId: order.id,
      tailorId: order.tailor_id,
      amount: order.total_amount,
      reason: reason.trim(),
      refundType,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setReason("");
        setRefundType("wallet");
      },
    });
  };

  const canRequestRefund = order && ["delivered", "shipped", "in_progress"].includes(order.status || "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Refund</DialogTitle>
        </DialogHeader>

        {order && (
          <div className="space-y-6">
            {/* Order Info */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Order</p>
              <p className="font-semibold">{order.order_number}</p>
              <p className="text-lg font-bold mt-1">
                ${Number(order.total_amount).toFixed(2)}
              </p>
            </div>

            {!canRequestRefund && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 text-destructive rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Refund not available</p>
                  <p className="text-sm">
                    Refunds can only be requested for orders that are in progress, shipped, or delivered.
                  </p>
                </div>
              </div>
            )}

            {canRequestRefund && (
              <>
                {/* Refund Type */}
                <div className="space-y-3">
                  <Label>Refund Method</Label>
                  <RadioGroup
                    value={refundType}
                    onValueChange={(value) => setRefundType(value as typeof refundType)}
                  >
                    <div className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="wallet" id="wallet" className="mt-1" />
                      <label htmlFor="wallet" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4" />
                          <span className="font-medium">Wallet Credit</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Receive store credit instantly. Use it for future purchases.
                        </p>
                      </label>
                    </div>
                    <div className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="original_payment" id="original" className="mt-1" />
                      <label htmlFor="original" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span className="font-medium">Original Payment Method</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Refund to your original payment method. May take 5-10 business days.
                        </p>
                      </label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Refund</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please explain why you're requesting a refund..."
                    rows={4}
                  />
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {canRequestRefund && (
            <Button
              onClick={handleSubmit}
              disabled={!reason.trim() || isCreatingRefund}
            >
              {isCreatingRefund ? "Submitting..." : "Submit Request"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RefundRequestModal;
