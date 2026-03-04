import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useSellerMessages = (tailorId: string | undefined) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build a deterministic conversation_id
  const getConversationId = (tailorDbId: string) => {
    if (!user) return "";
    return `conv_${[user.id, tailorDbId].sort().join("_")}`;
  };

  const conversationId = tailorId ? getConversationId(tailorId) : "";

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

  const sendMessage = useMutation({
    mutationFn: async ({
      content,
      receiverId,
      productId,
    }: {
      content: string;
      receiverId: string;
      productId?: string;
    }) => {
      if (!user || !tailorId) throw new Error("Not authenticated");

      const { error } = await supabase.from("seller_messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: receiverId,
        tailor_id: tailorId,
        product_id: productId || null,
        content,
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
