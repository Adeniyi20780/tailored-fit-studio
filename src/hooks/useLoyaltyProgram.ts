import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface LoyaltyTier {
  id: string;
  name: string;
  min_points: number;
  multiplier: number;
  benefits: string[];
}

export interface CustomerLoyalty {
  id: string;
  user_id: string;
  total_points: number;
  available_points: number;
  lifetime_points: number;
  current_tier_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PointsTransaction {
  id: string;
  user_id: string;
  points: number;
  type: "earned" | "redeemed" | "expired" | "bonus";
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  reward_type: "discount_percentage" | "discount_fixed" | "free_shipping" | "free_product";
  reward_value: number;
  min_tier_id: string | null;
  is_active: boolean;
  stock: number | null;
}

export interface RewardRedemption {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  status: "active" | "used" | "expired";
  code: string;
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
}

export const useLoyaltyProgram = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all loyalty tiers
  const { data: tiers = [], isLoading: tiersLoading } = useQuery({
    queryKey: ["loyalty-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_tiers")
        .select("*")
        .order("min_points", { ascending: true });

      if (error) throw error;
      return data as LoyaltyTier[];
    },
  });

  // Fetch customer loyalty status
  const { data: loyalty, isLoading: loyaltyLoading } = useQuery({
    queryKey: ["customer-loyalty", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("customer_loyalty")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // If no loyalty record exists, create one
      if (!data) {
        const bronzeTier = tiers.find((t) => t.min_points === 0);
        const { data: newLoyalty, error: insertError } = await supabase
          .from("customer_loyalty")
          .insert({
            user_id: user.id,
            current_tier_id: bronzeTier?.id || null,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newLoyalty as CustomerLoyalty;
      }

      return data as CustomerLoyalty;
    },
    enabled: !!user && tiers.length > 0,
  });

  // Fetch points transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["points-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("points_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as PointsTransaction[];
    },
    enabled: !!user,
  });

  // Fetch available rewards
  const { data: rewards = [], isLoading: rewardsLoading } = useQuery({
    queryKey: ["loyalty-rewards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_rewards")
        .select("*")
        .eq("is_active", true)
        .order("points_cost", { ascending: true });

      if (error) throw error;
      return data as LoyaltyReward[];
    },
  });

  // Fetch user's redemptions
  const { data: redemptions = [], isLoading: redemptionsLoading } = useQuery({
    queryKey: ["reward-redemptions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("reward_redemptions")
        .select("*, loyalty_rewards(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (RewardRedemption & { loyalty_rewards: LoyaltyReward })[];
    },
    enabled: !!user,
  });

  // Redeem a reward
  const redeemReward = useMutation({
    mutationFn: async (rewardId: string) => {
      if (!user || !loyalty) throw new Error("Not authenticated");

      const reward = rewards.find((r) => r.id === rewardId);
      if (!reward) throw new Error("Reward not found");

      if (loyalty.available_points < reward.points_cost) {
        throw new Error("Insufficient points");
      }

      // Generate unique code
      const code = `RWD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Create redemption
      const { error: redemptionError } = await supabase
        .from("reward_redemptions")
        .insert({
          user_id: user.id,
          reward_id: rewardId,
          points_spent: reward.points_cost,
          code,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });

      if (redemptionError) throw redemptionError;

      // Deduct points
      const { error: updateError } = await supabase
        .from("customer_loyalty")
        .update({
          available_points: loyalty.available_points - reward.points_cost,
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from("points_transactions")
        .insert({
          user_id: user.id,
          points: -reward.points_cost,
          type: "redeemed",
          description: `Redeemed: ${reward.name}`,
          reference_id: rewardId,
          reference_type: "reward",
        });

      if (transactionError) throw transactionError;

      return code;
    },
    onSuccess: (code) => {
      queryClient.invalidateQueries({ queryKey: ["customer-loyalty"] });
      queryClient.invalidateQueries({ queryKey: ["points-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["reward-redemptions"] });
      toast({
        title: "Reward Redeemed!",
        description: `Your reward code is: ${code}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Redemption Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get current tier
  const currentTier = tiers.find((t) => t.id === loyalty?.current_tier_id);
  const nextTier = tiers.find((t) => t.min_points > (loyalty?.lifetime_points || 0));

  // Calculate progress to next tier
  const progressToNextTier = nextTier
    ? Math.min(
        100,
        ((loyalty?.lifetime_points || 0) / nextTier.min_points) * 100
      )
    : 100;

  const pointsToNextTier = nextTier
    ? nextTier.min_points - (loyalty?.lifetime_points || 0)
    : 0;

  return {
    tiers,
    loyalty,
    transactions,
    rewards,
    redemptions,
    currentTier,
    nextTier,
    progressToNextTier,
    pointsToNextTier,
    isLoading: tiersLoading || loyaltyLoading || transactionsLoading || rewardsLoading || redemptionsLoading,
    redeemReward: redeemReward.mutate,
    isRedeeming: redeemReward.isPending,
  };
};
