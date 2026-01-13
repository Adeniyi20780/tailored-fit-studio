import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface NotificationPreference {
  id: string;
  user_id: string;
  product_id: string;
  notify_on_sale: boolean;
  notify_on_restock: boolean;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export const useWishlistNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["wishlist-notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("wishlist_notifications")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as NotificationPreference[];
    },
    enabled: !!user,
  });

  const enableNotifications = useMutation({
    mutationFn: async ({ 
      productId, 
      notifyOnSale = true, 
      notifyOnRestock = true 
    }: { 
      productId: string; 
      notifyOnSale?: boolean; 
      notifyOnRestock?: boolean;
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("wishlist_notifications")
        .upsert({
          user_id: user.id,
          product_id: productId,
          notify_on_sale: notifyOnSale,
          notify_on_restock: notifyOnRestock,
          email_notifications: true,
        }, {
          onConflict: "user_id,product_id"
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist-notifications", user?.id] });
      toast({
        title: "Notifications enabled",
        description: "You'll be notified about price drops and restocks.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disableNotifications = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("wishlist_notifications")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist-notifications", user?.id] });
      toast({
        title: "Notifications disabled",
        description: "You won't receive alerts for this product.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const hasNotificationsEnabled = (productId: string) => {
    return notifications.some((n) => n.product_id === productId);
  };

  const getNotificationPreference = (productId: string) => {
    return notifications.find((n) => n.product_id === productId);
  };

  const toggleNotifications = (productId: string) => {
    if (hasNotificationsEnabled(productId)) {
      disableNotifications.mutate(productId);
    } else {
      enableNotifications.mutate({ productId });
    }
  };

  return {
    notifications,
    isLoading,
    enableNotifications: enableNotifications.mutate,
    disableNotifications: disableNotifications.mutate,
    hasNotificationsEnabled,
    getNotificationPreference,
    toggleNotifications,
    isToggling: enableNotifications.isPending || disableNotifications.isPending,
  };
};
