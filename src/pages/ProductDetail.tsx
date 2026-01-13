import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Store, Sparkles, ShoppingBag, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import ProductSpecifications from "@/components/product/ProductSpecifications";
import { useProduct } from "@/hooks/useProducts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  const { data: product, isLoading, error } = useProduct(productId || "");

  // Fetch tailor info
  const { data: tailor } = useQuery({
    queryKey: ["product-tailor", product?.tailor_id],
    queryFn: async () => {
      if (!product?.tailor_id) return null;
      const { data, error } = await supabase
        .from("tailors")
        .select("id, store_name, store_slug, logo_url, rating, total_reviews")
        .eq("id", product.tailor_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!product?.tailor_id,
  });

  const handleCustomize = () => {
    if (!product) return;
    const category = categoryMap[product.category] || "shirts";
    navigate(
      `/customize?category=${category}&name=${encodeURIComponent(product.name)}&productId=${product.id}&basePrice=${product.base_price}`
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading product details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The product you're looking for doesn't exist or has been removed.
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="container py-4">
          <div className="flex items-center gap-2 text-sm">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <span className="text-muted-foreground">/</span>
            <Link to="/catalog" className="text-muted-foreground hover:text-foreground">
              Catalog
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </div>
        </div>

        {/* Product Content */}
        <div className="container pb-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ProductImageGallery
                images={product.images || []}
                productName={product.name}
              />
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-6"
            >
              {/* Category & Title */}
              <div>
                <Badge className="mb-3 capitalize">{product.category}</Badge>
                <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground">
                  {product.name}
                </h1>
              </div>

              {/* Tailor Info */}
              {tailor && (
                <Link to={`/tailor/${tailor.store_slug}`}>
                  <Card className="bg-muted/30 hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {tailor.logo_url ? (
                          <img
                            src={tailor.logo_url}
                            alt={tailor.store_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Store className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{tailor.store_name}</p>
                        {tailor.rating && tailor.rating > 0 && (
                          <p className="text-sm text-muted-foreground">
                            ⭐ {tailor.rating.toFixed(1)} ({tailor.total_reviews} reviews)
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-primary">View Store →</span>
                    </CardContent>
                  </Card>
                </Link>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground">Starting from</span>
                <span className="font-display text-4xl font-bold text-foreground">
                  {product.currency || "$"}
                  {product.base_price.toFixed(2)}
                </span>
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              <Separator />

              {/* Specifications */}
              <ProductSpecifications product={product} />

              <Separator />

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handleCustomize}
                >
                  <Sparkles className="h-5 w-5" />
                  Customize & Order
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={() => navigate("/catalog")}
                >
                  <ShoppingBag className="h-5 w-5" />
                  Continue Shopping
                </Button>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">✂️</p>
                  <p className="text-sm font-medium mt-1">Custom Tailored</p>
                  <p className="text-xs text-muted-foreground">Made to your measurements</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">🚚</p>
                  <p className="text-sm font-medium mt-1">Free Shipping</p>
                  <p className="text-xs text-muted-foreground">On orders over $100</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
