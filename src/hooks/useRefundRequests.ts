import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface RefundRequest {
  id: string;
  order_id: string;
  customer_id: string;
  tailor_id: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "processed";
  refund_type: "wallet" | "original_payment";
  admin_notes: string | null;
  tailor_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

const refundRequestsTable = () => supabase.from("refund_requests");
const walletsTable = () => supabase.from("wallets");
const walletTransactionsTable = () => supabase.from("wallet_transactions");

export const useRefundRequests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch customer's refund requests
  const { data: customerRefunds, isLoading: customerRefundsLoading } = useQuery({
    queryKey: ["customer-refund-requests", user?.id],
    queryFn: async (): Promise<RefundRequest[]> => {
      if (!user) return [];
      const { data, error } = await refundRequestsTable()
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as RefundRequest[];
    },
    enabled: !!user,
  });

  // Create refund request
  const createRefundRequest = useMutation({
    mutationFn: async ({
      orderId,
      tailorId,
      amount,
      reason,
      refundType = "wallet",
    }: {
      orderId: string;
      tailorId: string;
      amount: number;
      reason: string;
      refundType?: "wallet" | "original_payment";
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await refundRequestsTable()
        .insert({
          order_id: orderId,
          customer_id: user.id,
          tailor_id: tailorId,
          amount,
          reason,
          refund_type: refundType,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Refund request submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["customer-refund-requests"] });
    },
    onError: (error) => {
      console.error("Error creating refund request:", error);
      toast.error("Failed to submit refund request");
    },
  });

  return {
    customerRefunds,
    isLoading: customerRefundsLoading,
    createRefundRequest: createRefundRequest.mutate,
    isCreatingRefund: createRefundRequest.isPending,
  };
};

export const useTailorRefunds = (tailorId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch tailor's refund requests
  const { data: tailorRefunds, isLoading } = useQuery({
    queryKey: ["tailor-refund-requests", tailorId],
    queryFn: async (): Promise<RefundRequest[]> => {
      if (!tailorId) return [];
      const { data, error } = await refundRequestsTable()
        .select("*")
        .eq("tailor_id", tailorId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as RefundRequest[];
    },
    enabled: !!tailorId && !!user,
  });

  // Process refund (approve/reject)
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
      notes?: string;
      customerId: string;
      amount: number;
      refundType: "wallet" | "original_payment";
    }) => {
      if (!user) throw new Error("Must be logged in");

      // Update refund request status
      const { error: updateError } = await refundRequestsTable()
        .update({
          status: status === "approved" ? "processed" : "rejected",
          tailor_notes: notes,
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
              description: `Refund processed`,
            });

          if (txError) throw txError;
        }
      }
    },
    onSuccess: (_, variables) => {
      toast.success(`Refund ${variables.status === "approved" ? "processed" : "rejected"} successfully`);
      queryClient.invalidateQueries({ queryKey: ["tailor-refund-requests"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (error) => {
      console.error("Error processing refund:", error);
      toast.error("Failed to process refund");
    },
  });

  return {
    tailorRefunds,
    isLoading,
    processRefund: processRefund.mutate,
    isProcessing: processRefund.isPending,
  };
};
