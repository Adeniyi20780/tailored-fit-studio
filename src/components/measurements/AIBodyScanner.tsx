import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Camera, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Pause, 
  Ruler, 
  User,
  ArrowRight,
  Loader2,
  RefreshCw,
  Save
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface MeasurementResult {
  measurements: {
    height: number;
    neck_circumference: number;
    shoulder_width: number;
    chest_circumference: number;
    bust_circumference: number;
    underbust_circumference: number;
    waist_circumference: number;
    hip_circumference: number;
    arm_length: number;
    forearm_length: number;
    wrist_circumference: number;
    bicep_circumference: number;
    inseam: number;
    outseam: number;
    thigh_circumference: number;
    knee_circumference: number;
    calf_circumference: number;
    ankle_circumference: number;
    back_width: number;
    front_body_length: number;
    back_body_length: number;
    shoulder_to_waist_front: number;
    shoulder_to_waist_back: number;
    waist_to_hip: number;
    crotch_depth: number;
    rise_front: number;
    rise_back: number;
    across_chest: number;
    across_back: number;
    sleeve_length: number;
    upper_arm_length: number;
    armhole_depth: number;
  };
  confidence_scores: {
    overall: number;
    upper_body: number;
    lower_body: number;
    arms: number;
  };
  fit_recommendations: {
    shirt_size: string;
    pants_size: string;
    suit_size: string;
    body_type: string;
  };
  notes: string;
}

type Step = "intro" | "setup" | "capture" | "analyzing" | "results";

const AIBodyScanner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<Step>("intro");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [result, setResult] = useState<MeasurementResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Unable to access camera. Please ensure camera permissions are granted.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (step === "capture") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step]);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8);
  }, []);

  const startCapture = async () => {
    setIsCapturing(true);
    setCapturedFrames([]);
    setCaptureProgress(0);
    setError(null);

    const frames: string[] = [];
    const totalFrames = 12; // Capture 12 frames over ~30 seconds (every 2.5 seconds)
    const intervalMs = 2500;

    for (let i = 0; i < totalFrames; i++) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      const frame = captureFrame();
      if (frame) {
        frames.push(frame);
        setCapturedFrames([...frames]);
        setCaptureProgress(((i + 1) / totalFrames) * 100);
      }
    }

    setIsCapturing(false);
    setCapturedFrames(frames);
    
    if (frames.length >= 6) {
      analyzeFrames(frames);
    } else {
      setError("Not enough frames captured. Please try again with better lighting.");
    }
  };

  const analyzeFrames = async (frames: string[]) => {
    setStep("analyzing");
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("analyze-body-measurements", {
        body: {
          images: frames,
          height_cm: parseFloat(height),
          gender,
        },
      });

      if (fnError) throw fnError;

      setResult(data);
      setStep("results");
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "Failed to analyze images. Please try again.");
      setStep("capture");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveMeasurements = async () => {
    if (!user || !result) return;

    setIsSaving(true);
    try {
      const measurementData = {
        user_id: user.id,
        measurement_name: `AI Scan - ${new Date().toLocaleDateString()}`,
        height: result.measurements.height,
        chest: result.measurements.chest_circumference,
        waist: result.measurements.waist_circumference,
        hips: result.measurements.hip_circumference,
        shoulder_width: result.measurements.shoulder_width,
        sleeve_length: result.measurements.sleeve_length,
        inseam: result.measurements.inseam,
        neck: result.measurements.neck_circumference,
        unit: "cm",
        additional_measurements: {
          bust: result.measurements.bust_circumference,
          underbust: result.measurements.underbust_circumference,
          arm_length: result.measurements.arm_length,
          wrist: result.measurements.wrist_circumference,
          bicep: result.measurements.bicep_circumference,
          thigh: result.measurements.thigh_circumference,
          knee: result.measurements.knee_circumference,
          calf: result.measurements.calf_circumference,
          ankle: result.measurements.ankle_circumference,
          back_width: result.measurements.back_width,
          confidence_scores: result.confidence_scores,
          fit_recommendations: result.fit_recommendations,
        },
      };

      const { error } = await supabase
        .from("customer_measurements")
        .insert(measurementData);

      if (error) throw error;

      toast({
        title: "Measurements Saved!",
        description: "Your AI-generated measurements have been saved to your profile.",
      });
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetScanner = () => {
    setStep("intro");
    setCapturedFrames([]);
    setCaptureProgress(0);
    setResult(null);
    setError(null);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Ruler className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="font-display text-2xl">AI Body Measurement Scanner</CardTitle>
        <CardDescription>
          Get accurate measurements in 30 seconds using your camera
        </CardDescription>
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          {/* Step 1: Intro */}
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1">Stand in Place</h3>
                  <p className="text-sm text-muted-foreground">
                    Position yourself 6-8 feet from the camera
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <RotateCcw className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1">Slow 360° Spin</h3>
                  <p className="text-sm text-muted-foreground">
                    Rotate slowly in place over 30 seconds
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1">Get Measurements</h3>
                  <p className="text-sm text-muted-foreground">
                    AI extracts 30+ body measurements
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  For Best Results
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Wear form-fitting clothing (avoid loose/baggy clothes)</li>
                  <li>• Ensure good, even lighting</li>
                  <li>• Stand against a plain background</li>
                  <li>• Keep arms slightly away from body</li>
                </ul>
              </div>

              <Button onClick={() => setStep("setup")} className="w-full" size="lg">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Setup */}
          {step === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="height">Your Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="175"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This is used as a reference for accurate measurements
                  </p>
                </div>

                <div>
                  <Label>Gender</Label>
                  <RadioGroup
                    value={gender}
                    onValueChange={(v) => setGender(v as "male" | "female")}
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("intro")} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep("capture")}
                  className="flex-1"
                  disabled={!height || parseFloat(height) < 100 || parseFloat(height) > 250}
                >
                  Start Capture
                  <Camera className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Capture */}
          {step === "capture" && (
            <motion.div
              key="capture"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {isCapturing && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/50 rounded-full p-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 30, ease: "linear", repeat: Infinity }}
                      >
                        <RotateCcw className="w-12 h-12 text-white" />
                      </motion.div>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-4 left-4 right-4">
                  <Progress value={captureProgress} className="h-2" />
                  <p className="text-white text-sm text-center mt-2">
                    {isCapturing
                      ? `Capturing... ${Math.round(captureProgress)}% - Rotate slowly`
                      : "Position yourself and press Start"}
                  </p>
                </div>

                {capturedFrames.length > 0 && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-black/50 text-white">
                      {capturedFrames.length} frames
                    </Badge>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("setup")} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={startCapture}
                  className="flex-1"
                  disabled={isCapturing}
                >
                  {isCapturing ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Capturing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Capture
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Analyzing */}
          {step === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent mx-auto mb-6"
              />
              <h3 className="text-xl font-semibold mb-2">Analyzing Your Body Measurements</h3>
              <p className="text-muted-foreground">
                Our AI is extracting 30+ measurements from your scan...
              </p>
            </motion.div>
          )}

          {/* Step 5: Results */}
          {step === "results" && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Confidence Score */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Confidence</p>
                  <p className="text-2xl font-bold">{result.confidence_scores.overall}%</p>
                </div>
                <Badge variant={result.confidence_scores.overall >= 80 ? "default" : "secondary"}>
                  {result.confidence_scores.overall >= 80 ? "High Accuracy" : "Moderate Accuracy"}
                </Badge>
              </div>

              {/* Fit Recommendations */}
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Shirt</p>
                  <p className="font-bold">{result.fit_recommendations.shirt_size}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Pants</p>
                  <p className="font-bold">{result.fit_recommendations.pants_size}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Suit</p>
                  <p className="font-bold">{result.fit_recommendations.suit_size}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Body Type</p>
                  <p className="font-bold text-xs">{result.fit_recommendations.body_type}</p>
                </div>
              </div>

              {/* Measurements List */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    View All {Object.keys(result.measurements).length} Measurements
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Your Measurements</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Upper Body</h4>
                        <div className="space-y-2">
                          {[
                            ["Neck", result.measurements.neck_circumference],
                            ["Shoulder Width", result.measurements.shoulder_width],
                            ["Chest", result.measurements.chest_circumference],
                            ["Bust", result.measurements.bust_circumference],
                            ["Waist", result.measurements.waist_circumference],
                            ["Back Width", result.measurements.back_width],
                          ].map(([label, value]) => (
                            <div key={label as string} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{label}</span>
                              <span className="font-medium">{value} cm</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Arms</h4>
                        <div className="space-y-2">
                          {[
                            ["Arm Length", result.measurements.arm_length],
                            ["Sleeve Length", result.measurements.sleeve_length],
                            ["Bicep", result.measurements.bicep_circumference],
                            ["Wrist", result.measurements.wrist_circumference],
                          ].map(([label, value]) => (
                            <div key={label as string} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{label}</span>
                              <span className="font-medium">{value} cm</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Lower Body</h4>
                        <div className="space-y-2">
                          {[
                            ["Hips", result.measurements.hip_circumference],
                            ["Inseam", result.measurements.inseam],
                            ["Outseam", result.measurements.outseam],
                            ["Thigh", result.measurements.thigh_circumference],
                            ["Knee", result.measurements.knee_circumference],
                            ["Calf", result.measurements.calf_circumference],
                            ["Ankle", result.measurements.ankle_circumference],
                          ].map(([label, value]) => (
                            <div key={label as string} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{label}</span>
                              <span className="font-medium">{value} cm</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>

              {/* Key Measurements Preview */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Chest", result.measurements.chest_circumference],
                  ["Waist", result.measurements.waist_circumference],
                  ["Hips", result.measurements.hip_circumference],
                  ["Shoulder", result.measurements.shoulder_width],
                  ["Sleeve", result.measurements.sleeve_length],
                  ["Inseam", result.measurements.inseam],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between p-3 border rounded-lg">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold">{value} cm</span>
                  </div>
                ))}
              </div>

              {result.notes && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">{result.notes}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={resetScanner} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Scan Again
                </Button>
                <Button onClick={saveMeasurements} className="flex-1" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Measurements
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default AIBodyScanner;
