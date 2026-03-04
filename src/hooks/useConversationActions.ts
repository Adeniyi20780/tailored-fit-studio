import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useConversationActions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch archived conversation IDs
  const { data: archivedIds = [] } = useQuery({
    queryKey: ["archived-conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("conversation_archives")
        .select("conversation_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((d) => d.conversation_id);
    },
    enabled: !!user,
  });

  // Mark all messages in a conversation as read
  const markAsRead = useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("seller_messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .eq("receiver_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-conversations"] });
      toast({ title: "Marked as read" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to mark as read", variant: "destructive" });
    },
  });

  // Mark all messages in a conversation as unread (set latest as unread)
  const markAsUnread = useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) throw new Error("Not authenticated");
      // Get the latest message received
      const { data: msgs } = await supabase
        .from("seller_messages")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (msgs && msgs.length > 0) {
        const { error } = await supabase
          .from("seller_messages")
          .update({ is_read: false })
          .eq("id", msgs[0].id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-conversations"] });
      toast({ title: "Marked as unread" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to mark as unread", variant: "destructive" });
    },
  });

  // Archive a conversation
  const archiveConversation = useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("conversation_archives")
        .insert({ user_id: user.id, conversation_id: conversationId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["archived-conversations"] });
      toast({ title: "Conversation archived" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to archive", variant: "destructive" });
    },
  });

  // Unarchive a conversation
  const unarchiveConversation = useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("conversation_archives")
        .delete()
        .eq("user_id", user.id)
        .eq("conversation_id", conversationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["archived-conversations"] });
      toast({ title: "Conversation unarchived" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to unarchive", variant: "destructive" });
    },
  });

  return {
    archivedIds,
    markAsRead: markAsRead.mutate,
    markAsUnread: markAsUnread.mutate,
    archiveConversation: archiveConversation.mutate,
    unarchiveConversation: unarchiveConversation.mutate,
  };
};
