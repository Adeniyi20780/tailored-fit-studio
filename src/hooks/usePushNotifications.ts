import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("This browser does not support notifications");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        await subscribeToNotifications();
        return true;
      } else {
        toast.error("Notification permission denied");
        return false;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  const subscribeToNotifications = async () => {
    if (!user) return;

    try {
      // For browser notifications, we just need to store that the user has opted in
      // Using 'as any' since types aren't regenerated yet
      const { error } = await supabase
        .from("push_subscriptions" as any)
        .upsert({
          user_id: user.id,
          endpoint: `browser-${user.id}`,
          p256dh: "browser",
          auth: "browser",
        }, {
          onConflict: "user_id,endpoint"
        });

      if (error) throw error;
      setIsSubscribed(true);
      toast.success("Notifications enabled!");
    } catch (error) {
      console.error("Error subscribing to notifications:", error);
    }
  };

  const unsubscribe = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("push_subscriptions" as any)
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
      setIsSubscribed(false);
      toast.success("Notifications disabled");
    } catch (error) {
      console.error("Error unsubscribing:", error);
    }
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission === "granted") {
      new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });
    }
  };

  // Subscribe to order status changes for real-time notifications
  useEffect(() => {
    if (!user || permission !== "granted") return;

    const channel = supabase
      .channel("order-notifications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `customer_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = (payload.new as any).status;
          const orderNumber = (payload.new as any).order_number;
          
          const statusMessages: Record<string, string> = {
            confirmed: "Your order has been confirmed!",
            processing: "Your order is being processed",
            tailoring: "Your garment is being tailored",
            quality_check: "Quality check in progress",
            packaging: "Your order is being packaged",
            shipped: "Your order has been shipped!",
            delivered: "Your order has been delivered!",
          };

          const message = statusMessages[newStatus] || `Order status updated to ${newStatus}`;
          
          showNotification(`Order ${orderNumber}`, {
            body: message,
            tag: (payload.new as any).id,
          });

          // Also show in-app toast
          toast.info(`Order ${orderNumber}: ${message}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission]);

  return {
    permission,
    isSubscribed,
    requestPermission,
    unsubscribe,
    showNotification,
  };
};
