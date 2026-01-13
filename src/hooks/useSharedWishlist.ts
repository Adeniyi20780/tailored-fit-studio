import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const generateShareCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const useSharedWishlist = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSharedWishlist = useMutation({
    mutationFn: async ({ 
      productIds, 
      title = "My Wishlist" 
    }: { 
      productIds: string[]; 
      title?: string;
    }) => {
      if (!user) throw new Error("Must be logged in");
      if (productIds.length === 0) throw new Error("No products to share");

      const shareCode = generateShareCode();

      const { data, error } = await supabase
        .from("shared_wishlists")
        .insert({
          user_id: user.id,
          share_code: shareCode,
          product_ids: productIds,
          title,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-wishlists", user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating shared wishlist",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getShareUrl = (shareCode: string) => {
    return `${window.location.origin}/shared-wishlist/${shareCode}`;
  };

  return {
    createSharedWishlist: createSharedWishlist.mutateAsync,
    isCreating: createSharedWishlist.isPending,
    getShareUrl,
  };
};
