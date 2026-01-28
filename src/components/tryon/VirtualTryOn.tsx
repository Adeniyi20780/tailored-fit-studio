import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shirt,
  Ruler,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Palette,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables, Json } from "@/integrations/supabase/types";

interface VirtualTryOnProps {
  product: Tables<"products">;
  onClose?: () => void;
}

interface FitRecommendation {
  fit_type: "slim" | "regular" | "relaxed";
  size_recommendation: string;
  notes: string[];
  confidence: number;
}

interface MeasurementData {
  id: string;
  measurement_name: string | null;
  height: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  shoulder_width: number | null;
  sleeve_length: number | null;
  inseam: number | null;
  neck: number | null;
  unit: string | null;
  additional_measurements: Json | null;
}

const fitTypes = [
  {
    id: "slim",
    name: "Slim Fit",
    description: "Close to body, modern look",
    ease: "1-2 inches ease",
  },
  {
    id: "regular",
    name: "Regular Fit",
    description: "Comfortable, classic fit",
    ease: "3-4 inches ease",
  },
  {
    id: "relaxed",
    name: "Relaxed Fit",
    description: "Loose, maximum comfort",
    ease: "5-6 inches ease",
  },
];

const VirtualTryOn = ({ product, onClose }: VirtualTryOnProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [measurements, setMeasurements] = useState<MeasurementData[]>([]);
  const [selectedMeasurement, setSelectedMeasurement] = useState<string | null>(null);
  const [selectedFit, setSelectedFit] = useState<"slim" | "regular" | "relaxed">("regular");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendation, setRecommendation] = useState<FitRecommendation | null>(null);

  useEffect(() => {
    if (user) {
      fetchMeasurements();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (product.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
  }, [product]);

  const fetchMeasurements = async () => {
    try {
      const { data, error } = await supabase
        .from("customer_measurements")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMeasurements(data || []);
      if (data && data.length > 0) {
        setSelectedMeasurement(data[0].id);
      }
    } catch (err) {
      console.error("Error fetching measurements:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeFit = async () => {
    if (!selectedMeasurement) return;

    const measurement = measurements.find((m) => m.id === selectedMeasurement);
    if (!measurement) return;

    setIsAnalyzing(true);

    // Simulate AI analysis (in production, this would call an edge function)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate recommendation based on measurements and fit type
    const notes: string[] = [];
    let confidence = 0.85;

    // Chest fit analysis
    if (measurement.chest) {
      const chestEase = selectedFit === "slim" ? 3 : selectedFit === "regular" ? 6 : 10;
      notes.push(`Chest: ${measurement.chest}cm with ${chestEase}cm ease for ${selectedFit} fit`);
    }

    // Shoulder analysis
    if (measurement.shoulder_width) {
      notes.push(`Shoulders will align perfectly at ${measurement.shoulder_width}cm`);
    }

    // Sleeve length
    if (measurement.sleeve_length) {
      notes.push(`Sleeve length adjusted to ${measurement.sleeve_length}cm`);
    }

    // Category-specific recommendations
    if (product.category.toLowerCase().includes("suit") || product.category.toLowerCase().includes("shirt")) {
      if (measurement.neck) {
        notes.push(`Collar size: ${Math.round(measurement.neck / 2.54)}" (${measurement.neck}cm)`);
      }
    }

    if (product.category.toLowerCase().includes("jean") || product.category.toLowerCase().includes("trouser")) {
      if (measurement.waist && measurement.inseam) {
        notes.push(`Waist: ${Math.round(measurement.waist / 2.54)}" x Inseam: ${Math.round(measurement.inseam / 2.54)}"`);
      }
    }

    // Size recommendation logic
    let sizeRec = "Custom";
    if (measurement.chest) {
      if (measurement.chest < 88) sizeRec = "XS/S";
      else if (measurement.chest < 96) sizeRec = "S/M";
      else if (measurement.chest < 104) sizeRec = "M/L";
      else if (measurement.chest < 112) sizeRec = "L/XL";
      else sizeRec = "XL/XXL";
    }

    setRecommendation({
      fit_type: selectedFit,
      size_recommendation: sizeRec,
      notes,
      confidence,
    });

    setIsAnalyzing(false);
  };

  const formatMeasurement = (value: number | null, unit: string | null) => {
    if (value === null) return "—";
    return `${value}${unit || "cm"}`;
  };

  const currentMeasurement = measurements.find((m) => m.id === selectedMeasurement);

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your measurements...</p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="py-12 text-center">
          <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-display text-xl font-semibold mb-2">Sign In Required</h3>
          <p className="text-muted-foreground mb-4">
            Please sign in to use the virtual try-on feature with your saved measurements.
          </p>
          <Button asChild>
            <a href="/auth">Sign In</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Virtual Try-On
            </CardTitle>
            <CardDescription>
              See how {product.name} would fit based on your measurements
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {measurements.length === 0 ? (
          <div className="text-center py-8 bg-muted/30 rounded-lg">
            <Ruler className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No Measurements Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Use our AI body scanner to get your measurements first.
            </p>
            <Button asChild>
              <a href="/body-scanner">Start AI Body Scan</a>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Side - Configuration */}
            <div className="space-y-6">
              {/* Measurement Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Select Measurement Profile
                </Label>
                <Select
                  value={selectedMeasurement || undefined}
                  onValueChange={setSelectedMeasurement}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your measurements" />
                  </SelectTrigger>
                  <SelectContent>
                    {measurements.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.measurement_name || `Measurement ${m.id.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Current Measurements Display */}
              {currentMeasurement && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Ruler className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Your Measurements</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Chest:</span>{" "}
                      {formatMeasurement(currentMeasurement.chest, currentMeasurement.unit)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Waist:</span>{" "}
                      {formatMeasurement(currentMeasurement.waist, currentMeasurement.unit)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Shoulder:</span>{" "}
                      {formatMeasurement(currentMeasurement.shoulder_width, currentMeasurement.unit)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sleeve:</span>{" "}
                      {formatMeasurement(currentMeasurement.sleeve_length, currentMeasurement.unit)}
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Fit Type Selection */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Choose Fit Style</Label>
                <RadioGroup
                  value={selectedFit}
                  onValueChange={(v) => {
                    setSelectedFit(v as typeof selectedFit);
                    setRecommendation(null);
                  }}
                  className="space-y-3"
                >
                  {fitTypes.map((fit) => (
                    <div
                      key={fit.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedFit === fit.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-muted-foreground/30"
                      }`}
                      onClick={() => {
                        setSelectedFit(fit.id as typeof selectedFit);
                        setRecommendation(null);
                      }}
                    >
                      <RadioGroupItem value={fit.id} id={fit.id} className="mt-1" />
                      <div className="flex-1">
                        <Label
                          htmlFor={fit.id}
                          className="font-medium cursor-pointer"
                        >
                          {fit.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">{fit.description}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {fit.ease}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Select Color
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                          selectedColor === color
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={analyzeFit}
                disabled={!selectedMeasurement || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Fit...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze How It Fits
                  </>
                )}
              </Button>
            </div>

            {/* Right Side - Visualization & Results */}
            <div className="space-y-4">
              {/* Product Preview */}
              <div className="aspect-square bg-muted/30 rounded-lg overflow-hidden relative">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Shirt className="w-24 h-24 text-muted-foreground/30" />
                  </div>
                )}

                {/* Fit Overlay */}
                <AnimatePresence>
                  {recommendation && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4"
                    >
                      <div className="text-white">
                        <Badge className="bg-success mb-2">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {Math.round(recommendation.confidence * 100)}% Confidence
                        </Badge>
                        <p className="font-semibold">
                          Recommended: {recommendation.size_recommendation}
                        </p>
                        <p className="text-sm text-white/80">
                          {recommendation.fit_type.charAt(0).toUpperCase() + recommendation.fit_type.slice(1)} Fit
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Fit Analysis Results */}
              <AnimatePresence>
                {recommendation && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-4 bg-success/10 border border-success/30 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span className="font-semibold text-success">Fit Analysis Complete</span>
                    </div>

                    <div className="space-y-2">
                      {recommendation.notes.map((note, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          <span>{note}</span>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Based on your measurements, we recommend:</p>
                        <p className="text-lg font-display font-semibold">
                          Custom tailored to your exact measurements
                        </p>
                      </div>
                      <Button size="sm" asChild>
                        <a href={`/customize?productId=${product.id}`}>
                          Customize Now
                        </a>
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!recommendation && (
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <Info className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click "Analyze How It Fits" to see personalized recommendations
                    based on your measurements and preferred fit style.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VirtualTryOn;
