import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturedTailorsSection from "@/components/landing/FeaturedTailorsSection";
import TailorsPreviewSection from "@/components/landing/TailorsPreviewSection";
import MeasurementPreviewSection from "@/components/landing/MeasurementPreviewSection";
import CTASection from "@/components/landing/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <FeaturedTailorsSection />
        <TailorsPreviewSection />
        <MeasurementPreviewSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
