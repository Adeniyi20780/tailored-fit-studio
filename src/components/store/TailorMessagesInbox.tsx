import { useState, useRef, useEffect } from "react";
import { MessageCircle, ArrowLeft, Send, Loader2, ShoppingBag, Paperclip, X, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSellerMessages } from "@/hooks/useSellerMessages";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday } from "date-fns";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface TailorMessagesInboxProps {
  tailorId: string;
}

const TailorMessagesInbox = ({ tailorId }: TailorMessagesInboxProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConv, setSelectedConv] = useState<any>(null);

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

      const convMap = new Map<string, any>();
      for (const msg of data || []) {
        if (!convMap.has(msg.conversation_id)) {
          const unreadCount = (data || []).filter(
            (m) => m.conversation_id === msg.conversation_id && m.receiver_id === user.id && !m.is_read
          ).length;
          convMap.set(msg.conversation_id, { ...msg, unread_count: unreadCount });
        }
      }

      const senderIds = Array.from(new Set(
        Array.from(convMap.values()).map((c) => (c.sender_id === user.id ? c.receiver_id : c.sender_id))
      ));
      let profiles: any[] = [];
      if (senderIds.length > 0) {
        const { data: profileData } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", senderIds);
        profiles = profileData || [];
      }

      const productIds = Array.from(new Set(Array.from(convMap.values()).map((c) => c.product_id).filter(Boolean)));
      let productsMap: Record<string, string> = {};
      if (productIds.length > 0) {
        const { data: products } = await supabase.from("products").select("id, name").in("id", productIds);
        for (const p of products || []) productsMap[p.id] = p.name;
      }

      return Array.from(convMap.values()).map((conv) => {
        const customerId = conv.sender_id === user.id ? conv.receiver_id : conv.sender_id;
        const profile = profiles.find((p) => p.user_id === customerId);
        return {
          ...conv,
          customer_name: profile?.full_name || "Customer",
          customer_avatar: profile?.avatar_url,
          product_name: conv.product_id ? productsMap[conv.product_id] || null : null,
        };
      });
    },
    enabled: !!user && !!tailorId,
  });

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
          {conversations.some((c: any) => c.unread_count > 0) && (
            <Badge variant="destructive" className="ml-auto">
              {conversations.reduce((sum: number, c: any) => sum + c.unread_count, 0)} new
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border border-border rounded-lg overflow-hidden flex" style={{ height: 420 }}>
          <div className={`w-full md:w-72 border-r border-border flex flex-col ${selectedConv ? "hidden md:flex" : "flex"}`}>
            <ScrollArea className="flex-1">
              {isLoading && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
              {!isLoading && conversations.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No messages yet</p>}
              {conversations.map((conv: any) => (
                <button key={conv.conversation_id}
                  className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 ${selectedConv?.conversation_id === conv.conversation_id ? "bg-muted" : ""}`}
                  onClick={() => setSelectedConv(conv)}>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {conv.customer_name?.split(" ")[0]?.charAt(0)?.toUpperCase() || "C"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground text-sm truncate">{conv.customer_name?.split(" ")[0]}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-1">{formatDate(conv.created_at)}</span>
                    </div>
                    {conv.product_name && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <ShoppingBag className="h-3 w-3 text-muted-foreground shrink-0" />
                        <p className="text-[11px] text-muted-foreground truncate">{conv.product_name}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-muted-foreground truncate">{conv.content}</p>
                      {conv.unread_count > 0 && <Badge variant="default" className="ml-1 h-4 min-w-4 text-[9px] px-1 shrink-0">{conv.unread_count}</Badge>}
                    </div>
                  </div>
                </button>
              ))}
            </ScrollArea>
          </div>

          <div className={`flex-1 flex flex-col ${selectedConv ? "flex" : "hidden md:flex"}`}>
            {selectedConv ? (
              <TailorChatPanel conv={selectedConv} tailorId={tailorId} onBack={() => setSelectedConv(null)} />
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

const TailorChatPanel = ({ conv, tailorId, onBack }: { conv: any; tailorId: string; onBack: () => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  // Use explicit conversation_id so we load the correct thread
  const { messages, isLoading, sendMessage, isSending } = useSellerMessages(tailorId, conv.conversation_id);
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (!user || !conv.conversation_id) return;
    supabase
      .from("seller_messages")
      .update({ is_read: true })
      .eq("conversation_id", conv.conversation_id)
      .eq("receiver_id", user.id)
      .eq("is_read", false)
      .then(() => {});
  }, [conv.conversation_id, user]);

  const customerId = conv.sender_id === user?.id ? conv.receiver_id : conv.sender_id;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }
    setAttachment(file);
  };

  const handleSend = async () => {
    if (!message.trim() && !attachment) return;
    let attachmentData: any = {};
    if (attachment && user) {
      setIsUploading(true);
      try {
        const path = `${user.id}/${Date.now()}_${attachment.name}`;
        const { error: uploadError } = await supabase.storage.from("message-attachments").upload(path, attachment);
        if (uploadError) throw uploadError;
        attachmentData = {
          attachmentPath: path,
          attachmentName: attachment.name,
          attachmentMimeType: attachment.type,
          attachmentSize: attachment.size,
        };
      } catch (err: any) {
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }
    sendMessage(
      { content: message.trim() || `Sent a file: ${attachment?.name}`, receiverId: customerId, ...attachmentData },
      { onSuccess: () => { setMessage(""); setAttachment(null); } }
    );
  };

  const downloadAttachment = async (path: string) => {
    const { data, error } = await supabase.storage.from("message-attachments").createSignedUrl(path, 300);
    if (error || !data?.signedUrl) { toast({ title: "Error", description: "Could not download", variant: "destructive" }); return; }
    window.open(data.signedUrl, "_blank");
  };

  const isImage = (mime: string) => mime?.startsWith("image/");

  return (
    <>
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
          {conv.customer_name?.charAt(0)?.toUpperCase() || "C"}
        </div>
        <p className="font-medium text-foreground text-sm truncate">{conv.customer_name}</p>
      </div>

      <ScrollArea className="flex-1 p-3">
        {isLoading && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
        <div className="space-y-2">
          {messages.map((msg: any) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                  {msg.attachment_path && msg.attachment_mime_type && isImage(msg.attachment_mime_type) && (
                    <button onClick={() => downloadAttachment(msg.attachment_path)} className="block mb-2 rounded-lg overflow-hidden max-w-[200px]">
                      <img src="" alt={msg.attachment_name} className="w-full rounded-lg" onError={(e) => {
                        supabase.storage.from("message-attachments").createSignedUrl(msg.attachment_path, 300).then(({ data }) => {
                          if (data?.signedUrl) (e.target as HTMLImageElement).src = data.signedUrl;
                        });
                      }} />
                    </button>
                  )}
                  {msg.attachment_path && msg.attachment_mime_type && !isImage(msg.attachment_mime_type) && (
                    <button onClick={() => downloadAttachment(msg.attachment_path)}
                      className={`flex items-center gap-2 mb-2 p-2 rounded-lg ${isMine ? "bg-primary-foreground/10" : "bg-background/50"}`}>
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="text-xs truncate">{msg.attachment_name}</span>
                      <Download className="h-3 w-3 shrink-0" />
                    </button>
                  )}
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
        {attachment && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg">
            <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-xs text-foreground truncate flex-1">{attachment.name}</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setAttachment(null)}><X className="h-3 w-3" /></Button>
          </div>
        )}
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx,.txt" />
          <Button variant="ghost" size="icon" className="shrink-0 self-end h-9 w-9" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea placeholder="Reply…" value={message} onChange={(e) => setMessage(e.target.value)} rows={1} className="resize-none flex-1 text-sm"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
          <Button size="icon" onClick={handleSend} disabled={(!message.trim() && !attachment) || isSending || isUploading} className="shrink-0 self-end h-9 w-9">
            {isSending || isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </>
  );
};

export default TailorMessagesInbox;
