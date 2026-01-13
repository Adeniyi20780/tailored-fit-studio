import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Trash2, Sparkles, ShoppingBag, Loader2, Share2, Copy, Check, Twitter, Facebook, Mail, Bell, BellOff, Link2, Users, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useWishlist } from "@/hooks/useWishlist";
import { useWishlistNotifications } from "@/hooks/useWishlistNotifications";
import { useSharedWishlist } from "@/hooks/useSharedWishlist";
import { useCart } from "@/hooks/useCart";
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

const Wishlist = () => {
  const { wishlistItems, isLoading: wishlistLoading, removeFromWishlist, isToggling } = useWishlist();
  const { hasNotificationsEnabled, toggleNotifications, isToggling: isTogglingNotifications } = useWishlistNotifications();
  const { createSharedWishlist, isCreating, getShareUrl } = useSharedWishlist();
  const { addToCart, isInCart, isAdding } = useCart();
  const { toast } = useToast();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareWishlistDialogOpen, setShareWishlistDialogOpen] = useState(false);
  const [sharedWishlistUrl, setSharedWishlistUrl] = useState("");
  const [shareProduct, setShareProduct] = useState<typeof products[0] | null>(null);
  const [copied, setCopied] = useState(false);

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

  const getProductUrl = (productId: string) => {
    return `${window.location.origin}/product/${productId}`;
  };

  const handleCopyLink = async (product: typeof products[0]) => {
    const url = getProductUrl(product.id);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Product link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShareTwitter = (product: typeof products[0]) => {
    const url = getProductUrl(product.id);
    const text = `Check out this ${product.name} on TailorsShop!`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
  };

  const handleShareFacebook = (product: typeof products[0]) => {
    const url = getProductUrl(product.id);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  };

  const handleShareEmail = (product: typeof products[0]) => {
    const url = getProductUrl(product.id);
    const subject = `Check out this ${product.name} on TailorsShop!`;
    const body = `I found this amazing product and thought you might like it:\n\n${product.name}\n${url}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const openShareDialog = (product: typeof products[0]) => {
    setShareProduct(product);
    setShareDialogOpen(true);
  };

  const handleShareEntireWishlist = async () => {
    if (wishlistItems.length === 0) {
      toast({
        title: "Empty wishlist",
        description: "Add some products to share your wishlist.",
        variant: "destructive",
      });
      return;
    }

    try {
      const productIds = wishlistItems.map(w => w.product_id);
      const sharedWishlist = await createSharedWishlist({ productIds });
      const url = getShareUrl(sharedWishlist.share_code);
      setSharedWishlistUrl(url);
      setShareWishlistDialogOpen(true);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleCopyWishlistLink = async () => {
    try {
      await navigator.clipboard.writeText(sharedWishlistUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link with friends to show them your wishlist.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
    }
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
              <p className="text-muted-foreground mb-6">
                {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"} saved
              </p>
              {wishlistItems.length > 0 && (
                <Button
                  onClick={handleShareEntireWishlist}
                  disabled={isCreating}
                  variant="outline"
                  className="gap-2"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                  Share Entire Wishlist
                </Button>
              )}
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

                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs text-muted-foreground">From</span>
                          <span className="font-display text-xl font-bold text-foreground">
                            {product.currency || "$"}{product.base_price.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Notification Toggle */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {hasNotificationsEnabled(product.id) ? (
                            <Bell className="w-4 h-4 text-primary" />
                          ) : (
                            <BellOff className="w-4 h-4 text-muted-foreground" />
                          )}
                          <Label htmlFor={`notify-${product.id}`} className="text-xs cursor-pointer">
                            Price & stock alerts
                          </Label>
                        </div>
                        <Switch
                          id={`notify-${product.id}`}
                          checked={hasNotificationsEnabled(product.id)}
                          onCheckedChange={() => toggleNotifications(product.id)}
                          disabled={isTogglingNotifications}
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant={isInCart(product.id) ? "secondary" : "default"}
                          className="flex-1 gap-1.5"
                          onClick={() => addToCart({ productId: product.id })}
                          disabled={isAdding || isInCart(product.id)}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {isInCart(product.id) ? "In Cart" : "Add to Cart"}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCopyLink(product)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleShareTwitter(product)}>
                              <Twitter className="w-4 h-4 mr-2" />
                              Share on Twitter
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShareFacebook(product)}>
                              <Facebook className="w-4 h-4 mr-2" />
                              Share on Facebook
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShareEmail(product)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Share via Email
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Product</DialogTitle>
            <DialogDescription>
              Share this product with friends and family
            </DialogDescription>
          </DialogHeader>
          {shareProduct && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <img
                  src={shareProduct.images?.[0] || "/placeholder.svg"}
                  alt={shareProduct.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <p className="font-medium">{shareProduct.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {shareProduct.currency || "$"}{shareProduct.base_price.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={getProductUrl(shareProduct.id)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => handleCopyLink(shareProduct)}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleShareTwitter(shareProduct)}
                  className="flex-1"
                >
                  <Twitter className="w-5 h-5 mr-2" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleShareFacebook(shareProduct)}
                  className="flex-1"
                >
                  <Facebook className="w-5 h-5 mr-2" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleShareEmail(shareProduct)}
                  className="flex-1"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Entire Wishlist Dialog */}
      <Dialog open={shareWishlistDialogOpen} onOpenChange={setShareWishlistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Share Your Wishlist
            </DialogTitle>
            <DialogDescription>
              Anyone with this link can view your wishlist collection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Sharing</p>
              <p className="font-semibold text-lg">
                {products.length} {products.length === 1 ? "product" : "products"}
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                readOnly
                value={sharedWishlistUrl}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleCopyWishlistLink}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  const text = `Check out my wishlist on TailorsShop!`;
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(sharedWishlistUrl)}`, "_blank");
                }}
              >
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sharedWishlistUrl)}`, "_blank");
                }}
              >
                <Facebook className="w-4 h-4 mr-2" />
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const subject = `Check out my wishlist on TailorsShop!`;
                  const body = `I wanted to share my wishlist with you:\n\n${sharedWishlistUrl}`;
                  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Wishlist;
