import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  customizations: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export const useCart = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CartItem[];
    },
    enabled: !!user,
  });

  const addToCart = useMutation({
    mutationFn: async ({ 
      productId, 
      quantity = 1, 
      customizations = null 
    }: { 
      productId: string; 
      quantity?: number;
      customizations?: Record<string, any> | null;
    }) => {
      if (!user) throw new Error("Must be logged in");

      // Check if item already exists in cart
      const existingItem = cartItems.find(item => item.product_id === productId);

      if (existingItem) {
        // Update quantity
        const { error } = await supabase
          .from("cart_items")
          .update({ 
            quantity: existingItem.quantity + quantity,
            customizations: customizations || existingItem.customizations
          })
          .eq("id", existingItem.id);

        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabase
          .from("cart_items")
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity,
            customizations,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (!user) throw new Error("Must be logged in");

      if (quantity <= 0) {
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("id", itemId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity })
          .eq("id", itemId)
          .eq("user_id", user.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeFromCart = useMutation({
    mutationFn: async (itemId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
      toast({
        title: "Removed from cart",
        description: "Product has been removed from your cart",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isInCart = (productId: string) => {
    return cartItems.some((item) => item.product_id === productId);
  };

  const getCartItem = (productId: string) => {
    return cartItems.find((item) => item.product_id === productId);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cartItems,
    isLoading,
    addToCart: addToCart.mutate,
    updateQuantity: updateQuantity.mutate,
    removeFromCart: removeFromCart.mutate,
    clearCart: clearCart.mutate,
    isInCart,
    getCartItem,
    cartCount,
    isAdding: addToCart.isPending,
    isUpdating: updateQuantity.isPending,
    isRemoving: removeFromCart.isPending,
  };
};
