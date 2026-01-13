import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Trash2, Sparkles, ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useWishlist } from "@/hooks/useWishlist";
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

const Wishlist = () => {
  const { wishlistItems, isLoading: wishlistLoading, removeFromWishlist, isToggling } = useWishlist();

  // Fetch product details for wishlist items
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["wishlist-products", wishlistItems.map(w => w.product_id)],
    queryFn: async () => {
      if (wishlistItems.length === 0) return [];
      
      const productIds = wishlistItems.map(w => w.product_id);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds);

      if (error) throw error;
      return data;
    },
    enabled: wishlistItems.length > 0,
  });

  const isLoading = wishlistLoading || productsLoading;

  const getCustomizeUrl = (product: typeof products[0]) => {
    const category = categoryMap[product.category] || "shirts";
    return `/customize?category=${category}&name=${encodeURIComponent(product.name)}&productId=${product.id}&basePrice=${product.base_price}`;
  };

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
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                My Wishlist
              </h1>
              <p className="text-muted-foreground">
                {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"} saved
              </p>
            </motion.div>
          </div>
        </section>

        {/* Wishlist Content */}
        <section className="container py-12">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : wishlistItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
                Your wishlist is empty
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start exploring our catalog and save products you love by clicking the heart icon.
              </p>
              <Button asChild size="lg">
                <Link to="/catalog" className="gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Browse Catalog
                </Link>
              </Button>
            </motion.div>
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
                    {/* Image */}
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
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromWishlist(product.id)}
                          disabled={isToggling}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
