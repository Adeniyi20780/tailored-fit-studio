import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useShopFollow = (tailorId: string | undefined) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: isFollowing = false, isLoading } = useQuery({
    queryKey: ["shop-follow", user?.id, tailorId],
    queryFn: async () => {
      if (!user || !tailorId) return false;
      const { data } = await supabase
        .from("shop_follows")
        .select("id")
        .eq("user_id", user.id)
        .eq("tailor_id", tailorId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!tailorId,
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user || !tailorId) throw new Error("Not authenticated");

      // Re-check current state to avoid stale data
      const { data: existing } = await supabase
        .from("shop_follows")
        .select("id")
        .eq("user_id", user.id)
        .eq("tailor_id", tailorId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("shop_follows")
          .delete()
          .eq("user_id", user.id)
          .eq("tailor_id", tailorId);
        if (error) throw error;
        return "unfollowed";
      } else {
        const { error } = await supabase
          .from("shop_follows")
          .insert({ user_id: user.id, tailor_id: tailorId });
        if (error) throw error;
        return "followed";
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["shop-follow", user?.id, tailorId] });
      toast({
        title: result === "followed" ? "Following!" : "Unfollowed",
        description: result === "followed" ? "You'll see updates from this shop" : "You've unfollowed this shop",
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update follow status", variant: "destructive" });
    },
  });

  return { isFollowing, isLoading, toggleFollow: toggleFollow.mutate, isToggling: toggleFollow.isPending };
};
