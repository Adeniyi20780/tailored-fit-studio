import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Sparkles, ShoppingBag, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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

const SharedWishlist = () => {
  const { shareCode } = useParams<{ shareCode: string }>();

  // Fetch shared wishlist
  const { data: sharedWishlist, isLoading: wishlistLoading, error } = useQuery({
    queryKey: ["shared-wishlist", shareCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shared_wishlists")
        .select("*")
        .eq("share_code", shareCode)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!shareCode,
  });

  // Fetch products from shared wishlist
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["shared-wishlist-products", sharedWishlist?.product_ids],
    queryFn: async () => {
      if (!sharedWishlist?.product_ids || sharedWishlist.product_ids.length === 0) return [];
      
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", sharedWishlist.product_ids);

      if (error) throw error;
      return data;
    },
    enabled: !!sharedWishlist?.product_ids && sharedWishlist.product_ids.length > 0,
  });

  const isLoading = wishlistLoading || productsLoading;

  const getCustomizeUrl = (product: typeof products[0]) => {
    const category = categoryMap[product.category] || "shirts";
    return `/customize?category=${category}&name=${encodeURIComponent(product.name)}&productId=${product.id}&basePrice=${product.base_price}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !sharedWishlist) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
              Wishlist not found
            </h2>
            <p className="text-muted-foreground mb-6">
              This shared wishlist doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/catalog">Browse Catalog</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-12">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                {sharedWishlist.title || "Shared Wishlist"}
              </h1>
              <p className="text-muted-foreground">
                {products.length} {products.length === 1 ? "item" : "items"} in this collection
              </p>
            </motion.div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="container py-12">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No products in this wishlist.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group overflow-hidden hover:shadow-card-hover transition-all duration-300">
                    <Link to={`/product/${product.id}`}>
                      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                        <img
                          src={product.images?.[0] || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground capitalize">
                          {product.category}
                        </Badge>
                      </div>
                    </Link>

                    <CardContent className="p-4 space-y-3">
                      <Link to={`/product/${product.id}`}>
                        <h3 className="font-display text-lg font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-muted-foreground">From</span>
                        <span className="font-display text-xl font-bold text-foreground">
                          {product.currency || "$"}{product.base_price.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          asChild
                          size="sm"
                          className="flex-1 gap-1.5"
                        >
                          <Link to={getCustomizeUrl(product)}>
                            <Sparkles className="w-4 h-4" />
                            Customize
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1.5"
                        >
                          <Link to={`/product/${product.id}`}>
                            <ShoppingBag className="w-4 h-4" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Want to save your own favorites?
            </p>
            <Button asChild size="lg">
              <Link to="/catalog" className="gap-2">
                <ShoppingBag className="w-5 h-5" />
                Start Shopping
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SharedWishlist;
