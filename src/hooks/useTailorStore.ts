import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Tailor = Tables<"tailors">;
export type Product = Tables<"products">;

export interface TailorWithProducts extends Tailor {
  products: Product[];
}

export const useTailorStore = (storeSlug: string) => {
  // Fetch tailor by slug
  const { data: tailor, isLoading: tailorLoading, error: tailorError } = useQuery({
    queryKey: ["public-tailor", storeSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tailors")
        .select("*")
        .eq("store_slug", storeSlug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as Tailor | null;
    },
    enabled: !!storeSlug,
  });

  // Fetch tailor's products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["public-tailor-products", tailor?.id],
    queryFn: async () => {
      if (!tailor?.id) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("tailor_id", tailor.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!tailor?.id,
  });

  return {
    tailor,
    products: products || [],
    isLoading: tailorLoading || productsLoading,
    error: tailorError,
  };
};
