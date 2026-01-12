import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Star, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import tailor1 from "@/assets/tailor-1.jpg";
import tailor2 from "@/assets/tailor-2.jpg";
import productSuit from "@/assets/product-suit.jpg";
import productKaftan from "@/assets/product-kaftan.jpg";
import productShirt from "@/assets/product-shirt.jpg";

const tailors = [
  {
    id: 1,
    name: "Adebayo's Bespoke",
    image: tailor1,
    location: "Lagos, Nigeria",
    specialty: "Traditional & Modern Suits",
    rating: 4.9,
    reviews: 342,
    products: [productSuit, productShirt],
    priceRange: "$150 - $800",
  },
  {
    id: 2,
    name: "Amara Couture",
    image: tailor2,
    location: "Accra, Ghana",
    specialty: "Kaftans & Traditional Wear",
    rating: 4.8,
    reviews: 218,
    products: [productKaftan, productShirt],
    priceRange: "$100 - $600",
  },
];

const TailorsPreviewSection = () => {
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
          className="flex flex-col md:flex-row md:items-end md:justify-between mb-12"
        >
          <div>
            <span className="text-accent font-semibold text-sm uppercase tracking-wider mb-4 block">
              Featured Tailors
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Meet Our
              <span className="text-gradient-gold"> Master Craftsmen</span>
            </h2>
          </div>
          <Button variant="outline" size="lg" className="mt-6 md:mt-0 group">
            View All Tailors
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        {/* Tailors Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {tailors.map((tailor, index) => (
            <motion.div
              key={tailor.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="bg-card rounded-3xl overflow-hidden border border-border hover:border-accent/30 transition-all duration-300 hover:shadow-card-hover group"
            >
              {/* Tailor Header */}
              <div className="flex items-center gap-4 p-6 border-b border-border">
                <img
                  src={tailor.image}
                  alt={tailor.name}
                  className="w-20 h-20 rounded-2xl object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-display text-xl font-semibold text-foreground mb-1">
                    {tailor.name}
                  </h3>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                    <MapPin className="w-4 h-4" />
                    {tailor.location}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-accent fill-current" />
                      <span className="font-semibold text-foreground">
                        {tailor.rating}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        ({tailor.reviews})
                      </span>
                    </div>
                    <span className="text-accent font-semibold text-sm">
                      {tailor.priceRange}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Preview */}
              <div className="p-6">
                <p className="text-muted-foreground text-sm mb-4">
                  <span className="font-medium text-foreground">
                    Specialty:
                  </span>{" "}
                  {tailor.specialty}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {tailor.products.map((product, i) => (
                    <div
                      key={i}
                      className="aspect-[4/5] rounded-xl overflow-hidden bg-secondary"
                    >
                      <img
                        src={product}
                        alt="Product"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="px-6 pb-6">
                <Button variant="default" className="w-full">
                  Visit Store
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TailorsPreviewSection;
