import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Store, MapPin, Star, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface FeaturedTailor {
  id: string;
  store_name: string;
  store_slug: string;
  description: string | null;
  logo_url: string | null;
  location: string | null;
  specialties: string[] | null;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
}

const FeaturedTailorsSection = () => {
  const { data: tailors = [], isLoading } = useQuery({
    queryKey: ["featured-tailors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tailors")
        .select("id, store_name, store_slug, description, logo_url, location, specialties, rating, total_reviews, is_verified")
        .eq("is_active", true)
        .order("rating", { ascending: false })
        .limit(4);

      if (error) throw error;
      return data as FeaturedTailor[];
    },
  });

  if (isLoading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (tailors.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">
            Featured Tailors
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Meet Our Top Craftsmen
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover skilled tailors who bring decades of experience and passion to every stitch
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {tailors.map((tailor, index) => (
            <motion.div
              key={tailor.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link
                to={`/tailor/${tailor.store_slug}`}
                className="block group"
              >
                <div className="bg-background rounded-xl border p-6 h-full hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                  {/* Logo */}
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto overflow-hidden group-hover:scale-105 transition-transform">
                    {tailor.logo_url ? (
                      <img
                        src={tailor.logo_url}
                        alt={tailor.store_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="h-7 w-7 text-primary" />
                    )}
                  </div>

                  {/* Name & Rating */}
                  <div className="text-center mb-3">
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {tailor.store_name}
                    </h3>
                    {tailor.rating > 0 && (
                      <div className="flex items-center justify-center gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">
                          {tailor.rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({tailor.total_reviews})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  {tailor.location && (
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mb-3">
                      <MapPin className="h-3.5 w-3.5" />
                      {tailor.location}
                    </p>
                  )}

                  {/* Specialties */}
                  {tailor.specialties && tailor.specialties.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1">
                      {tailor.specialties.slice(0, 2).map((specialty) => (
                        <Badge
                          key={specialty}
                          variant="secondary"
                          className="text-xs"
                        >
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link to="/tailors">
              View All Tailors
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedTailorsSection;
