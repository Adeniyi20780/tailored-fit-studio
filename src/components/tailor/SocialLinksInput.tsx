import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Facebook, Instagram, Linkedin, Globe, MessageCircle } from "lucide-react";

export interface SocialLink {
  platform: string;
  url: string;
}

const SOCIAL_PLATFORMS = [
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "twitter", label: "X (Twitter)", icon: Globe },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "website", label: "Website", icon: Globe },
  { value: "tiktok", label: "TikTok", icon: Globe },
];

interface SocialLinksInputProps {
  value: SocialLink[];
  onChange: (links: SocialLink[]) => void;
  minRequired?: number;
}

const SocialLinksInput = ({ value, onChange, minRequired = 1 }: SocialLinksInputProps) => {
  const addLink = () => {
    onChange([...value, { platform: "", url: "" }]);
  };

  const removeLink = (index: number) => {
    if (value.length <= minRequired) return;
    onChange(value.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: keyof SocialLink, newValue: string) => {
    const updated = value.map((link, i) =>
      i === index ? { ...link, [field]: newValue } : link
    );
    onChange(updated);
  };

  const getIcon = (platform: string) => {
    const found = SOCIAL_PLATFORMS.find((p) => p.value === platform);
    if (!found) return Globe;
    return found.icon;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Business Social Media Links</Label>
        <span className="text-xs text-muted-foreground">
          Minimum {minRequired} required
        </span>
      </div>

      <div className="space-y-3">
        {value.map((link, index) => {
          const Icon = getIcon(link.platform);
          return (
            <div key={index} className="flex gap-2 items-start">
              <Select
                value={link.platform}
                onValueChange={(val) => updateLink(index, "platform", val)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Platform">
                    {link.platform && (
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="capitalize">{link.platform}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      <div className="flex items-center gap-2">
                        <platform.icon className="h-4 w-4" />
                        {platform.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="https://..."
                value={link.url}
                onChange={(e) => updateLink(index, "url", e.target.value)}
                className="flex-1"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeLink(index)}
                disabled={value.length <= minRequired}
                className="flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addLink}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Another Link
      </Button>

      <p className="text-xs text-muted-foreground">
        Add links to your business social media profiles so customers can connect with you
      </p>
    </div>
  );
};

export default SocialLinksInput;
