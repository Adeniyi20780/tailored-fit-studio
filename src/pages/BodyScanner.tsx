import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AIBodyScanner from "@/components/measurements/AIBodyScanner";
import { BodyScanHistory } from "@/components/measurements/BodyScanHistory";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

const BodyScanner = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
                AI Body Scanner
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-4">
                Get perfectly fitted custom clothing with our AI-powered body measurement system.
                Stand in place, perform a slow 360° spin, and let our AI extract 30+ body measurements in seconds.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/measurement-guide" className="gap-2">
                  <HelpCircle className="w-4 h-4" />
                  View Measurement Guide
                </Link>
              </Button>
            </div>

            <AIBodyScanner />

            {/* Body Scan History */}
            <div className="mt-8">
              <BodyScanHistory />
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 border rounded-xl">
                <div className="text-3xl font-bold text-primary mb-2">30+</div>
                <p className="text-muted-foreground">Body measurements extracted</p>
              </div>
              <div className="text-center p-6 border rounded-xl">
                <div className="text-3xl font-bold text-primary mb-2">~30s</div>
                <p className="text-muted-foreground">Scan completion time</p>
              </div>
              <div className="text-center p-6 border rounded-xl">
                <div className="text-3xl font-bold text-primary mb-2">95%</div>
                <p className="text-muted-foreground">Average accuracy rate</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BodyScanner;
