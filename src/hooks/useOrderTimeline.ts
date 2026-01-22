import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TimelineEvent {
  id: string;
  order_id: string;
  status: string;
  note: string | null;
  created_at: string;
}

export const useOrderTimeline = (orderId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: timeline = [], isLoading } = useQuery({
    queryKey: ["order-timeline", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      
      const { data, error } = await supabase
        .from("order_timeline")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as TimelineEvent[];
    },
    enabled: !!orderId && !!user,
  });

  // Real-time subscription for timeline updates
  useEffect(() => {
    if (!orderId || !user) return;

    const channel = supabase
      .channel(`order-timeline-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_timeline",
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["order-timeline", orderId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, user, queryClient]);

  return {
    timeline,
    isLoading,
  };
};
