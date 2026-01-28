import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Camera,
  RotateCcw,
  Lightbulb,
  Ruler,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Play,
  ArrowRight,
  Shirt,
  User,
  Sun,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const stepGuides = [
  {
    id: 1,
    title: "Prepare Your Space",
    icon: Sun,
    description: "Find the right environment for accurate measurements",
    tips: [
      { good: true, text: "Choose a well-lit room with natural or bright indoor lighting" },
      { good: true, text: "Stand against a plain, solid-colored wall or background" },
      { good: true, text: "Ensure there's 6-8 feet of space between you and the camera" },
      { good: false, text: "Avoid patterned or cluttered backgrounds" },
      { good: false, text: "Don't use dim or harsh directional lighting" },
    ],
  },
  {
    id: 2,
    title: "Wear the Right Clothing",
    icon: Shirt,
    description: "Your outfit affects measurement accuracy",
    tips: [
      { good: true, text: "Wear form-fitting clothes like leggings and a fitted t-shirt" },
      { good: true, text: "Choose solid, contrasting colors against your background" },
      { good: true, text: "Remove bulky jewelry and accessories" },
      { good: false, text: "Avoid loose, baggy, or oversized clothing" },
      { good: false, text: "Don't wear clothing that matches the wall color" },
    ],
  },
  {
    id: 3,
    title: "Position Your Body",
    icon: User,
    description: "The correct stance ensures accurate measurements",
    tips: [
      { good: true, text: "Stand straight with feet shoulder-width apart" },
      { good: true, text: "Keep arms slightly away from your body (about 20°)" },
      { good: true, text: "Look straight ahead with a neutral expression" },
      { good: false, text: "Don't slouch or lean to one side" },
      { good: false, text: "Avoid crossing arms or legs" },
    ],
  },
  {
    id: 4,
    title: "Set Up Your Camera",
    icon: Smartphone,
    description: "Camera placement is crucial for full-body capture",
    tips: [
      { good: true, text: "Place the camera at waist height on a stable surface" },
      { good: true, text: "Ensure your full body fits in the frame with some margin" },
      { good: true, text: "Use the rear camera for better quality (have someone help)" },
      { good: false, text: "Don't hold the phone while scanning" },
      { good: false, text: "Avoid tilting the camera up or down significantly" },
    ],
  },
  {
    id: 5,
    title: "Perform the 360° Spin",
    icon: RotateCcw,
    description: "The spinning motion captures all angles",
    tips: [
      { good: true, text: "Spin slowly and steadily over 30 seconds" },
      { good: true, text: "Keep your arms in the same position throughout" },
      { good: true, text: "Maintain the same spot—rotate in place, don't walk" },
      { good: false, text: "Don't rush or spin unevenly" },
      { good: false, text: "Avoid moving your arms or changing posture" },
    ],
  },
];

const measurementPoints = [
  { name: "Neck", description: "Circumference at the base of your neck" },
  { name: "Shoulder Width", description: "Distance from shoulder to shoulder" },
  { name: "Chest", description: "Fullest part of your chest/bust" },
  { name: "Waist", description: "Narrowest part of your natural waist" },
  { name: "Hips", description: "Fullest part of your hips and buttocks" },
  { name: "Arm Length", description: "Shoulder to wrist along the outer arm" },
  { name: "Sleeve Length", description: "Shoulder seam to preferred cuff position" },
  { name: "Inseam", description: "Inner leg from crotch to ankle" },
  { name: "Thigh", description: "Circumference at the widest part of thigh" },
  { name: "Back Width", description: "Width across your upper back" },
];

const MeasurementGuide = () => {
  const [activeStep, setActiveStep] = useState(0);

  const nextStep = () => {
    if (activeStep < stepGuides.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge className="mb-4" variant="secondary">
              <Ruler className="w-3 h-3 mr-1" />
              AI Body Scanner Guide
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Get Perfect Measurements
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Follow our step-by-step guide to ensure the most accurate body measurements
              for perfectly fitted custom clothing.
            </p>
          </motion.div>

          {/* Quick Tips Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            <Card className="bg-card-gradient border-border/50">
              <CardContent className="pt-6 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">Smartphone Camera</h3>
                <p className="text-sm text-muted-foreground">
                  Use your phone's camera at waist height for optimal capture
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card-gradient border-border/50">
              <CardContent className="pt-6 text-center">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <RotateCcw className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">360° Slow Spin</h3>
                <p className="text-sm text-muted-foreground">
                  Rotate slowly in place over 30 seconds for complete coverage
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card-gradient border-border/50">
              <CardContent className="pt-6 text-center">
                <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-7 h-7 text-success" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">Good Lighting</h3>
                <p className="text-sm text-muted-foreground">
                  Bright, even lighting helps AI detect your body shape accurately
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="step-by-step" className="mb-12">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="step-by-step">Step-by-Step Guide</TabsTrigger>
              <TabsTrigger value="measurements">What We Measure</TabsTrigger>
            </TabsList>

            <TabsContent value="step-by-step" className="mt-8">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Steps Navigation */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Preparation Steps</CardTitle>
                      <CardDescription>
                        Complete each step for best results
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {stepGuides.map((step, index) => {
                        const Icon = step.icon;
                        return (
                          <button
                            key={step.id}
                            onClick={() => setActiveStep(index)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                              activeStep === index
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                activeStep === index
                                  ? "bg-primary-foreground/20"
                                  : "bg-muted"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{step.title}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 shrink-0 opacity-50" />
                          </button>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>

                {/* Step Detail */}
                <div className="lg:col-span-2">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="overflow-hidden">
                      <div className="bg-muted/50 p-8">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            {(() => {
                              const Icon = stepGuides[activeStep].icon;
                              return <Icon className="w-6 h-6 text-primary" />;
                            })()}
                          </div>
                          <div>
                            <Badge variant="secondary" className="mb-1">
                              Step {activeStep + 1} of {stepGuides.length}
                            </Badge>
                            <h3 className="font-display text-2xl font-bold">
                              {stepGuides[activeStep].title}
                            </h3>
                          </div>
                        </div>
                        <p className="text-muted-foreground">
                          {stepGuides[activeStep].description}
                        </p>
                      </div>

                      <CardContent className="p-6">
                        <div className="space-y-3">
                          {stepGuides[activeStep].tips.map((tip, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`flex items-start gap-3 p-3 rounded-lg ${
                                tip.good ? "bg-success/10" : "bg-destructive/10"
                              }`}
                            >
                              {tip.good ? (
                                <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                              )}
                              <p className={`text-sm ${tip.good ? "text-success" : "text-destructive"}`}>
                                {tip.text}
                              </p>
                            </motion.div>
                          ))}
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t">
                          <Button
                            variant="outline"
                            onClick={prevStep}
                            disabled={activeStep === 0}
                          >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Previous
                          </Button>

                          {activeStep === stepGuides.length - 1 ? (
                            <Button asChild>
                              <Link to="/body-scanner">
                                <Play className="w-4 h-4 mr-2" />
                                Start Scanning
                              </Link>
                            </Button>
                          ) : (
                            <Button onClick={nextStep}>
                              Next Step
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="measurements" className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>30+ Body Measurements Extracted</CardTitle>
                  <CardDescription>
                    Our AI analyzes your body from all angles to extract precise measurements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {measurementPoints.map((point, index) => (
                      <motion.div
                        key={point.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Ruler className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{point.name}</h4>
                          <p className="text-xs text-muted-foreground">{point.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-8 p-6 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-display font-semibold text-lg mb-2">
                          AI Accuracy Guarantee
                        </h4>
                        <p className="text-muted-foreground text-sm mb-4">
                          Our AI body scanner achieves 95% accuracy on average. If your garment 
                          doesn't fit perfectly, we offer free alterations under our Perfect Fit Guarantee.
                        </p>
                        <Link to="/perfect-fit-guarantee" className="text-primary text-sm font-medium hover:underline">
                          Learn about our Perfect Fit Guarantee →
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center bg-primary rounded-2xl p-8 md:p-12"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Ready to Get Measured?
            </h2>
            <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
              Now that you know how to prepare, start your AI body scan and get perfectly 
              fitted custom clothing in minutes.
            </p>
            <Button asChild size="lg" variant="secondary" className="gap-2">
              <Link to="/body-scanner">
                <Camera className="w-5 h-5" />
                Start AI Body Scanner
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MeasurementGuide;
