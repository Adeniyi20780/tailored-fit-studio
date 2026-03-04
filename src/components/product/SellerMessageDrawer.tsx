import { useState } from "react";
import { X, Send, ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface SellerMessageDrawerProps {
  open: boolean;
  onClose: () => void;
  sellerName: string;
  sellerLogo?: string | null;
  sellerSlug: string;
  productName?: string;
}

const SellerMessageDrawer = ({
  open,
  onClose,
  sellerName,
  sellerLogo,
  sellerSlug,
  productName,
}: SellerMessageDrawerProps) => {
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const quickLinks = [
    { label: "Full item details", href: "#details" },
    { label: "Frequently asked questions", href: "#faq" },
  ];

  const handleSend = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to message sellers",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    if (!message.trim()) return;

    toast({
      title: "Message sent",
      description: `Your message has been sent to ${sellerName}. They typically respond within a few hours.`,
    });
    setMessage("");
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
            {sellerLogo ? (
              <img src={sellerLogo} alt={sellerName} className="w-full h-full object-cover" />
            ) : (
              <MessageCircle className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {sellerName}
            </p>
            <p className="text-xs text-muted-foreground">
              Typically responds within a few hours
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Quick answer links */}
          <p className="text-sm text-muted-foreground text-center">
            You might find your answer faster here:
          </p>
          <div className="flex flex-col gap-2">
            {quickLinks.map((link) => (
              <Button
                key={link.label}
                variant="outline"
                className="justify-between w-full text-left"
                onClick={() => {
                  onClose();
                  const el = document.querySelector(link.href);
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span>{link.label}</span>
                <ArrowRight className="h-4 w-4 ml-2 shrink-0" />
              </Button>
            ))}
          </div>

          <Separator />

          {/* Messaging policy */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Messaging Policy</h4>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
              <li>Keep conversations respectful and professional</li>
              <li>Do not share personal contact info or payment details</li>
              <li>All transactions should happen through the platform</li>
              <li>We scan and review messages for fraud prevention, policy enforcement, security, and support</li>
            </ul>
          </div>

          {productName && (
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Enquiring about:</p>
              <p className="text-sm font-medium text-foreground mt-1">{productName}</p>
            </div>
          )}
        </div>

        {/* Message input */}
        <div className="border-t border-border p-4 space-y-3">
          <Textarea
            placeholder="Write a message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <Button
            className="w-full gap-2"
            onClick={handleSend}
            disabled={!message.trim()}
          >
            <Send className="h-4 w-4" />
            Send Message
          </Button>
        </div>
      </div>
    </>
  );
};

export default SellerMessageDrawer;
