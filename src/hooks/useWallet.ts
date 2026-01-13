import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: 'credit' | 'debit' | 'refund' | 'purchase';
  description: string | null;
  order_id: string | null;
  created_at: string;
}

// Helper to type the wallets table query
const walletsTable = () => supabase.from("wallets" as any);
const transactionsTable = () => supabase.from("wallet_transactions" as any);

export const useWallet = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async (): Promise<Wallet | null> => {
      if (!user) return null;

      // Try to get existing wallet
      const { data, error } = await walletsTable()
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // Create wallet if it doesn't exist
      if (!data) {
        const { data: newWallet, error: createError } = await walletsTable()
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) throw createError;
        return newWallet as unknown as Wallet;
      }

      return data as unknown as Wallet;
    },
    enabled: !!user,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["wallet-transactions", wallet?.id],
    queryFn: async (): Promise<WalletTransaction[]> => {
      if (!wallet) return [];

      const { data, error } = await transactionsTable()
        .select("*")
        .eq("wallet_id", wallet.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as WalletTransaction[];
    },
    enabled: !!wallet,
  });

  const addCreditsMutation = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description?: string }) => {
      if (!wallet || !user) throw new Error("Wallet not found");

      // Update wallet balance
      const { error: updateError } = await walletsTable()
        .update({ balance: wallet.balance + amount })
        .eq("id", wallet.id);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: txError } = await transactionsTable()
        .insert({
          wallet_id: wallet.id,
          amount,
          type: "credit",
          description: description || "Added credits",
        });

      if (txError) throw txError;
    },
    onSuccess: () => {
      toast.success("Credits added successfully!");
      queryClient.invalidateQueries({ queryKey: ["wallet", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions", wallet?.id] });
    },
    onError: (error) => {
      console.error("Error adding credits:", error);
      toast.error("Failed to add credits");
    },
  });

  const useWalletForPurchase = useMutation({
    mutationFn: async ({ amount, orderId, description }: { amount: number; orderId?: string; description?: string }) => {
      if (!wallet || !user) throw new Error("Wallet not found");
      if (wallet.balance < amount) throw new Error("Insufficient balance");

      // Update wallet balance
      const { error: updateError } = await walletsTable()
        .update({ balance: wallet.balance - amount })
        .eq("id", wallet.id);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: txError } = await transactionsTable()
        .insert({
          wallet_id: wallet.id,
          amount: -amount,
          type: "purchase",
          description: description || "Purchase",
          order_id: orderId || null,
        });

      if (txError) throw txError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions", wallet?.id] });
    },
    onError: (error) => {
      console.error("Error using wallet:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process payment");
    },
  });

  return {
    wallet,
    transactions,
    isLoading: walletLoading || transactionsLoading,
    addCredits: addCreditsMutation.mutate,
    useWalletForPurchase: useWalletForPurchase.mutateAsync,
    isAddingCredits: addCreditsMutation.isPending,
    isProcessingPurchase: useWalletForPurchase.isPending,
  };
};
