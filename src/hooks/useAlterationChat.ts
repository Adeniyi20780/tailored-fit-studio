import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Message {
  id: string;
  alteration_ticket_id: string;
  sender_id: string;
  sender_type: "customer" | "tailor";
  content: string;
  is_read: boolean;
  created_at: string;
}

export const useAlterationChat = (ticketId: string | null, senderType: "customer" | "tailor") => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["alteration-messages", ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("alteration_ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!ticketId && !!user,
  });

  // Real-time subscription
  useEffect(() => {
    if (!ticketId || !user) return;

    const channel = supabase
      .channel(`messages-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `alteration_ticket_id=eq.${ticketId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["alteration-messages", ticketId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, user, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !ticketId) throw new Error("Missing user or ticket");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          alteration_ticket_id: ticketId,
          sender_id: user.id,
          sender_type: senderType,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alteration-messages", ticketId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      console.error("Error sending message:", error);
    },
  });

  const markMessagesAsRead = useMutation({
    mutationFn: async () => {
      if (!user || !ticketId) return;

      // Mark messages from the other party as read
      const otherType = senderType === "customer" ? "tailor" : "customer";
      
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("alteration_ticket_id", ticketId)
        .eq("sender_type", otherType)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alteration-messages", ticketId] });
    },
  });

  const unreadCount = messages.filter(
    (m) => !m.is_read && m.sender_type !== senderType
  ).length;

  return {
    messages,
    isLoading,
    unreadCount,
    sendMessage: sendMessage.mutate,
    markMessagesAsRead: markMessagesAsRead.mutate,
    isSending: sendMessage.isPending,
  };
};
