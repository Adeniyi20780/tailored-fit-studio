import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCustomerAlterationTickets } from "@/hooks/useAlterationTickets";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

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

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const AlterationRequestModal = ({
  open,
  onOpenChange,
  orderId,
  tailorId,
  orderNumber,
}: AlterationRequestModalProps) => {
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { createTicket, isCreating } = useCustomerAlterationTickets();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`You can only upload up to ${MAX_IMAGES} images`);
      return;
    }

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is larger than 5MB`);
        return false;
      }
      return true;
    });

    setImages((prev) => [...prev, ...validFiles]);
    
    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    const uploadedUrls: string[] = [];
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("User not authenticated");

    for (const file of images) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${orderId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("alteration-images")
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("alteration-images")
        .getPublicUrl(data.path);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsUploading(true);
      const imageUrls = await uploadImages();
      
      await createTicket.mutateAsync({
        order_id: orderId,
        tailor_id: tailorId,
        issue_type: issueType,
        description,
        images: imageUrls.length > 0 ? imageUrls : undefined,
      });

      setIssueType("");
      setDescription("");
      setImages([]);
      setPreviews([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting alteration request:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const isSubmitting = isCreating || isUploading;

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

          <div className="space-y-2">
            <Label>Upload Photos (Optional)</Label>
            <p className="text-xs text-muted-foreground">
              Add photos to help the tailor understand the fit issue. Max {MAX_IMAGES} images, 5MB each.
            </p>
            
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length < MAX_IMAGES && (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-2 pb-3">
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload images
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
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
            <Button type="submit" disabled={isSubmitting || !issueType || !description}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUploading ? "Uploading..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
