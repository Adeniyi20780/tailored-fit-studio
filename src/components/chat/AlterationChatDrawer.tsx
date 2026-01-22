import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAlterationChat, Message } from "@/hooks/useAlterationChat";
import { useAuth } from "@/contexts/AuthContext";

interface AlterationChatDrawerProps {
  ticketId: string;
  ticketNumber?: string;
  senderType: "customer" | "tailor";
  otherPartyName?: string;
}

const MessageBubble = ({ 
  message, 
  isOwn,
  senderType 
}: { 
  message: Message; 
  isOwn: boolean;
  senderType: "customer" | "tailor";
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}
    >
      <div className={`flex items-end gap-2 max-w-[80%] ${isOwn ? "flex-row-reverse" : ""}`}>
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className={isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}>
            {message.sender_type === "customer" ? "C" : "T"}
          </AvatarFallback>
        </Avatar>
        <div>
          <div
            className={`rounded-2xl px-4 py-2 ${
              isOwn
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? "text-right" : ""}`}>
            {format(new Date(message.created_at), "h:mm a")}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export const AlterationChatDrawer = ({
  ticketId,
  ticketNumber,
  senderType,
  otherPartyName,
}: AlterationChatDrawerProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    isLoading, 
    unreadCount, 
    sendMessage, 
    markMessagesAsRead,
    isSending 
  } = useAlterationChat(ticketId, senderType);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read when drawer opens
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markMessagesAsRead();
    }
  }, [isOpen, unreadCount, markMessagesAsRead]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    sendMessage(newMessage.trim());
    setNewMessage("");
  };

  const otherLabel = senderType === "customer" ? "Tailor" : "Customer";

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <MessageCircle className="h-4 w-4 mr-2" />
          Chat
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Alteration Chat
          </SheetTitle>
          <SheetDescription>
            {ticketNumber ? `Ticket #${ticketNumber}` : "Discuss alterations"} 
            {otherPartyName && ` with ${otherPartyName}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start the conversation about your alteration
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-1">
                {/* Date separators and messages */}
                {messages.map((message, index) => {
                  const isOwn = message.sender_id === user?.id;
                  const currentDate = format(new Date(message.created_at), "MMM d, yyyy");
                  const prevDate = index > 0 
                    ? format(new Date(messages[index - 1].created_at), "MMM d, yyyy") 
                    : null;
                  const showDateSeparator = currentDate !== prevDate;

                  return (
                    <div key={message.id}>
                      {showDateSeparator && (
                        <div className="flex items-center justify-center my-4">
                          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                            {currentDate}
                          </span>
                        </div>
                      )}
                      <MessageBubble 
                        message={message} 
                        isOwn={isOwn}
                        senderType={senderType}
                      />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {/* Message Input */}
          <form 
            onSubmit={handleSendMessage} 
            className="p-4 border-t bg-background"
          >
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={isSending}
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!newMessage.trim() || isSending}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};
