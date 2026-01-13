import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, Trash2, Plus, Minus, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CartDrawer = () => {
  const [open, setOpen] = useState(false);
  const { cartItems, cartCount, updateQuantity, removeFromCart, isUpdating, isRemoving } = useCart();

  // Fetch product details for cart items
  const { data: products = [] } = useQuery({
    queryKey: ["cart-products", cartItems.map(c => c.product_id)],
    queryFn: async () => {
      if (cartItems.length === 0) return [];
      
      const productIds = cartItems.map(c => c.product_id);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds);

      if (error) throw error;
      return data;
    },
    enabled: cartItems.length > 0,
  });

  const getProduct = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const product = getProduct(item.product_id);
    return sum + (product?.base_price || 0) * item.quantity;
  }, 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {cartCount > 99 ? "99+" : cartCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Shopping Cart
            {cartCount > 0 && (
              <Badge variant="secondary">{cartCount} items</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingCart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">
              Add some products to get started
            </p>
            <Button asChild onClick={() => setOpen(false)}>
              <Link to="/catalog">Browse Catalog</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                <AnimatePresence mode="popLayout">
                  {cartItems.map((item) => {
                    const product = getProduct(item.product_id);
                    if (!product) return null;

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex gap-4 p-3 rounded-lg bg-muted/30"
                      >
                        <Link 
                          to={`/product/${product.id}`} 
                          onClick={() => setOpen(false)}
                          className="shrink-0"
                        >
                          <img
                            src={product.images?.[0] || "/placeholder.svg"}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-md"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={`/product/${product.id}`}
                            onClick={() => setOpen(false)}
                          >
                            <h4 className="font-medium text-sm line-clamp-1 hover:text-primary transition-colors">
                              {product.name}
                            </h4>
                          </Link>
                          <p className="text-sm text-muted-foreground capitalize">
                            {product.category}
                          </p>
                          <p className="font-semibold mt-1">
                            {product.currency || "$"}{product.base_price.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity({ 
                                itemId: item.id, 
                                quantity: item.quantity - 1 
                              })}
                              disabled={isUpdating}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity({ 
                                itemId: item.id, 
                                quantity: item.quantity + 1 
                              })}
                              disabled={isUpdating}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-auto text-destructive hover:text-destructive"
                              onClick={() => removeFromCart(item.id)}
                              disabled={isRemoving}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </ScrollArea>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-display text-2xl font-bold">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Shipping and customization costs calculated at checkout
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild size="lg" onClick={() => setOpen(false)}>
                  <Link to="/checkout" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Proceed to Checkout
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setOpen(false)}
                  asChild
                >
                  <Link to="/catalog">Continue Shopping</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
