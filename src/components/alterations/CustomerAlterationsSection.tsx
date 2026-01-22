import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Scissors, CheckCircle, Clock, XCircle, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { AlterationChatDrawer } from "@/components/chat/AlterationChatDrawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pending: { label: "Pending", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: "In Progress", variant: "default", icon: <Scissors className="h-3 w-3" /> },
  completed: { label: "Completed", variant: "outline", icon: <CheckCircle className="h-3 w-3" /> },
  rejected: { label: "Rejected", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

const issueTypeLabels: Record<string, string> = {
  fit_too_tight: "Fit too tight",
  fit_too_loose: "Fit too loose",
  length_adjustment: "Length adjustment",
  sleeve_adjustment: "Sleeve adjustment",
  waist_adjustment: "Waist adjustment",
  shoulder_adjustment: "Shoulder adjustment",
  other: "Other issue",
};

interface AlterationTicket {
  id: string;
  order_id: string;
  issue_type: string;
  description: string;
  status: string;
  resolution: string | null;
  images: string[] | null;
  created_at: string;
  order: {
    order_number: string;
    product: {
      name: string;
    } | null;
  } | null;
  tailor: {
    store_name: string;
  } | null;
}

export const CustomerAlterationsSection = () => {
  const { user } = useAuth();
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["customer-alterations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("alteration_tickets")
        .select(`
          id,
          order_id,
          issue_type,
          description,
          status,
          resolution,
          images,
          created_at,
          tailor_id
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch related order and tailor data
      const ticketsWithDetails = await Promise.all(
        data.map(async (ticket) => {
          // Fetch order details
          const { data: orderData } = await supabase
            .from("orders")
            .select("order_number, product_id")
            .eq("id", ticket.order_id)
            .maybeSingle();

          let productData = null;
          if (orderData?.product_id) {
            const { data: product } = await supabase
              .from("products")
              .select("name")
              .eq("id", orderData.product_id)
              .maybeSingle();
            productData = product;
          }

          // Fetch tailor details
          const { data: tailorData } = await supabase
            .from("tailors")
            .select("store_name")
            .eq("id", ticket.tailor_id)
            .maybeSingle();

          return {
            ...ticket,
            order: orderData ? { ...orderData, product: productData } : null,
            tailor: tailorData,
          };
        })
      );

      return ticketsWithDetails as AlterationTicket[];
    },
    enabled: !!user,
  });

  const openImageModal = (images: string[]) => {
    setSelectedImages(images);
    setImageModalOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="h-5 w-5" />
          My Alteration Requests
        </CardTitle>
        <CardDescription>
          Track your fit adjustment requests and communicate with tailors
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!tickets?.length ? (
          <p className="text-center text-muted-foreground py-8">
            No alteration requests yet
          </p>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const status = statusConfig[ticket.status] || statusConfig.pending;

              return (
                <div
                  key={ticket.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        Order: {ticket.order?.order_number || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {ticket.order?.product?.name || "Product"} • {ticket.tailor?.store_name || "Tailor"}
                      </p>
                    </div>
                    <Badge variant={status.variant} className="flex items-center gap-1">
                      {status.icon}
                      {status.label}
                    </Badge>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Issue: </span>
                    {issueTypeLabels[ticket.issue_type] || ticket.issue_type}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {ticket.description}
                  </p>

                  {ticket.images && ticket.images.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openImageModal(ticket.images!)}
                        className="gap-1"
                      >
                        <ImageIcon className="h-3 w-3" />
                        View {ticket.images.length} Photo{ticket.images.length > 1 ? "s" : ""}
                      </Button>
                    </div>
                  )}

                  {ticket.resolution && (
                    <div className="bg-muted/50 p-3 rounded text-sm">
                      <span className="font-medium">Resolution: </span>
                      {ticket.resolution}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Submitted {format(new Date(ticket.created_at), "MMM d, yyyy")}
                    </p>
                    <AlterationChatDrawer
                      ticketId={ticket.id}
                      ticketNumber={ticket.order?.order_number}
                      senderType="customer"
                      otherPartyName={ticket.tailor?.store_name}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Alteration Photos</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {selectedImages.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-lg overflow-hidden border hover:opacity-90 transition-opacity"
              >
                <img
                  src={url}
                  alt={`Alteration photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
