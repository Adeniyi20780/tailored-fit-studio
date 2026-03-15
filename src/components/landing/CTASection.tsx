import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Store, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const ref = useRef(null);
  const navigate = useNavigate();
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          {/* For Customers */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="bg-card-gradient rounded-3xl p-8 md:p-12 border border-border hover:border-accent/30 transition-colors group"
          >
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-8 h-8 text-accent" />
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to Order?
            </h3>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Browse thousands of tailors, get AI-measured for the perfect fit,
              and receive custom clothing delivered to your door.
            </p>
            <Button variant="hero" size="lg" className="group/btn" onClick={() => navigate("/catalog")}>
              Start Shopping
              <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* For Tailors */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="bg-primary rounded-3xl p-8 md:p-12 group"
          >
            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Store className="w-8 h-8 text-accent" />
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Are You a Tailor?
            </h3>
            <p className="text-primary-foreground/80 text-lg mb-8 leading-relaxed">
              Create your storefront, reach global customers, and grow your
              business with our powerful tools and analytics.
            </p>
            <Button
              variant="heroOutline"
              size="lg"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 group/btn"
            >
              Create Your Store
              <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
