import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Store,
  MapPin,
  Star,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Package,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useTailorStore } from "@/hooks/useTailorStore";
import { TailorReviewsSection } from "@/components/reviews/TailorReviewsSection";
import type { ProductCategory } from "@/types/customization";

const categoryMap: Record<string, ProductCategory> = {
  shirts: "shirts",
  suits: "suits",
  jeans: "jeans",
  kaftans: "kaftans",
  traditional: "traditional",
  Shirts: "shirts",
  Suits: "suits",
  Jeans: "jeans",
  Kaftans: "kaftans",
  Traditional: "traditional",
};

const TailorStorePage = () => {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const navigate = useNavigate();

  const { tailor, products, isLoading, error } = useTailorStore(storeSlug || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading store...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !tailor) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Store Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The store you're looking for doesn't exist or is no longer active.
              </p>
              <Button asChild>
                <Link to="/catalog">Browse Catalog</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const handleViewProduct = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const handleCustomize = (product: typeof products[0]) => {
    const category = categoryMap[product.category] || "shirts";
    navigate(
      `/customize?category=${category}&name=${encodeURIComponent(product.name)}&productId=${product.id}&basePrice=${product.base_price}`
    );
  };

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    const category = product.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {} as Record<string, typeof products>);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Banner Section */}
        <section className="relative">
          {tailor.banner_url ? (
            <div className="h-48 md:h-64 lg:h-80 overflow-hidden">
              <img
                src={tailor.banner_url}
                alt={`${tailor.store_name} banner`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>
          ) : (
            <div className="h-48 md:h-64 lg:h-80 bg-hero-gradient" />
          )}

          {/* Store Info Overlay */}
          <div className="container relative -mt-16 md:-mt-20 pb-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Logo */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-background bg-card shadow-lg overflow-hidden flex-shrink-0"
              >
                {tailor.logo_url ? (
                  <img
                    src={tailor.logo_url}
                    alt={tailor.store_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <Store className="h-12 w-12 text-primary" />
                  </div>
                )}
              </motion.div>

              {/* Store Details */}
              <div className="flex-1">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                    {tailor.store_name}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    {tailor.location && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{tailor.location}</span>
                      </div>
                    )}
                    
                    {tailor.rating && tailor.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{tailor.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">
                          ({tailor.total_reviews} reviews)
                        </span>
                      </div>
                    )}

                    {tailor.is_verified && (
                      <Badge variant="secondary" className="gap-1">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Description & Specialties */}
        <section className="container py-6">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {tailor.description && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-lg font-semibold mb-3">About</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {tailor.description}
                  </p>
                </motion.div>
              )}
            </div>

            {tailor.specialties && tailor.specialties.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-lg font-semibold mb-3">Specialties</h2>
                <div className="flex flex-wrap gap-2">
                  {tailor.specialties.map((specialty) => (
                    <Badge key={specialty} variant="outline">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </section>

        <Separator className="container" />

        {/* Products Section */}
        <section className="container py-8 md:py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold">
                Products
              </h2>
              <p className="text-muted-foreground mt-1">
                {products.length} product{products.length !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No products yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  This tailor hasn't added any products yet. Check back later!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-12">
              {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                <div key={category}>
                  <h3 className="text-xl font-semibold mb-6 capitalize">{category}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categoryProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-card-hover transition-all duration-300 cursor-pointer"
                        onClick={() => handleViewProduct(product.id)}
                      >
                        {/* Image */}
                        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                          <img
                            src={product.images?.[0] || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* Quick customize button */}
                          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCustomize(product);
                              }}
                              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                            >
                              <Sparkles className="w-4 h-4" />
                              Customize
                            </Button>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-2">
                          <h4 className="font-semibold text-foreground line-clamp-1">
                            {product.name}
                          </h4>
                          {product.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            <div>
                              <p className="text-xs text-muted-foreground">From</p>
                              <p className="font-display text-lg font-bold">
                                {product.currency || "$"}
                                {product.base_price.toFixed(2)}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <Separator className="container" />

        {/* Reviews Section */}
        <section className="container py-8 md:py-12">
          <TailorReviewsSection tailorId={tailor.id} />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TailorStorePage;
