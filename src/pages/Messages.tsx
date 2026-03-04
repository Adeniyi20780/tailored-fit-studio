import { useState, useRef, useEffect } from "react";
import {
  MessageCircle, ArrowLeft, Send, Loader2, Search, Inbox, 
  Send as SendIcon, Mail, MailOpen, Trash2, Archive, ArchiveRestore,
  MailWarning, Eye, EyeOff, ShoppingBag
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useAllConversations, useSellerMessages } from "@/hooks/useSellerMessages";
import { useConversationActions } from "@/hooks/useConversationActions";
import { format, isToday, isYesterday } from "date-fns";
import { Link, useSearchParams } from "react-router-dom";

const formatMessageDate = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
};

type FilterType = "inbox" | "unread" | "sent" | "all" | "archived";

const sidebarItems: { key: FilterType; label: string; icon: React.ElementType }[] = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "unread", label: "Unread", icon: Mail },
  { key: "sent", label: "Sent", icon: SendIcon },
  { key: "all", label: "All", icon: MailOpen },
  { key: "archived", label: "Archive", icon: Archive },
];

const Messages = () => {
  const { user } = useAuth();
  const { conversations, isLoading } = useAllConversations();
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams] = useSearchParams();

  // Auto-open conversation from URL param (e.g. from notification click)
  useEffect(() => {
    const convId = searchParams.get("conversation");
    if (convId && conversations.length > 0 && !selectedConv) {
      const found = conversations.find((c) => c.conversation_id === convId);
      if (found) setSelectedConv(found);
    }
  }, [searchParams, conversations, selectedConv]);
  const { archivedIds, markAsRead, markAsUnread, archiveConversation, unarchiveConversation } = useConversationActions();

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = searchQuery
      ? conv.tailors?.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.content?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const isArchived = archivedIds.includes(conv.conversation_id);

    switch (activeFilter) {
      case "archived":
        return matchesSearch && isArchived;
      case "unread":
        return matchesSearch && !isArchived && conv.unread_count > 0;
      case "sent":
        return matchesSearch && !isArchived && conv.sender_id === user?.id;
      case "all":
        return matchesSearch;
      case "inbox":
      default:
        return matchesSearch && !isArchived;
    }
  });

  const unreadTotal = conversations.reduce((sum, c) => {
    if (archivedIds.includes(c.conversation_id)) return sum;
    return sum + (c.unread_count || 0);
  }, 0);

  const handleMarkRead = () => {
    if (selectedConv) markAsRead(selectedConv.conversation_id);
  };
  const handleMarkUnread = () => {
    if (selectedConv) markAsUnread(selectedConv.conversation_id);
  };
  const handleArchive = () => {
    if (!selectedConv) return;
    const isArchived = archivedIds.includes(selectedConv.conversation_id);
    if (isArchived) {
      unarchiveConversation(selectedConv.conversation_id);
    } else {
      archiveConversation(selectedConv.conversation_id);
      setSelectedConv(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-6">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-display font-bold text-foreground">Messages</h1>
            <div className="relative w-72 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your messages"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div
            className="border border-border rounded-xl overflow-hidden flex bg-card"
            style={{ height: "calc(100vh - 220px)" }}
          >
            {/* Sidebar */}
            <div className="w-52 border-r border-border flex-col hidden md:flex">
              <ScrollArea className="flex-1 py-2">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeFilter === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveFilter(item.key)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.key === "inbox" && unreadTotal > 0 && (
                        <Badge variant="default" className="h-5 min-w-5 text-[10px] px-1.5">
                          {unreadTotal}
                        </Badge>
                      )}
                      {item.key === "unread" && unreadTotal > 0 && (
                        <span className="text-xs">{unreadTotal}</span>
                      )}
                    </button>
                  );
                })}
              </ScrollArea>
            </div>

            {/* Conversation list + toolbar */}
            <div
              className={`w-full md:w-80 lg:w-96 border-r border-border flex flex-col ${
                selectedConv ? "hidden md:flex" : "flex"
              }`}
            >
              {/* Toolbar */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-border text-muted-foreground flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1.5 h-8"
                  onClick={handleMarkRead}
                  disabled={!selectedConv}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Mark Read
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1.5 h-8"
                  onClick={handleMarkUnread}
                  disabled={!selectedConv}
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  Mark Unread
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1.5 h-8"
                  onClick={handleArchive}
                  disabled={!selectedConv}
                >
                  {selectedConv && archivedIds.includes(selectedConv.conversation_id) ? (
                    <>
                      <ArchiveRestore className="h-3.5 w-3.5" />
                      Unarchive
                    </>
                  ) : (
                    <>
                      <Archive className="h-3.5 w-3.5" />
                      Archive
                    </>
                  )}
                </Button>
              </div>

              {/* Mobile search */}
              <div className="p-3 border-b border-border sm:hidden">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Mobile filter tabs */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-border md:hidden overflow-x-auto">
                {sidebarItems.map((item) => (
                  <Button
                    key={item.key}
                    variant={activeFilter === item.key ? "default" : "ghost"}
                    size="sm"
                    className="text-xs h-7 shrink-0"
                    onClick={() => setActiveFilter(item.key)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>

              <ScrollArea className="flex-1">
                {isLoading && (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!isLoading && filteredConversations.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div className="relative mb-6">
                      <MessageCircle className="h-16 w-16 text-muted-foreground/20" />
                      <MailWarning className="h-8 w-8 text-muted-foreground/30 absolute -bottom-1 -right-1" />
                    </div>
                    <p className="text-foreground font-medium text-lg">No conversations to see here!</p>
                    <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                      {activeFilter === "archived"
                        ? "You haven't archived any conversations yet"
                        : "Start a conversation by messaging a seller from any product page"}
                    </p>
                    {activeFilter !== "archived" && (
                      <Link to="/catalog">
                        <Button variant="outline" className="mt-4">Browse Products</Button>
                      </Link>
                    )}
                  </div>
                )}
                {filteredConversations.map((conv) => {
                  const tailor = conv.tailors;
                  const isActive = selectedConv?.conversation_id === conv.conversation_id;
                  const isMine = conv.sender_id === user?.id;
                  const hasUnread = conv.unread_count > 0;
                  const isArchived = archivedIds.includes(conv.conversation_id);
                  const senderFirstName = conv.other_user_name?.split(" ")[0] || "Someone";
                  return (
                    <button
                      key={conv.conversation_id}
                      className={`w-full flex items-start gap-3 p-4 text-left transition-colors border-b border-border/50 ${
                        isActive
                          ? "bg-primary/5 border-l-2 border-l-primary"
                          : hasUnread
                          ? "bg-muted/30 hover:bg-muted/50"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedConv(conv)}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
                        {tailor?.logo_url ? (
                          <img src={tailor.logo_url} alt={tailor.store_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-primary">{senderFirstName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className={`text-sm truncate ${hasUnread ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                              {senderFirstName}
                            </p>
                            {isArchived && (
                              <Badge variant="secondary" className="text-[9px] h-4 px-1 shrink-0">
                                Archived
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                            {formatMessageDate(conv.created_at)}
                          </span>
                        </div>
                        {conv.product_name && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <ShoppingBag className="h-3 w-3 text-muted-foreground shrink-0" />
                            <p className="text-[11px] text-muted-foreground truncate">{conv.product_name}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-0.5">
                          <p className={`text-xs truncate ${hasUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                            {isMine ? "You: " : ""}{conv.content}
                          </p>
                          {hasUnread && (
                            <Badge variant="default" className="ml-2 h-5 min-w-5 text-[10px] px-1.5 shrink-0 rounded-full">
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
                <ChatPanel conv={selectedConv} onBack={() => setSelectedConv(null)} />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                  <div className="relative mb-6">
                    <MessageCircle className="h-20 w-20 text-muted-foreground/15" />
                    <Mail className="h-10 w-10 text-muted-foreground/25 absolute -bottom-2 -right-2" />
                  </div>
                  <p className="text-foreground font-semibold text-lg">No conversations to see here!</p>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                    Select a conversation from the list or start a new one from a product page
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
  const { markAsRead } = useConversationActions();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-mark as read when opening conversation
  useEffect(() => {
    if (conv?.conversation_id && conv?.unread_count > 0) {
      markAsRead(conv.conversation_id);
    }
  }, [conv?.conversation_id]);

  const receiverId = tailor?.user_id === user?.id ? conv.sender_id : tailor?.user_id;

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage({ content: message.trim(), receiverId }, { onSuccess: () => setMessage("") });
  };

  return (
    <>
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

      <ScrollArea className="flex-1 p-4">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
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
