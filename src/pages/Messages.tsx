import { useState } from "react";
import { MessageCircle, ArrowLeft, Send, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useAllConversations, useSellerMessages } from "@/hooks/useSellerMessages";
import { format, isToday, isYesterday } from "date-fns";
import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";

const formatMessageDate = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
};

const Messages = () => {
  const { user } = useAuth();
  const { conversations, isLoading } = useAllConversations();
  const [selectedConv, setSelectedConv] = useState<any>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-display font-bold text-foreground mb-6">Messages</h1>

          <div className="border border-border rounded-xl overflow-hidden flex" style={{ height: "calc(100vh - 220px)" }}>
            {/* Conversation list */}
            <div className={`w-full md:w-96 border-r border-border flex flex-col ${selectedConv ? "hidden md:flex" : "flex"}`}>
              <div className="p-4 border-b border-border">
                <p className="text-sm font-medium text-muted-foreground">All Conversations</p>
              </div>
              <ScrollArea className="flex-1">
                {isLoading && (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!isLoading && conversations.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <p className="text-foreground font-medium">No messages yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start a conversation from any product page
                    </p>
                    <Link to="/catalog">
                      <Button variant="outline" className="mt-4">Browse Products</Button>
                    </Link>
                  </div>
                )}
                {conversations.map((conv) => {
                  const tailor = conv.tailors;
                  const isActive = selectedConv?.conversation_id === conv.conversation_id;
                  const isMine = conv.sender_id === user?.id;
                  return (
                    <button
                      key={conv.conversation_id}
                      className={`w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors border-b border-border/50 ${isActive ? "bg-muted" : ""}`}
                      onClick={() => setSelectedConv(conv)}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                        {tailor?.logo_url ? (
                          <img src={tailor.logo_url} alt={tailor.store_name} className="w-full h-full object-cover" />
                        ) : (
                          <MessageCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground text-sm truncate">
                            {tailor?.store_name || "Seller"}
                          </p>
                          <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                            {formatMessageDate(conv.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-muted-foreground truncate">
                            {isMine ? "You: " : ""}{conv.content}
                          </p>
                          {conv.unread_count > 0 && (
                            <Badge variant="default" className="ml-2 h-5 min-w-5 text-[10px] px-1.5 shrink-0">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </ScrollArea>
            </div>

            {/* Chat area */}
            <div className={`flex-1 flex flex-col ${selectedConv ? "flex" : "hidden md:flex"}`}>
              {selectedConv ? (
                <ChatPanel
                  conv={selectedConv}
                  onBack={() => setSelectedConv(null)}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                  <MessageCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <p className="text-foreground font-medium">Select a conversation</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose a conversation from the left to view messages
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const ChatPanel = ({ conv, onBack }: { conv: any; onBack: () => void }) => {
  const { user } = useAuth();
  const tailor = conv.tailors;
  const tailorId = tailor?.id;
  const { messages, isLoading, sendMessage, isSending } = useSellerMessages(tailorId);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Determine receiver: if I'm the tailor's user, receiver is the other party
  const receiverId = tailor?.user_id === user?.id ? conv.sender_id : tailor?.user_id;

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage(
      { content: message.trim(), receiverId },
      { onSuccess: () => setMessage("") }
    );
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
          {tailor?.logo_url ? (
            <img src={tailor.logo_url} alt={tailor.store_name} className="w-full h-full object-cover" />
          ) : (
            <MessageCircle className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{tailor?.store_name || "Seller"}</p>
          <p className="text-[11px] text-muted-foreground">Typically responds within a few hours</p>
        </div>
        {tailor?.store_slug && (
          <Link to={`/tailor/${tailor.store_slug}`}>
            <Button variant="outline" size="sm">View Shop</Button>
          </Link>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Policy reminder */}
        <div className="rounded-lg bg-muted/50 p-3 mb-4">
          <p className="text-xs text-muted-foreground text-center">
            Keep conversations professional. Do not share payment details outside the platform.
          </p>
        </div>

        <div className="space-y-3">
          {messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {format(new Date(msg.created_at), "h:mm a")}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Write a message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={1}
            className="resize-none flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button size="icon" onClick={handleSend} disabled={!message.trim() || isSending} className="shrink-0 self-end">
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </>
  );
};

export default Messages;
