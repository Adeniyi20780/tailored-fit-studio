import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  Camera,
  Store,
  CreditCard,
  BarChart3,
  Truck,
  RefreshCw,
} from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "AI Body Measurement",
    description:
      "Use your smartphone camera to capture 60+ precise body measurements. Our AI ensures accuracy within 0.5cm.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Store,
    title: "Your Own Storefront",
    description:
      "Create a stunning personalized store with your brand. Share your unique link and showcase your designs to the world.",
    color: "text-terracotta",
    bgColor: "bg-terracotta/10",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description:
      "Multi-currency support with Stripe & Paystack. Customers pay securely, you get paid fast. Wallet system included.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track revenue, best sellers, conversion rates, and customer demographics. Make data-driven decisions.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Truck,
    title: "Order & Delivery",
    description:
      "Real-time order tracking from tailoring to delivery. ETA predictions and automated notifications.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: RefreshCw,
    title: "Perfect Fit Guarantee",
    description:
      "Free alterations, easy return workflow, and refund automation. We guarantee customer satisfaction.",
    color: "text-terracotta",
    bgColor: "bg-terracotta/10",
  },
];

const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 bg-warm-gradient">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-accent font-semibold text-sm uppercase tracking-wider mb-4 block">
            Everything You Need
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            The Complete Platform for
            <br />
            <span className="text-gradient-gold">Modern Tailors</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            From AI-powered measurements to secure payments, we provide
            everything you need to run a successful tailoring business globally.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-card rounded-2xl p-8 border border-border hover:border-accent/30 transition-all duration-300 hover:shadow-card-hover"
            >
              <div
                className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
