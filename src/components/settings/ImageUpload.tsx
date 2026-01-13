import { useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  currentImage: string | null;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  aspectRatio?: "square" | "banner";
  label: string;
  description?: string;
}

const ImageUpload = ({
  currentImage,
  onUpload,
  isUploading,
  aspectRatio = "square",
  label,
  description,
}: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    await onUpload(file);
    e.target.value = "";
  };

  const displayImage = previewUrl || currentImage;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {displayImage ? "Change" : "Upload"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-lg border-2 border-dashed cursor-pointer hover:border-primary/50 transition-colors bg-muted/30",
          aspectRatio === "square" ? "aspect-square max-w-[200px]" : "aspect-[3/1] w-full",
          displayImage && "border-solid border-border"
        )}
        onClick={handleClick}
      >
        {isUploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {displayImage ? (
          <img
            src={displayImage}
            alt={label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 mb-2" />
            <p className="text-xs">Click to upload</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
