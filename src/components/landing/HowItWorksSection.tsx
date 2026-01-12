import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Smartphone, UserCheck, Palette, Package } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Smartphone,
    title: "Scan Your Body",
    description:
      "Open our app, follow the on-screen guide, and perform a simple 360° rotation. Our AI captures 60+ measurements in seconds.",
  },
  {
    number: "02",
    icon: UserCheck,
    title: "Choose Your Tailor",
    description:
      "Browse verified tailors, view their portfolios, read reviews, and find the perfect match for your style and budget.",
  },
  {
    number: "03",
    icon: Palette,
    title: "Customize Your Order",
    description:
      "Select fabric, color, fit, collar style, buttons, embroidery, and more. See a 3D preview before you order.",
  },
  {
    number: "04",
    icon: Package,
    title: "Receive & Enjoy",
    description:
      "Track your order in real-time. Receive your perfect-fit garment with our satisfaction guarantee.",
  },
];

const HowItWorksSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-accent font-semibold text-sm uppercase tracking-wider mb-4 block">
            Simple Process
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Your Perfect Fit in
            <br />
            <span className="text-gradient-gold">Four Easy Steps</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-accent/50 to-accent/10" />
              )}

              <div className="text-center">
                {/* Number Badge */}
                <div className="relative inline-block mb-6">
                  <div className="w-24 h-24 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                    <step.icon className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-accent-foreground text-sm font-bold flex items-center justify-center shadow-gold">
                    {step.number}
                  </div>
                </div>

                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
