import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Store, Sparkles, ShoppingBag, Loader2, AlertCircle,
  Heart, Ruler, MessageCircle, Star, UserPlus, UserCheck,
  Truck, RotateCcw, ShieldCheck, MapPin, Calendar, Minus, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import ProductSpecifications from "@/components/product/ProductSpecifications";
import ProductVariantSelector, { VariantSelection } from "@/components/product/ProductVariantSelector";
import { ProductReviewsSection } from "@/components/reviews/ProductReviewsSection";
import VirtualTryOn from "@/components/tryon/VirtualTryOn";
import SellerMessageDrawer from "@/components/product/SellerMessageDrawer";
import { useProduct } from "@/hooks/useProducts";
import { useWishlist } from "@/hooks/useWishlist";
import { useShopFollow } from "@/hooks/useShopFollow";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
  const { user } = useAuth();
  const { toast } = useToast();
  const { isInWishlist, toggleWishlist, isToggling } = useWishlist();
  const { addToCart, isAdding } = useCart();

  const [showVirtualTryOn, setShowVirtualTryOn] = useState(false);
  const [showMessageDrawer, setShowMessageDrawer] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [variantSelection, setVariantSelection] = useState<VariantSelection>({
    size: null,
    color: null,
    fabric: null,
  });

  const { data: product, isLoading, error } = useProduct(productId || "");

  // Fetch tailor info
  const { data: tailor } = useQuery({
    queryKey: ["product-tailor", product?.tailor_id],
    queryFn: async () => {
      if (!product?.tailor_id) return null;
      const { data, error } = await supabase
        .from("tailors")
        .select("id, store_name, store_slug, logo_url, rating, total_reviews, location, description, user_id")
        .eq("id", product.tailor_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!product?.tailor_id,
  });

  const { isFollowing, toggleFollow, isToggling: isFollowToggling } = useShopFollow(tailor?.id);

  const hasVariants = product && (
    (product.sizes && product.sizes.length > 0) ||
    (product.colors && product.colors.length > 0) ||
    (product.fabrics && product.fabrics.length > 0)
  );

  // Check if all available variant groups have a selection
  const isVariantSelectionComplete = () => {
    if (!product) return false;
    if (product.sizes && product.sizes.length > 0 && !variantSelection.size) return false;
    if (product.colors && product.colors.length > 0 && !variantSelection.color) return false;
    if (product.fabrics && product.fabrics.length > 0 && !variantSelection.fabric) return false;
    return true;
  };

  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to your cart",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    if (!product) return;
    if (hasVariants && !isVariantSelectionComplete()) {
      toast({
        title: "Select options",
        description: "Please select all available options before ordering",
        variant: "destructive",
      });
      return;
    }

    addToCart({
      productId: product.id,
      quantity,
      customizations: {
        type: "straight",
        ...(variantSelection.size && { size: variantSelection.size }),
        ...(variantSelection.color && { color: variantSelection.color }),
        ...(variantSelection.fabric && { fabric: variantSelection.fabric }),
      },
    });
  };

  const handleCustomize = () => {
    if (!product) return;
    const category = categoryMap[product.category] || "shirts";
    navigate(
      `/customize?category=${category}&name=${encodeURIComponent(product.name)}&productId=${product.id}&basePrice=${product.base_price}`
    );
  };

  const handleWishlistClick = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to your wishlist",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    if (product) {
      toggleWishlist(product.id);
    }
  };

  const handleFollowShop = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow shops",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    toggleFollow();
  };

  const isWishlisted = product ? isInWishlist(product.id) : false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-20">
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
        <main className="flex-1 flex items-center justify-center pt-20">
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

      <main className="flex-1 pt-20">
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
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge className="mb-3 capitalize">{product.category}</Badge>
                  <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground">
                    {product.name}
                  </h1>
                </div>
                <button
                  onClick={handleWishlistClick}
                  disabled={isToggling}
                  className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 border ${
                    isWishlisted
                      ? "bg-red-500 border-red-500 text-white"
                      : "bg-background border-border text-muted-foreground hover:text-red-500 hover:border-red-500"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
                </button>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground">
                  {hasVariants ? "Price" : "Starting from"}
                </span>
                <span className="font-display text-4xl font-bold text-foreground">
                  {product.currency || "$"}
                  {product.base_price.toFixed(2)}
                </span>
              </div>

              {/* Description */}
              {product.description && (
                <div id="details">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              <Separator />

              {/* Variant Selector for Straight Order */}
              {hasVariants && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Select Options</h3>
                    <ProductVariantSelector
                      sizes={product.sizes}
                      colors={product.colors}
                      fabrics={product.fabrics}
                      selection={variantSelection}
                      onChange={setVariantSelection}
                    />
                  </div>
                  <Separator />
                </>
              )}

              {/* Quantity + CTA Buttons */}
              <div className="space-y-3 pt-2">
                {/* Quantity Selector */}
                {hasVariants && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">Qty</span>
                    <div className="flex items-center border border-border rounded-lg">
                      <button
                        className="p-2 hover:bg-muted transition-colors disabled:opacity-40"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                      <button
                        className="p-2 hover:bg-muted transition-colors disabled:opacity-40"
                        onClick={() => setQuantity((q) => q + 1)}
                        disabled={product?.stock != null && quantity >= product.stock}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {product?.stock != null && (
                      <span className={cn("text-xs", product.stock <= 5 ? "text-destructive font-medium" : "text-muted-foreground")}>
                        {product.stock === 0 ? "Out of stock" : `${product.stock} left`}
                      </span>
                    )}
                  </div>
                )}

                {/* Straight Order - Add to Cart */}
                {hasVariants && (
                  <Button
                    size="lg"
                    className="w-full gap-2"
                    onClick={handleAddToCart}
                    disabled={isAdding || !isVariantSelectionComplete()}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {isAdding ? "Adding..." : `Add to Cart${quantity > 1 ? ` (${quantity})` : ""}`}
                  </Button>
                )}

                {/* Custom Order */}
                <Button
                  size="lg"
                  variant={hasVariants ? "outline" : "default"}
                  className="w-full gap-2"
                  onClick={handleCustomize}
                >
                  <Sparkles className="h-5 w-5" />
                  Customize & Order
                </Button>

                {/* Virtual Try-On */}
                <Dialog open={showVirtualTryOn} onOpenChange={setShowVirtualTryOn}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full gap-2"
                    >
                      <Ruler className="h-5 w-5" />
                      Virtual Try-On
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                    <VirtualTryOn product={product} onClose={() => setShowVirtualTryOn(false)} />
                  </DialogContent>
                </Dialog>
              </div>

              {/* Read-only specifications (collapsed when variants exist) */}
              {!hasVariants && (
                <>
                  <Separator />
                  <ProductSpecifications product={product} />
                </>
              )}

              <Separator />

              {/* Delivery & Return Policies */}
              <div className="space-y-4" id="faq">
                <h3 className="text-lg font-semibold">Delivery & Return Policies</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Estimated Delivery</p>
                      <p className="text-xs text-muted-foreground">
                        2–4 weeks after order confirmation (custom tailored)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <RotateCcw className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Returns & Alterations</p>
                      <p className="text-xs text-muted-foreground">
                        Free alterations within 14 days of delivery. See our{" "}
                        <Link to="/perfect-fit-guarantee" className="underline text-primary">
                          Perfect Fit Guarantee
                        </Link>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Truck className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Free Shipping</p>
                      <p className="text-xs text-muted-foreground">On orders over $100</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Purchase Protection</p>
                      <p className="text-xs text-muted-foreground">
                        Shop confidently — if something goes wrong with your order, we've got your back.
                      </p>
                    </div>
                  </div>
                  {tailor?.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Dispatched from</p>
                        <p className="text-xs text-muted-foreground">{tailor.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Tailor / Shop Info Card */}
              {tailor && (
                <Card className="bg-muted/30 border-border">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-4">
                      <Link to={`/tailor/${tailor.store_slug}`}>
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
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
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/tailor/${tailor.store_slug}`} className="hover:underline">
                          <p className="font-semibold text-lg">{tailor.store_name}</p>
                        </Link>
                        {tailor.location && (
                          <p className="text-sm text-muted-foreground">{tailor.location}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          {tailor.rating != null && tailor.rating > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              {tailor.rating.toFixed(1)} ({tailor.total_reviews})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => setShowMessageDrawer(true)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Message Seller
                      </Button>
                      <Button
                        variant={isFollowing ? "secondary" : "outline"}
                        className="flex-1 gap-2"
                        onClick={handleFollowShop}
                        disabled={isFollowToggling}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className="h-4 w-4" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Follow Shop
                          </>
                        )}
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      This seller usually responds within a few hours.
                    </p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>

          {/* Reviews Section */}
          <div className="mt-16">
            <Separator className="mb-12" />
            <ProductReviewsSection productId={product.id} />
          </div>
        </div>
      </main>

      <Footer />

      {/* Seller Message Drawer */}
      {tailor && (
        <SellerMessageDrawer
          open={showMessageDrawer}
          onClose={() => setShowMessageDrawer(false)}
          sellerName={tailor.store_name}
          sellerLogo={tailor.logo_url}
          sellerSlug={tailor.store_slug}
          productName={product.name}
          tailorId={tailor.id}
          tailorUserId={tailor.user_id}
          productId={product.id}
        />
      )}
    </div>
  );
};

export default ProductDetail;
