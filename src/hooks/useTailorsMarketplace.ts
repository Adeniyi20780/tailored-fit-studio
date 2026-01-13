import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TailorListing {
  id: string;
  user_id: string;
  store_name: string;
  store_slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  location: string | null;
  specialties: string[] | null;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  product_count?: number;
}

export type SortOption = "rating" | "products" | "newest";

export const useTailorsMarketplace = (
  searchQuery?: string,
  specialtyFilter?: string,
  sortBy: SortOption = "rating"
) => {
  return useQuery({
    queryKey: ["tailors-marketplace", searchQuery, specialtyFilter, sortBy],
    queryFn: async () => {
      // Fetch all active tailors
      const { data: tailors, error: tailorsError } = await supabase
        .from("tailors")
        .select("*")
        .eq("is_active", true)
        .order("rating", { ascending: false });

      if (tailorsError) throw tailorsError;

      // Fetch product counts for each tailor
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("tailor_id")
        .eq("is_active", true);

      if (productsError) throw productsError;

      // Count products per tailor
      const productCounts = products.reduce((acc, p) => {
        if (p.tailor_id) {
          acc[p.tailor_id] = (acc[p.tailor_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Combine data
      let result = tailors.map((tailor) => ({
        ...tailor,
        product_count: productCounts[tailor.id] || 0,
      })) as TailorListing[];

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(
          (t) =>
            t.store_name.toLowerCase().includes(query) ||
            t.description?.toLowerCase().includes(query) ||
            t.location?.toLowerCase().includes(query) ||
            t.specialties?.some((s) => s.toLowerCase().includes(query))
        );
      }

      // Apply specialty filter
      if (specialtyFilter && specialtyFilter !== "all") {
        result = result.filter((t) =>
          t.specialties?.some((s) => s.toLowerCase() === specialtyFilter.toLowerCase())
        );
      }

      // Apply sorting
      switch (sortBy) {
        case "rating":
          result.sort((a, b) => b.rating - a.rating);
          break;
        case "products":
          result.sort((a, b) => (b.product_count || 0) - (a.product_count || 0));
          break;
        case "newest":
          // Tailors table doesn't have created_at in our select, so we'll use id as proxy
          // or we could add created_at to the query - for now sort by id descending
          result.sort((a, b) => b.id.localeCompare(a.id));
          break;
      }

      return result;
    },
  });
};

// Get all unique specialties across tailors
export const useAllSpecialties = () => {
  return useQuery({
    queryKey: ["all-specialties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tailors")
        .select("specialties")
        .eq("is_active", true);

      if (error) throw error;

      const allSpecialties = new Set<string>();
      data.forEach((t) => {
        t.specialties?.forEach((s: string) => allSpecialties.add(s));
      });

      return Array.from(allSpecialties).sort();
    },
  });
};
