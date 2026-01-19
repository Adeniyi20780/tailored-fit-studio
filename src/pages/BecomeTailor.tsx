import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Scissors, 
  Store, 
  MapPin, 
  FileText, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Sparkles
} from "lucide-react";
import MultiSelectTags from "@/components/products/MultiSelectTags";

const SPECIALTIES = [
  "Suits",
  "Dresses",
  "Traditional Wear",
  "Casual Wear",
  "Formal Wear",
  "Bridal",
  "Alterations",
  "Bespoke",
  "Kaftans",
  "Shirts",
];

const BecomeTailor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    storeName: "",
    storeSlug: "",
    location: "",
    description: "",
    specialties: [] as string[],
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleStoreNameChange = (value: string) => {
    setFormData({
      ...formData,
      storeName: value,
      storeSlug: generateSlug(value),
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to continue");
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      // First, add the tailor role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: "tailor",
        });

      if (roleError && !roleError.message.includes("duplicate")) {
        throw roleError;
      }

      // Then create the tailor store
      const { error: storeError } = await supabase
        .from("tailors")
        .insert({
          user_id: user.id,
          store_name: formData.storeName,
          store_slug: formData.storeSlug,
          location: formData.location,
          description: formData.description,
          specialties: formData.specialties,
          is_active: true,
        });

      if (storeError) throw storeError;

      toast.success("Congratulations! Your tailor store has been created.");
      navigate("/store");
    } catch (error: any) {
      console.error("Error creating store:", error);
      toast.error(error.message || "Failed to create store");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.storeName.length >= 3 && formData.storeSlug.length >= 3;
      case 2:
        return formData.location.length >= 3;
      case 3:
        return formData.description.length >= 20 && formData.specialties.length >= 1;
      default:
        return true;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
              <p className="text-muted-foreground mb-6">
                Please sign in or create an account to become a tailor.
              </p>
              <Button onClick={() => navigate("/auth")}>
                Sign In to Continue
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Scissors className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-2">
              Become a Tailor
            </h1>
            <p className="text-muted-foreground">
              Set up your store and start selling your creations
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Step {step} of {totalSteps}</span>
              <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {step === 1 && <><Store className="h-5 w-5" /> Store Name</>}
                {step === 2 && <><MapPin className="h-5 w-5" /> Location</>}
                {step === 3 && <><FileText className="h-5 w-5" /> About Your Store</>}
                {step === 4 && <><CheckCircle className="h-5 w-5" /> Review & Create</>}
              </CardTitle>
              <CardDescription>
                {step === 1 && "Choose a unique name for your tailor store"}
                {step === 2 && "Where is your store located?"}
                {step === 3 && "Tell customers about your expertise"}
                {step === 4 && "Review your store details before creating"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="store-name">Store Name</Label>
                    <Input
                      id="store-name"
                      placeholder="e.g., Royal Tailors"
                      value={formData.storeName}
                      onChange={(e) => handleStoreNameChange(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="store-slug">Store URL</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">/tailor/</span>
                      <Input
                        id="store-slug"
                        placeholder="royal-tailors"
                        value={formData.storeSlug}
                        onChange={(e) => setFormData({ ...formData, storeSlug: generateSlug(e.target.value) })}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This will be your unique store URL
                    </p>
                  </div>
                </>
              )}

              {step === 2 && (
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Lagos, Nigeria"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    This helps customers find local tailors
                  </p>
                </div>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="description">Store Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell customers about your experience, style, and what makes your work special..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 20 characters
                    </p>
                  </div>
                  <div className="space-y-2">
                    <MultiSelectTags
                      label="Specialties"
                      values={formData.specialties}
                      onChange={(specialties) => setFormData({ ...formData, specialties })}
                      suggestions={SPECIALTIES}
                      placeholder="Add specialty..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Select at least one specialty
                    </p>
                  </div>
                </>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Store Name</span>
                      <p className="font-medium">{formData.storeName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Store URL</span>
                      <p className="font-medium">/tailor/{formData.storeSlug}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Location</span>
                      <p className="font-medium">{formData.location}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Description</span>
                      <p className="font-medium">{formData.description}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Specialties</span>
                      <p className="font-medium">{formData.specialties.join(", ")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-sm">
                      You're almost there! Click "Create Store" to launch your tailor business.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  disabled={step === 1}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                {step < totalSteps ? (
                  <Button
                    onClick={() => setStep(step + 1)}
                    disabled={!canProceed()}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Store
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BecomeTailor;
