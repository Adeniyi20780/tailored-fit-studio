import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

/** Generate a deterministic conversation ID from two user IDs and a tailor DB id */
export const makeConversationId = (userId: string, tailorDbId: string) =>
  `conv_${[userId, tailorDbId].sort().join("_")}`;

/**
 * Fetch & send messages for a specific conversation.
 * Accepts EITHER a direct `conversationId` OR a `tailorId` (for backward compat).
 */
export const useSellerMessages = (
  tailorId: string | undefined,
  explicitConversationId?: string
) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const conversationId = explicitConversationId
    ? explicitConversationId
    : tailorId && user
    ? makeConversationId(user.id, tailorId)
    : "";

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["seller-messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("seller_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!conversationId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user || !conversationId) return;
    const channel = supabase
      .channel(`seller-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "seller_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["seller-messages", conversationId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, conversationId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async ({
      content,
      receiverId,
      productId,
      attachmentPath,
      attachmentName,
      attachmentMimeType,
      attachmentSize,
    }: {
      content: string;
      receiverId: string;
      productId?: string;
      attachmentPath?: string;
      attachmentName?: string;
      attachmentMimeType?: string;
      attachmentSize?: number;
    }) => {
      if (!user || !tailorId) throw new Error("Not authenticated");

      const { error } = await supabase.from("seller_messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: receiverId,
        tailor_id: tailorId,
        product_id: productId || null,
        content,
        attachment_path: attachmentPath || null,
        attachment_name: attachmentName || null,
        attachment_mime_type: attachmentMimeType || null,
        attachment_size: attachmentSize || null,
      });
      if (error) throw error;

      // Create notification for receiver
      await supabase.from("notifications").insert({
        user_id: receiverId,
        type: "message",
        title: "New message",
        message: content.length > 100 ? content.slice(0, 100) + "…" : content,
        reference_id: conversationId,
        reference_type: "seller_message",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["all-conversations"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    },
  });

  return {
    messages,
    isLoading,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.isPending,
    conversationId,
  };
};

// Hook for fetching all conversations for the current user
export const useAllConversations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["all-conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("seller_messages")
        .select("*, tailors:tailor_id(id, store_name, logo_url, store_slug, user_id)")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by conversation_id, keep latest message
      const convMap = new Map<string, any>();
      for (const msg of data || []) {
        if (!convMap.has(msg.conversation_id)) {
          const unreadCount = (data || []).filter(
            (m) =>
              m.conversation_id === msg.conversation_id &&
              m.receiver_id === user.id &&
              !m.is_read
          ).length;
          convMap.set(msg.conversation_id, {
            ...msg,
            unread_count: unreadCount,
          });
        }
      }

      const convList = Array.from(convMap.values());

      // Fetch sender profiles (the other party's name)
      const otherUserIds = Array.from(
        new Set(
          convList.map((c) =>
            c.sender_id === user.id ? c.receiver_id : c.sender_id
          )
        )
      );
      let profilesMap: Record<string, string> = {};
      if (otherUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", otherUserIds);
        for (const p of profiles || []) {
          profilesMap[p.user_id] = p.full_name || "Customer";
        }
      }

      // Fetch product names
      const productIds = Array.from(
        new Set(convList.map((c) => c.product_id).filter(Boolean))
      );
      let productsMap: Record<string, string> = {};
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from("products")
          .select("id, name")
          .in("id", productIds);
        for (const p of products || []) {
          productsMap[p.id] = p.name;
        }
      }

      return convList.map((conv) => {
        const otherId = conv.sender_id === user.id ? conv.receiver_id : conv.sender_id;
        return {
          ...conv,
          other_user_name: profilesMap[otherId] || "Customer",
          product_name: conv.product_id ? productsMap[conv.product_id] || null : null,
        };
      });
    },
    enabled: !!user,
  });

  // Realtime for any new message to the user
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("all-seller-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "seller_messages" },
        (payload) => {
          const msg = payload.new as any;
          if (msg.sender_id === user.id || msg.receiver_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ["all-conversations", user.id] });
            queryClient.invalidateQueries({ queryKey: ["seller-messages", msg.conversation_id] });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return { conversations, isLoading };
};
