import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Check, Ruler, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const measurements = [
  "Height",
  "Chest",
  "Waist",
  "Hips",
  "Shoulders",
  "Arm Length",
  "Inseam",
  "Neck",
  "Thigh",
  "Calf",
];

const MeasurementPreviewSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleTryMeasurement = () => {
    if (user) {
      navigate("/body-scanner");
    } else {
      navigate("/auth");
    }
  };

  return (
    <section ref={ref} className="py-24 bg-hero-gradient text-primary-foreground overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="text-accent font-semibold text-sm uppercase tracking-wider mb-4 block">
              AI-Powered Technology
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              60+ Measurements
              <br />
              <span className="text-gradient-gold">In 30 Seconds</span>
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 leading-relaxed">
              Our advanced AI body scanning technology uses your smartphone
              camera to capture precise measurements. No tape measure needed.
              Accuracy guaranteed within 0.5cm.
            </p>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                { icon: Camera, text: "Just your phone camera" },
                { icon: RotateCcw, text: "Simple 360° rotation" },
                { icon: Ruler, text: "60+ body measurements" },
                { icon: Check, text: "0.5cm accuracy" },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-primary-foreground/90 font-medium">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            <Button variant="hero" size="lg" onClick={handleTryMeasurement}>
              Try AI Measurement
            </Button>
          </motion.div>

          {/* Right Column - Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative flex justify-center"
          >
            {/* Phone Frame */}
            <div className="relative w-72 md:w-80">
              <div className="bg-foreground rounded-[3rem] p-3 shadow-2xl">
                <div className="bg-background rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                  {/* Phone Content */}
                  <div className="h-full flex flex-col">
                    {/* Status Bar */}
                    <div className="h-12 bg-primary flex items-center justify-center">
                      <div className="w-20 h-6 bg-foreground rounded-full" />
                    </div>

                    {/* App Content */}
                    <div className="flex-1 bg-primary p-6 flex flex-col items-center justify-center">
                      {/* Scan Area */}
                      <div className="relative w-full aspect-square mb-6">
                        <div className="absolute inset-0 border-4 border-accent/50 rounded-3xl" />
                        <div className="absolute inset-4 border-2 border-dashed border-accent/30 rounded-2xl" />
                        
                        {/* Silhouette */}
                        <div className="absolute inset-8 flex items-center justify-center">
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-20 h-40 bg-gradient-to-b from-accent/40 to-accent/20 rounded-full"
                          />
                        </div>

                        {/* Corner Markers */}
                        {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map((pos, i) => (
                          <div key={i} className={`absolute ${pos} w-8 h-8`}>
                            <div className={`absolute ${pos.includes("top") ? "top-0" : "bottom-0"} ${pos.includes("left") ? "left-0" : "right-0"} w-8 h-2 bg-accent rounded-full`} />
                            <div className={`absolute ${pos.includes("top") ? "top-0" : "bottom-0"} ${pos.includes("left") ? "left-0" : "right-0"} w-2 h-8 bg-accent rounded-full`} />
                          </div>
                        ))}
                      </div>

                      <p className="text-primary-foreground text-center text-sm mb-4">
                        Stand in the frame and slowly rotate
                      </p>

                      {/* Progress */}
                      <div className="w-full bg-primary-foreground/20 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={isInView ? { width: "75%" } : {}}
                          transition={{ duration: 2, delay: 0.5 }}
                          className="h-full bg-accent rounded-full"
                        />
                      </div>
                      <p className="text-accent text-sm mt-2 font-medium">
                        Capturing measurements...
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Measurements */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -right-4 top-20 bg-card/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-border/50"
              >
                <p className="text-foreground text-xs font-semibold mb-2">Detected:</p>
                <div className="flex flex-wrap gap-1 max-w-32">
                  {measurements.slice(0, 4).map((m) => (
                    <span
                      key={m}
                      className="text-xs px-2 py-1 bg-success/10 text-success rounded-full"
                    >
                      {m} ✓
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MeasurementPreviewSection;
