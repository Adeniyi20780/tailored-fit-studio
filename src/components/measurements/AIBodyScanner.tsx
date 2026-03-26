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
import { Slider } from "@/components/ui/slider";
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
  Save,
  Wand2,
  Sun,
  Timer,
  Contrast,
  Trash2,
  Maximize2,
  Minimize2
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useBodyScanJob } from "@/hooks/useBodyScanJob";
import { useCustomerMeasurements, useDeleteMeasurement } from "@/hooks/useCustomerMeasurements";
import { DEMO_MEASUREMENTS, generateDemoFrames } from "@/lib/demoScanData";

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

const TIMER_OPTIONS = [
  { label: "None", value: 0 },
  { label: "5s", value: 5 },
  { label: "10s", value: 10 },
  { label: "15s", value: 15 },
  { label: "20s", value: 20 },
];

const MAX_SAVED_MEASUREMENTS = 3;

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
  const [isSaving, setIsSaving] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [brightnessLevel, setBrightnessLevel] = useState<number>(128);
  const brightnessIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Manual brightness/contrast sliders
  const [manualBrightness, setManualBrightness] = useState(100);
  const [manualContrast, setManualContrast] = useState(100);

  // Timer countdown
  const [timerDuration, setTimerDuration] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Save naming dialog
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");

  // Height unit toggle
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");

  // Fullscreen camera
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Existing measurements for 3-cap enforcement
  const { data: existingMeasurements } = useCustomerMeasurements();
  const deleteMeasurement = useDeleteMeasurement();

  // Background job hook for async processing
  const {
    status: jobStatus,
    result: jobResult,
    error: jobError,
    isProcessing,
    submitScan,
    reset: resetJob,
  } = useBodyScanJob();

  // Update result when job completes
  useEffect(() => {
    if (jobResult) {
      setResult(jobResult as MeasurementResult);
      setStep("results");
    }
  }, [jobResult]);

  // Show error if job fails
  useEffect(() => {
    if (jobError && step === "analyzing") {
      toast({
        title: "Analysis Failed",
        description: jobError,
        variant: "destructive",
      });
      setStep("capture");
    }
  }, [jobError, step, toast]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
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
      toast({
        title: "Camera Access Required",
        description: "Unable to access camera. Try Demo Mode to test without a camera.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (step === "capture" && !isDemoMode) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step, isDemoMode, facingMode]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  // Measure average brightness from video feed
  const measureBrightness = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0) return;
    canvas.width = 160;
    canvas.height = 120;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, 160, 120);
    const imageData = ctx.getImageData(0, 0, 160, 120);
    const data = imageData.data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 16) {
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    const avg = sum / (data.length / 16);
    setBrightnessLevel(Math.round(avg));
  }, []);

  // Start brightness monitoring when camera is active
  useEffect(() => {
    if (step === "capture" && !isDemoMode) {
      brightnessIntervalRef.current = setInterval(measureBrightness, 1000);
    }
    return () => {
      if (brightnessIntervalRef.current) {
        clearInterval(brightnessIntervalRef.current);
        brightnessIntervalRef.current = null;
      }
    };
  }, [step, isDemoMode, measureBrightness]);

  // Enhance image: boost brightness & contrast for low-light frames
  const enhanceFrame = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    const avgLum = sum / (data.length / 4);

    if (avgLum < 120) {
      const brightnessFactor = Math.min(1.6, 130 / Math.max(avgLum, 30));
      const contrast = 1.15;
      const mid = 128;
      for (let i = 0; i < data.length; i += 4) {
        for (let c = 0; c < 3; c++) {
          let val = data[i + c];
          val = val * brightnessFactor;
          val = ((val - mid) * contrast) + mid;
          data[i + c] = Math.max(0, Math.min(255, val));
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    enhanceFrame(canvas);
    return canvas.toDataURL("image/jpeg", 0.92);
  }, [enhanceFrame]);

  // Countdown timer logic
  const startWithTimer = (captureFunc: () => void) => {
    if (timerDuration === 0) {
      captureFunc();
      return;
    }
    setCountdown(timerDuration);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = null;
          setCountdown(null);
          captureFunc();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const startCapture = async () => {
    setIsCapturing(true);
    setCapturedFrames([]);
    setCaptureProgress(0);

    const frames: string[] = [];
    const totalFrames = 16;
    const intervalMs = 1875;

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
      toast({
        title: "Capture Failed",
        description: "Not enough frames captured. Please try again with better lighting.",
        variant: "destructive",
      });
    }
  };

  const startDemoCapture = async () => {
    setIsCapturing(true);
    setCapturedFrames([]);
    setCaptureProgress(0);

    const demoFrames = generateDemoFrames();
    
    for (let i = 0; i < 12; i++) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setCapturedFrames(demoFrames.slice(0, i + 1));
      setCaptureProgress(((i + 1) / 12) * 100);
    }

    setIsCapturing(false);
    setCapturedFrames(demoFrames);
    
    setStep("analyzing");
    
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const adjustedMeasurements = { ...DEMO_MEASUREMENTS };
    const heightNum = parseFloat(height);
    const ratio = heightNum / 175;
    
    adjustedMeasurements.measurements = {
      ...adjustedMeasurements.measurements,
      height: heightNum,
      shoulder_width: Math.round(adjustedMeasurements.measurements.shoulder_width * ratio),
      chest_circumference: Math.round(adjustedMeasurements.measurements.chest_circumference * ratio),
      waist_circumference: Math.round(adjustedMeasurements.measurements.waist_circumference * ratio),
      hip_circumference: Math.round(adjustedMeasurements.measurements.hip_circumference * ratio),
      inseam: Math.round(adjustedMeasurements.measurements.inseam * ratio),
      sleeve_length: Math.round(adjustedMeasurements.measurements.sleeve_length * ratio),
    };

    setResult(adjustedMeasurements as MeasurementResult);
    setStep("results");
  };

  const analyzeFrames = async (frames: string[]) => {
    setStep("analyzing");
    await submitScan(frames, parseFloat(height), gender);
  };

  const handleSaveClick = () => {
    setSaveName(`${isDemoMode ? "[Demo] " : ""}AI Scan - ${new Date().toLocaleDateString()}`);
    setShowSaveDialog(true);
  };

  const saveMeasurements = async () => {
    if (!user || !result) return;

    // Check 3-measurement limit
    const count = existingMeasurements?.length ?? 0;
    if (count >= MAX_SAVED_MEASUREMENTS) {
      toast({
        title: "Measurement Limit Reached",
        description: `You can only save ${MAX_SAVED_MEASUREMENTS} measurements. Delete one first.`,
        variant: "destructive",
      });
      setShowSaveDialog(false);
      return;
    }

    if (!saveName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your measurements.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const measurementData = {
        user_id: user.id,
        measurement_name: saveName.trim(),
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
          is_demo: isDemoMode,
        },
      };

      const { error } = await supabase
        .from("customer_measurements")
        .insert(measurementData);

      if (error) throw error;

      toast({
        title: "Measurements Saved!",
        description: `Your measurements "${saveName}" have been saved to your profile.`,
      });
      setShowSaveDialog(false);
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

  const handleDeleteMeasurement = async (id: string) => {
    try {
      await deleteMeasurement.mutateAsync(id);
      toast({
        title: "Measurement Deleted",
        description: "You can now save a new measurement.",
      });
    } catch {
      toast({
        title: "Delete Failed",
        description: "Could not delete the measurement.",
        variant: "destructive",
      });
    }
  };

  const resetScanner = () => {
    setStep("intro");
    setCapturedFrames([]);
    setCaptureProgress(0);
    setResult(null);
    setIsDemoMode(false);
    setManualBrightness(100);
    setManualContrast(100);
    setTimerDuration(0);
    setCountdown(null);
    setHeightUnit("cm");
    setHeightFeet("");
    setHeightInches("");
    setIsFullscreen(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
    resetJob();
  };

  const handleStartDemo = () => {
    setIsDemoMode(true);
    setStep("setup");
  };

  const canSave = isDemoMode || result?.confidence_scores.overall !== undefined && result.confidence_scores.overall >= 75;
  const measurementCount = existingMeasurements?.length ?? 0;
  const atLimit = measurementCount >= MAX_SAVED_MEASUREMENTS;

  return (
    <Card className="max-w-2xl mx-auto w-full">
      <CardHeader className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Ruler className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="font-display text-2xl">AI Body Measurement Scanner</CardTitle>
        <CardDescription>
          Get accurate measurements in 30 seconds using your camera
        </CardDescription>
        {isDemoMode && (
          <Badge variant="secondary" className="mx-auto mt-2">
            <Wand2 className="w-3 h-3 mr-1" />
            Demo Mode
          </Badge>
        )}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <li>• Ensure good, even lighting — turn on room lights or use a lamp behind the camera</li>
                  <li>• Stand against a plain background</li>
                  <li>• Keep arms slightly away from body</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={() => setStep("setup")} className="w-full" size="lg">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button onClick={handleStartDemo} variant="outline" className="w-full" size="lg">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Try Demo Mode (No Camera Required)
                </Button>
              </div>
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
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="height">Your Height</Label>
                    <ToggleGroup type="single" value={heightUnit} onValueChange={(v) => {
                      if (v === "cm" || v === "ft") {
                        setHeightUnit(v);
                        if (v === "ft" && height) {
                          const totalInches = parseFloat(height) / 2.54;
                          setHeightFeet(Math.floor(totalInches / 12).toString());
                          setHeightInches(Math.round(totalInches % 12).toString());
                        } else if (v === "cm" && heightFeet) {
                          const cm = (parseFloat(heightFeet || "0") * 30.48) + (parseFloat(heightInches || "0") * 2.54);
                          setHeight(Math.round(cm).toString());
                        }
                      }
                    }} className="h-7">
                      <ToggleGroupItem value="cm" className="text-xs px-2.5 h-7">cm</ToggleGroupItem>
                      <ToggleGroupItem value="ft" className="text-xs px-2.5 h-7">ft</ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  {heightUnit === "cm" ? (
                    <Input
                      id="height"
                      type="number"
                      placeholder="175"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  ) : (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="5"
                          value={heightFeet}
                          onChange={(e) => {
                            setHeightFeet(e.target.value);
                            const cm = (parseFloat(e.target.value || "0") * 30.48) + (parseFloat(heightInches || "0") * 2.54);
                            setHeight(Math.round(cm).toString());
                          }}
                        />
                        <span className="text-xs text-muted-foreground mt-0.5 block">feet</span>
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="9"
                          value={heightInches}
                          onChange={(e) => {
                            setHeightInches(e.target.value);
                            const cm = (parseFloat(heightFeet || "0") * 30.48) + (parseFloat(e.target.value || "0") * 2.54);
                            setHeight(Math.round(cm).toString());
                          }}
                        />
                        <span className="text-xs text-muted-foreground mt-0.5 block">inches</span>
                      </div>
                    </div>
                  )}
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
                <Button variant="outline" onClick={resetScanner} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep("capture")}
                  className="flex-1"
                  disabled={!height || parseFloat(height) < 100 || parseFloat(height) > 250}
                >
                  {isDemoMode ? "Start Demo" : "Start Capture"}
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
              {/* Timer selector */}
              {!isDemoMode && !isCapturing && countdown === null && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Timer className="w-4 h-4" />
                    Capture Delay
                  </Label>
                  <div className="flex gap-2">
                    {TIMER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setTimerDuration(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          timerDuration === opt.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={`relative bg-black rounded-lg overflow-hidden ${
                isFullscreen 
                  ? "fixed inset-0 z-50 rounded-none" 
                  : "aspect-[3/4] sm:aspect-video"
              }`}>
                {isDemoMode ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 relative">
                    {/* Body position guide for demo */}
                    {!isCapturing && countdown === null && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <svg viewBox="0 0 1420 2048" className="h-[80%] opacity-[0.18]">
                          <path transform="translate(740,73)" d="m0 0h10l22 3 13 4 16 8 13 11 9 11 8 15 7 22 3 20v31l-3 23-6 27-9 30-5 13-6 9-6 5h-2l5 48 2 7 16 9 19 12 16 11 2 2 29 1 21 2 17 3 16 5 16 8 11 8 8 10 12 20 10 18 5 15 3 17v69l8 41 6 42 2 27 2 32 4 11 11 18 5 11 13 36 7 24 6 25 2 12 4 38 4 24 7 28 7 19 4 9v2l15 2 14 7 10 9 12 14 11 14 10 11 5 6 12 8 5 5 1 6-3 6-3 2h-14l-12-4-11-8-4-5-7-4 2 9 4 9 9 16 15 25 4 8v9l-5 5-7 1-7-4-8-10-14-23-9-12 1 10 4 16 5 10 6 15 1 5v12l-4 6-9 1-6-5-6-12-15-40-1-1 2 27v20l-3 6-4 3h-7l-6-7-3-15-3-25-1-15-1-1 1 15v24l-3 7-5 4-5-1-5-4-3-8-4-45-2-14-6-16-6-21-1-6v-14l1-1v-8l-7-16-16-34-18-36-10-19-13-27-14-33-10-30-8-34-7-31-12-40-7-18-2 3-14 46-3 12v131l8 39 6 37 2 18 1 22v57l-1 48-2 37-6 61-5 37-5 29-9 40-16 61-5 27-1 8v31l3 22 9 41 4 21 2 16v47l-4 24-8 34-14 47-18 59-17 56-8 29-3 15v10l5 14 13 24 12 16 5 5 11 9 5 5 1 6-2 5-5 4-9 3-31 6h-21l-7-2-2 5-9 4-5 1h-12l-7-2-7-6-2-4h-2l-4 5-9 6-4 1-16-1-8-3-5-4v-2l-8 1-1 1h-15l-19-3-22-5-8-6v-10l5-5 10-8 8-8 14-21 9-16 5-13 1-5v-7l-4-17-16-55-9-28-12-40-14-46-9-31-6-29-3-22v-45l5-30 6-28 3-11 4-29v-31l-3-21-5-23-10-36-8-34-9-47-7-51-3-30-4-61-2-52v-31l2-43 5-41 6-35 3-14v-15l-3-9v-111l-9-36-6-18-6 14-10 30-6 24-9 41-7 25-8 22-15 33-16 33-8 15-8 16-17 35-11 26v6l1 1v15l-5 21-7 19-2 9-3 30-2 22-3 9-6 5-6-1-4-5-3-10-3 8-3 15-4 5-2 1h-8l-5-6-1-12 1-18v-16l-8 18-10 27-7 8-2 1h-6l-6-5-1-2v-12l5-14 8-20 5-16v-2l-4 2-8 10-15 22-7 8-6 3-7-1-3-3-1-2v-7l3-8 11-18 18-33 2-5v-3l-6 3-10 9-10 5-9 2h-12l-5-3-2-4 1-7 11-9 8-7 7-7 9-11 11-14 14-15 8-6 10-5 15-2 3-5 8-22 7-27 4-22 6-49 6-29 11-37 12-29 8-15 6-10 3-10 2-19 2-31 5-40 6-35 4-18v-67l3-20 6-16 11-21 10-16 7-9 9-8 12-7 17-6 21-4 21-2 29-1 16-10 15-10 20-12 6-2 2-26 3-27-9-8-8-16-7-21-8-32-3-17-2-24v-11l2-22 5-21 8-19 8-12 11-11 10-7 13-6 14-4z" fill="white" />
                        </svg>
                        <p className="absolute bottom-16 left-0 right-0 text-center text-xs text-white/60 font-medium">Align your body within the outline</p>
                      </div>
                    )}
                    <div className="text-center z-20">
                      <Wand2 className="w-16 h-16 text-primary mx-auto mb-4" />
                      <p className="text-lg font-medium">Demo Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Simulating body scan capture...
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{
                        transform: facingMode === "user" ? "scaleX(-1)" : undefined,
                        filter: `brightness(${manualBrightness}%) contrast(${manualContrast}%)`,
                      }}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {/* Body position guide overlay */}
                    {!isCapturing && countdown === null && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <svg viewBox="0 0 1420 2048" className="h-[80%] opacity-[0.18]">
                          <path transform="translate(740,73)" d="m0 0h10l22 3 13 4 16 8 13 11 9 11 8 15 7 22 3 20v31l-3 23-6 27-9 30-5 13-6 9-6 5h-2l5 48 2 7 16 9 19 12 16 11 2 2 29 1 21 2 17 3 16 5 16 8 11 8 8 10 12 20 10 18 5 15 3 17v69l8 41 6 42 2 27 2 32 4 11 11 18 5 11 13 36 7 24 6 25 2 12 4 38 4 24 7 28 7 19 4 9v2l15 2 14 7 10 9 12 14 11 14 10 11 5 6 12 8 5 5 1 6-3 6-3 2h-14l-12-4-11-8-4-5-7-4 2 9 4 9 9 16 15 25 4 8v9l-5 5-7 1-7-4-8-10-14-23-9-12 1 10 4 16 5 10 6 15 1 5v12l-4 6-9 1-6-5-6-12-15-40-1-1 2 27v20l-3 6-4 3h-7l-6-7-3-15-3-25-1-15-1-1 1 15v24l-3 7-5 4-5-1-5-4-3-8-4-45-2-14-6-16-6-21-1-6v-14l1-1v-8l-7-16-16-34-18-36-10-19-13-27-14-33-10-30-8-34-7-31-12-40-7-18-2 3-14 46-3 12v131l8 39 6 37 2 18 1 22v57l-1 48-2 37-6 61-5 37-5 29-9 40-16 61-5 27-1 8v31l3 22 9 41 4 21 2 16v47l-4 24-8 34-14 47-18 59-17 56-8 29-3 15v10l5 14 13 24 12 16 5 5 11 9 5 5 1 6-2 5-5 4-9 3-31 6h-21l-7-2-2 5-9 4-5 1h-12l-7-2-7-6-2-4h-2l-4 5-9 6-4 1-16-1-8-3-5-4v-2l-8 1-1 1h-15l-19-3-22-5-8-6v-10l5-5 10-8 8-8 14-21 9-16 5-13 1-5v-7l-4-17-16-55-9-28-12-40-14-46-9-31-6-29-3-22v-45l5-30 6-28 3-11 4-29v-31l-3-21-5-23-10-36-8-34-9-47-7-51-3-30-4-61-2-52v-31l2-43 5-41 6-35 3-14v-15l-3-9v-111l-9-36-6-18-6 14-10 30-6 24-9 41-7 25-8 22-15 33-16 33-8 15-8 16-17 35-11 26v6l1 1v15l-5 21-7 19-2 9-3 30-2 22-3 9-6 5-6-1-4-5-3-10-3 8-3 15-4 5-2 1h-8l-5-6-1-12 1-18v-16l-8 18-10 27-7 8-2 1h-6l-6-5-1-2v-12l5-14 8-20 5-16v-2l-4 2-8 10-15 22-7 8-6 3-7-1-3-3-1-2v-7l3-8 11-18 18-33 2-5v-3l-6 3-10 9-10 5-9 2h-12l-5-3-2-4 1-7 11-9 8-7 7-7 9-11 11-14 14-15 8-6 10-5 15-2 3-5 8-22 7-27 4-22 6-49 6-29 11-37 12-29 8-15 6-10 3-10 2-19 2-31 5-40 6-35 4-18v-67l3-20 6-16 11-21 10-16 7-9 9-8 12-7 17-6 21-4 21-2 29-1 16-10 15-10 20-12 6-2 2-26 3-27-9-8-8-16-7-21-8-32-3-17-2-24v-11l2-22 5-21 8-19 8-12 11-11 10-7 13-6 14-4z" fill="white" />
                        </svg>
                        <p className="absolute bottom-16 left-0 right-0 text-center text-xs text-white/60 font-medium">Align your body within the outline</p>
                      </div>
                    )}
                    {!isCapturing && countdown === null && (
                      <div className="absolute top-4 left-4 flex gap-2">
                        <button
                          onClick={toggleCamera}
                          className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                          aria-label="Switch camera"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                    {/* Fullscreen toggle & Brightness indicator */}
                    {!isCapturing && countdown === null && (
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                          brightnessLevel < 60 ? "bg-destructive/80 text-white" : 
                          brightnessLevel < 100 ? "bg-yellow-500/80 text-white" : 
                          "bg-black/40 text-white"
                        }`}>
                          <Sun className="w-3 h-3" />
                          {brightnessLevel < 60 ? "Too Dark" : brightnessLevel < 100 ? "Low Light" : "Good"}
                        </div>
                        <button
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                        >
                          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Countdown overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <motion.div
                      key={countdown}
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="text-7xl font-bold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
                    >
                      {countdown}
                    </motion.div>
                  </div>
                )}
                
                {isCapturing && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/50 rounded-full p-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: isDemoMode ? 2.4 : 30, ease: "linear", repeat: Infinity }}
                      >
                        <RotateCcw className="w-12 h-12 text-white" />
                      </motion.div>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-4 left-4 right-4">
                  <Progress value={captureProgress} className="h-2" />
                  <p className="text-white text-sm text-center mt-2">
                    {countdown !== null
                      ? "Get into position..."
                      : isCapturing
                        ? `Capturing... ${Math.round(captureProgress)}%${isDemoMode ? "" : " - Rotate slowly"}`
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

              {/* Manual Brightness/Contrast Sliders */}
              {!isDemoMode && !isCapturing && countdown === null && (
                <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs flex items-center gap-1.5">
                        <Sun className="w-3 h-3" />
                        Brightness
                      </Label>
                      <span className="text-xs text-muted-foreground">{manualBrightness}%</span>
                    </div>
                    <Slider
                      value={[manualBrightness]}
                      onValueChange={([v]) => setManualBrightness(v)}
                      min={50}
                      max={200}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs flex items-center gap-1.5">
                        <Contrast className="w-3 h-3" />
                        Contrast
                      </Label>
                      <span className="text-xs text-muted-foreground">{manualContrast}%</span>
                    </div>
                    <Slider
                      value={[manualContrast]}
                      onValueChange={([v]) => setManualContrast(v)}
                      min={50}
                      max={200}
                      step={5}
                    />
                  </div>
                  {(manualBrightness !== 100 || manualContrast !== 100) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => { setManualBrightness(100); setManualContrast(100); }}
                    >
                      Reset to default
                    </Button>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("setup")} className="flex-1" disabled={isCapturing || countdown !== null}>
                  Back
                </Button>
                <Button
                  onClick={() => startWithTimer(isDemoMode ? startDemoCapture : startCapture)}
                  className="flex-1"
                  disabled={isCapturing || countdown !== null}
                >
                  {countdown !== null ? (
                    <>
                      <Timer className="w-4 h-4 mr-2" />
                      Starting in {countdown}s...
                    </>
                  ) : isCapturing ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Capturing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      {isDemoMode ? "Run Demo" : timerDuration > 0 ? `Start (${timerDuration}s delay)` : "Start Capture"}
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
              <h3 className="text-xl font-semibold mb-2">
                {isDemoMode ? "Processing Demo Scan" : "Analyzing Your Body Measurements"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {isDemoMode 
                  ? "Generating sample measurements..."
                  : "Our AI is extracting 30+ measurements from your scan..."}
              </p>
              {jobStatus && !isDemoMode && (
                <Badge variant="outline">
                  Status: {jobStatus}
                </Badge>
              )}
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
              <div className={`flex items-center justify-between p-4 rounded-lg ${
                result.confidence_scores.overall < 75 
                  ? "bg-destructive/10 border border-destructive/20" 
                  : result.confidence_scores.overall < 80 
                    ? "bg-yellow-500/10 border border-yellow-500/20" 
                    : "bg-muted/50"
              }`}>
                <div>
                  <p className="text-sm text-muted-foreground">Overall Confidence</p>
                  <p className="text-2xl font-bold">{result.confidence_scores.overall}%</p>
                </div>
                <Badge variant={
                  isDemoMode ? "secondary" :
                  result.confidence_scores.overall >= 80 ? "default" : 
                  result.confidence_scores.overall >= 75 ? "outline" : "destructive"
                }>
                  {isDemoMode ? "Demo Data" : 
                   result.confidence_scores.overall >= 80 ? "High Accuracy" : 
                   result.confidence_scores.overall >= 75 ? "Acceptable" : "Low Accuracy"}
                </Badge>
              </div>

              {/* Acceptable confidence banner (75-79%) */}
              {!isDemoMode && result.confidence_scores.overall >= 75 && result.confidence_scores.overall < 80 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        Measurements are usable but could be improved
                      </p>
                      <p className="text-xs text-muted-foreground">
                        For higher accuracy, try rescanning with better lighting, form-fitting clothing, and a plain background.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Low confidence warning (<75%) */}
              {!isDemoMode && result.confidence_scores.overall < 75 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        Confidence too low — rescan required
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Ensure good lighting, wear form-fitting clothing, and stand against a plain background.
                      </p>
                      <Button size="sm" variant="outline" onClick={resetScanner}>
                        <RefreshCw className="w-3 h-3 mr-2" />
                        Rescan
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Fit Recommendations */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                    <DialogTitle>Your Measurements {isDemoMode && "(Demo)"}</DialogTitle>
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

              {isDemoMode && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <p className="text-sm text-warning-foreground">
                    <Wand2 className="w-4 h-4 inline mr-2" />
                    These are demo measurements scaled to your height. For accurate measurements, use the camera scan feature.
                  </p>
                </div>
              )}

              {/* Save dialog */}
              <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Save Measurements</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label>Measurement Name</Label>
                      <Input
                        placeholder="e.g., My Casual Fit"
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {measurementCount}/{MAX_SAVED_MEASUREMENTS} saved measurements used
                    </p>

                    {/* Show existing measurements if at limit */}
                    {atLimit && (
                      <div className="space-y-2">
                        <p className="text-sm text-destructive font-medium">
                          Maximum {MAX_SAVED_MEASUREMENTS} measurements reached. Delete one to save a new one:
                        </p>
                        {existingMeasurements?.map((m) => (
                          <div key={m.id} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                            <span className="truncate flex-1">{m.measurement_name || "Unnamed"}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteMeasurement(m.id)}
                              disabled={deleteMeasurement.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      onClick={saveMeasurements}
                      disabled={isSaving || atLimit || !saveName.trim()}
                      className="w-full"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="flex gap-3">
                <Button variant="outline" onClick={resetScanner} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Scan Again
                </Button>
                <Button
                  onClick={handleSaveClick}
                  className="flex-1"
                  disabled={!canSave}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {!isDemoMode && result.confidence_scores.overall < 75 ? "Rescan Required" : "Save Measurements"}
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
