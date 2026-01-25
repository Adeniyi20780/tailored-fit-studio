import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface ComparisonProduct {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  currency: string;
  category: string;
  images: string[] | null;
  sizes: string[] | null;
  colors: string[] | null;
  fabrics: string[] | null;
  tailor_id: string | null;
  tailors?: {
    store_name: string;
    rating: number;
  } | null;
}

const MAX_COMPARISON_ITEMS = 4;
const SESSION_KEY = "comparison_session_id";

const getSessionId = () => {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

export const useProductComparison = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sessionId] = useState(getSessionId);

  // Fetch compared product IDs
  const { data: comparisonData, isLoading: comparisonLoading } = useQuery({
    queryKey: ["product-comparison", user?.id, sessionId],
    queryFn: async () => {
      const query = supabase
        .from("product_comparisons")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1);

      if (user) {
        query.eq("user_id", user.id);
      } else {
        query.eq("session_id", sessionId);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const productIds = (comparisonData?.product_ids as string[]) || [];

  // Fetch full product details for comparison
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["comparison-products", productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];

      const { data, error } = await supabase
        .from("products")
        .select("*, tailors(store_name, rating)")
        .in("id", productIds);

      if (error) throw error;
      return data as ComparisonProduct[];
    },
    enabled: productIds.length > 0,
  });

  // Add product to comparison
  const addToComparison = useMutation({
    mutationFn: async (productId: string) => {
      if (productIds.includes(productId)) {
        throw new Error("Product already in comparison");
      }

      if (productIds.length >= MAX_COMPARISON_ITEMS) {
        throw new Error(`Maximum ${MAX_COMPARISON_ITEMS} products can be compared`);
      }

      const newProductIds = [...productIds, productId];

      if (comparisonData) {
        const { error } = await supabase
          .from("product_comparisons")
          .update({ product_ids: newProductIds })
          .eq("id", comparisonData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("product_comparisons")
          .insert({
            user_id: user?.id || null,
            session_id: user ? null : sessionId,
            product_ids: newProductIds,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-comparison"] });
      queryClient.invalidateQueries({ queryKey: ["comparison-products"] });
      toast({
        title: "Added to Comparison",
        description: "Product added to comparison list",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove product from comparison
  const removeFromComparison = useMutation({
    mutationFn: async (productId: string) => {
      if (!comparisonData) return;

      const newProductIds = productIds.filter((id) => id !== productId);

      const { error } = await supabase
        .from("product_comparisons")
        .update({ product_ids: newProductIds })
        .eq("id", comparisonData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-comparison"] });
      queryClient.invalidateQueries({ queryKey: ["comparison-products"] });
    },
  });

  // Clear all comparisons
  const clearComparison = useMutation({
    mutationFn: async () => {
      if (!comparisonData) return;

      const { error } = await supabase
        .from("product_comparisons")
        .update({ product_ids: [] })
        .eq("id", comparisonData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-comparison"] });
      queryClient.invalidateQueries({ queryKey: ["comparison-products"] });
      toast({
        title: "Comparison Cleared",
        description: "All products removed from comparison",
      });
    },
  });

  const isInComparison = (productId: string) => productIds.includes(productId);

  return {
    products,
    productIds,
    isLoading: comparisonLoading || productsLoading,
    addToComparison: addToComparison.mutate,
    removeFromComparison: removeFromComparison.mutate,
    clearComparison: clearComparison.mutate,
    isInComparison,
    canAddMore: productIds.length < MAX_COMPARISON_ITEMS,
    comparisonCount: productIds.length,
  };
};
