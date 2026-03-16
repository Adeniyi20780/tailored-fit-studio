import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Store,
  MapPin,
  FileText,
  Save,
  ArrowLeft,
  Loader2,
  Tags,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import ImageUpload from "@/components/settings/ImageUpload";
import { useTailorSettings } from "@/hooks/useTailorSettings";
import { toast } from "sonner";

const settingsSchema = z.object({
  store_name: z.string().trim().min(2, "Store name must be at least 2 characters").max(100, "Store name must be less than 100 characters"),
  description: z.string().trim().max(500, "Description must be less than 500 characters").optional().nullable(),
  location: z.string().trim().max(200, "Location must be less than 200 characters").optional().nullable(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const SPECIALTY_OPTIONS = [
  "Suits",
  "Shirts",
  "Traditional",
  "Kaftans",
  "Wedding",
  "Corporate",
  "Casual",
  "Alterations",
  "Bespoke",
  "Ready-to-Wear",
];

const StoreSettings = () => {
  const navigate = useNavigate();
  const { tailor, isLoading, updateSettingsAsync, isUpdating, uploadImage } = useTailorSettings();
  
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      store_name: "",
      description: "",
      location: "",
    },
  });

  // Populate form when tailor data loads
  useEffect(() => {
    if (tailor) {
      form.reset({
        store_name: tailor.store_name,
        description: tailor.description || "",
        location: tailor.location || "",
      });
      setLogoUrl(tailor.logo_url);
      setBannerUrl(tailor.banner_url);
      setSelectedSpecialties(tailor.specialties || []);
    }
  }, [tailor, form]);

  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const url = await uploadImage(file, "logo");
      setLogoUrl(url);
      await updateSettingsAsync({ logo_url: url });
    } catch (error) {
      toast.error("Failed to upload logo");
      console.error("Logo upload error:", error);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (file: File) => {
    setIsUploadingBanner(true);
    try {
      const url = await uploadImage(file, "banner");
      setBannerUrl(url);
      await updateSettingsAsync({ banner_url: url });
    } catch (error) {
      toast.error("Failed to upload banner");
      console.error("Banner upload error:", error);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  };

  const onSubmit = async (data: SettingsFormData) => {
    try {
      await updateSettingsAsync({
        ...data,
        specialties: selectedSpecialties.length > 0 ? selectedSpecialties : null,
      });
    } catch (error) {
      // Error handled in mutation
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6 lg:p-8 pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading store settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tailor) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6 lg:p-8 pt-24 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Store Not Found</h2>
              <p className="text-muted-foreground mb-6">
                You don't have a tailor store set up yet.
              </p>
              <Button onClick={() => navigate("/store")}>Go to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 lg:p-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Store Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your store profile and branding
            </p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Branding Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Store Branding
              </CardTitle>
              <CardDescription>
                Upload your logo and banner to personalize your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <ImageUpload
                  currentImage={logoUrl}
                  onUpload={handleLogoUpload}
                  isUploading={isUploadingLogo}
                  aspectRatio="square"
                  label="Store Logo"
                  description="Square image, recommended 400x400px"
                />
                <div className="md:col-span-1">
                  <ImageUpload
                    currentImage={bannerUrl}
                    onUpload={handleBannerUpload}
                    isUploading={isUploadingBanner}
                    aspectRatio="banner"
                    label="Store Banner"
                    description="Wide image, recommended 1200x400px"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Store Information
              </CardTitle>
              <CardDescription>
                Basic information about your tailoring business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="store_name">Store Name *</Label>
                <Input
                  id="store_name"
                  {...form.register("store_name")}
                  placeholder="Enter your store name"
                />
                {form.formState.errors.store_name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.store_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Tell customers about your store, your expertise, and what makes you unique..."
                  rows={4}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {form.watch("description")?.length || 0}/500 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  {...form.register("location")}
                  placeholder="City, Country"
                />
                {form.formState.errors.location && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.location.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Specialties */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Specialties
              </CardTitle>
              <CardDescription>
                Select the types of garments and services you specialize in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SPECIALTY_OPTIONS.map((specialty) => (
                  <Badge
                    key={specialty}
                    variant={selectedSpecialties.includes(specialty) ? "default" : "outline"}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => toggleSpecialty(specialty)}
                  >
                    {specialty}
                  </Badge>
                ))}
              </div>
              {selectedSpecialties.length > 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                  Selected: {selectedSpecialties.join(", ")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Store URL Info */}
          <Card>
            <CardHeader>
              <CardTitle>Store URL</CardTitle>
              <CardDescription>
                Your unique store identifier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">tailorsshop.com/store/</span>
                <span className="font-mono font-medium">{tailor.store_slug}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Store URLs cannot be changed after creation
              </p>
            </CardContent>
          </Card>

          <Separator />

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/store")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoreSettings;
