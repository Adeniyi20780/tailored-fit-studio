import { useTailorAlterationTickets } from "@/hooks/useAlterationTickets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Scissors, CheckCircle, Clock, XCircle, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface TailorAlterationsSectionProps {
  tailorId: string;
}

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

export const TailorAlterationsSection = ({ tailorId }: TailorAlterationsSectionProps) => {
  const { tickets, isLoading, updateTicket, isUpdating } = useTailorAlterationTickets(tailorId);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [resolution, setResolution] = useState("");
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const handleUpdate = async (ticketId: string) => {
    await updateTicket.mutateAsync({
      ticketId,
      status: newStatus,
      resolution: resolution || undefined,
    });
    setSelectedTicket(null);
    setNewStatus("");
    setResolution("");
  };

  const openImageModal = (images: string[]) => {
    setSelectedImages(images);
    setImageModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="h-5 w-5" />
          Alteration Requests
        </CardTitle>
        <CardDescription>
          Manage fit adjustment requests from customers
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
              const isEditing = selectedTicket === ticket.id;

              return (
                <div
                  key={ticket.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        Order: {ticket.order?.order_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {ticket.order?.product?.name}
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

                  <p className="text-xs text-muted-foreground">
                    Submitted {format(new Date(ticket.created_at), "MMM d, yyyy")}
                  </p>

                  {isEditing ? (
                    <div className="space-y-3 pt-2 border-t">
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder="Add resolution notes..."
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(ticket.id)}
                          disabled={!newStatus || isUpdating}
                        >
                          {isUpdating && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTicket(null);
                            setNewStatus("");
                            setResolution("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    ticket.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTicket(ticket.id)}
                      >
                        Update Status
                      </Button>
                    )
                  )}
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
