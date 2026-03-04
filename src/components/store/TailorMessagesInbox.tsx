import { useState, useRef, useEffect } from "react";
import { MessageCircle, ArrowLeft, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSellerMessages } from "@/hooks/useSellerMessages";
import { format, isToday, isYesterday } from "date-fns";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
};

interface TailorMessagesInboxProps {
  tailorId: string;
}

const TailorMessagesInbox = ({ tailorId }: TailorMessagesInboxProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConv, setSelectedConv] = useState<any>(null);

  // Fetch all conversations for this tailor
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["tailor-conversations", tailorId],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("seller_messages")
        .select("*")
        .eq("tailor_id", tailorId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by conversation_id
      const convMap = new Map<string, any>();
      for (const msg of data || []) {
        if (!convMap.has(msg.conversation_id)) {
          const unreadCount = (data || []).filter(
            (m) =>
              m.conversation_id === msg.conversation_id &&
              m.receiver_id === user.id &&
              !m.is_read
          ).length;
          convMap.set(msg.conversation_id, { ...msg, unread_count: unreadCount });
        }
      }

      // Fetch customer profiles for display
      const senderIds = Array.from(
        new Set(
          Array.from(convMap.values())
            .map((c) => (c.sender_id === user.id ? c.receiver_id : c.sender_id))
        )
      );

      let profiles: any[] = [];
      if (senderIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", senderIds);
        profiles = profileData || [];
      }

      return Array.from(convMap.values()).map((conv) => {
        const customerId = conv.sender_id === user.id ? conv.receiver_id : conv.sender_id;
        const profile = profiles.find((p) => p.user_id === customerId);
        return { ...conv, customer_name: profile?.full_name || "Customer", customer_avatar: profile?.avatar_url };
      });
    },
    enabled: !!user && !!tailorId,
  });

  // Realtime
  useEffect(() => {
    if (!user || !tailorId) return;
    const channel = supabase
      .channel(`tailor-inbox-${tailorId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "seller_messages" }, (payload) => {
        const msg = payload.new as any;
        if (msg.tailor_id === tailorId) {
          queryClient.invalidateQueries({ queryKey: ["tailor-conversations", tailorId] });
          queryClient.invalidateQueries({ queryKey: ["seller-messages", msg.conversation_id] });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, tailorId, queryClient]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Customer Messages
          {conversations.some((c) => c.unread_count > 0) && (
            <Badge variant="destructive" className="ml-auto">
              {conversations.reduce((sum, c) => sum + c.unread_count, 0)} new
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border border-border rounded-lg overflow-hidden flex" style={{ height: 420 }}>
          {/* List */}
          <div className={`w-full md:w-72 border-r border-border flex flex-col ${selectedConv ? "hidden md:flex" : "flex"}`}>
            <ScrollArea className="flex-1">
              {isLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isLoading && conversations.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No messages yet</p>
              )}
              {conversations.map((conv) => (
                <button
                  key={conv.conversation_id}
                  className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 ${selectedConv?.conversation_id === conv.conversation_id ? "bg-muted" : ""}`}
                  onClick={() => setSelectedConv(conv)}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {conv.customer_name?.charAt(0)?.toUpperCase() || "C"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground text-sm truncate">{conv.customer_name}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-1">{formatDate(conv.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-muted-foreground truncate">{conv.content}</p>
                      {conv.unread_count > 0 && (
                        <Badge variant="default" className="ml-1 h-4 min-w-4 text-[9px] px-1 shrink-0">{conv.unread_count}</Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </ScrollArea>
          </div>

          {/* Chat */}
          <div className={`flex-1 flex flex-col ${selectedConv ? "flex" : "hidden md:flex"}`}>
            {selectedConv ? (
              <TailorChatPanel conv={selectedConv} onBack={() => setSelectedConv(null)} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-center px-4">
                <div>
                  <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Select a conversation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TailorChatPanel = ({ conv, onBack }: { conv: any; onBack: () => void }) => {
  const { user } = useAuth();
  const tailorId = conv.tailor_id;
  const { messages, isLoading, sendMessage, isSending } = useSellerMessages(tailorId);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const customerId = conv.sender_id === user?.id ? conv.receiver_id : conv.sender_id;

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage(
      { content: message.trim(), receiverId: customerId },
      { onSuccess: () => setMessage("") }
    );
  };

  return (
    <>
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Button variant="ghost" size="icon" className="md:hidden shrink-0 h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
          {conv.customer_name?.charAt(0)?.toUpperCase() || "C"}
        </div>
        <p className="font-medium text-foreground text-sm truncate">{conv.customer_name}</p>
      </div>

      <ScrollArea className="flex-1 p-3">
        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        <div className="space-y-2">
          {messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-0.5 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {format(new Date(msg.created_at), "h:mm a")}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border p-2">
        <div className="flex gap-2">
          <Textarea
            placeholder="Reply…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={1}
            className="resize-none flex-1 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
          />
          <Button size="icon" onClick={handleSend} disabled={!message.trim() || isSending} className="shrink-0 self-end h-9 w-9">
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </>
  );
};

export default TailorMessagesInbox;
