import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Simple notification sound using Web Audio API
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // First tone
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.frequency.value = 587.33; // D5
    osc1.type = "sine";
    gain1.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.3);

    // Second tone
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.frequency.value = 783.99; // G5
    osc2.type = "sine";
    gain2.gain.setValueAtTime(0.15, audioCtx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
    osc2.start(audioCtx.currentTime + 0.15);
    osc2.stop(audioCtx.currentTime + 0.45);
  } catch {
    // Audio not available
  }
};

const showBrowserNotification = (title: string, body: string) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: "new-message",
    });
  }
};

export const useMessageNotification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const hasSetupRef = useRef(false);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user || hasSetupRef.current) return;
    hasSetupRef.current = true;

    const channel = supabase
      .channel("global-message-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "seller_messages",
        },
        (payload) => {
          const msg = payload.new as any;
          // Only notify if message is for us and we didn't send it
          if (msg.receiver_id === user.id && msg.sender_id !== user.id) {
            playNotificationSound();
            
            // Show in-app toast
            toast({
              title: "New message",
              description: msg.content?.length > 60 
                ? msg.content.slice(0, 60) + "…" 
                : msg.content,
            });

            // Show browser notification if page not focused
            if (document.hidden) {
              showBrowserNotification("New message", msg.content || "You have a new message");
            }
          }
        }
      )
      .subscribe();

    return () => {
      hasSetupRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [user, toast]);
};
