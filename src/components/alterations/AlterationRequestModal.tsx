import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCustomerAlterationTickets } from "@/hooks/useAlterationTickets";
import { Loader2 } from "lucide-react";

interface AlterationRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  tailorId: string;
  orderNumber: string;
}

const ISSUE_TYPES = [
  { value: "fit_too_tight", label: "Fit is too tight" },
  { value: "fit_too_loose", label: "Fit is too loose" },
  { value: "length_adjustment", label: "Length adjustment needed" },
  { value: "sleeve_adjustment", label: "Sleeve adjustment needed" },
  { value: "waist_adjustment", label: "Waist adjustment needed" },
  { value: "shoulder_adjustment", label: "Shoulder adjustment needed" },
  { value: "other", label: "Other issue" },
];

export const AlterationRequestModal = ({
  open,
  onOpenChange,
  orderId,
  tailorId,
  orderNumber,
}: AlterationRequestModalProps) => {
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const { createTicket, isCreating } = useCustomerAlterationTickets();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createTicket.mutateAsync({
      order_id: orderId,
      tailor_id: tailorId,
      issue_type: issueType,
      description,
    });

    setIssueType("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Alteration - {orderNumber}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="issue-type">Issue Type</Label>
            <Select value={issueType} onValueChange={setIssueType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select the issue type" />
              </SelectTrigger>
              <SelectContent>
                {ISSUE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Describe the Issue</Label>
            <Textarea
              id="description"
              placeholder="Please describe in detail what needs to be altered..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <p className="font-medium text-foreground">Perfect Fit Guarantee</p>
            <p className="text-muted-foreground mt-1">
              Our tailors will work with you to ensure your garment fits perfectly. 
              Most alterations are completed within 5-7 business days.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !issueType || !description}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
