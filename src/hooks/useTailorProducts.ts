import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type TailorProduct = Tables<"products">;

export const useTailorProducts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get tailor info for the current user
  const { data: tailor } = useQuery({
    queryKey: ["tailor", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("tailors")
        .select("id, store_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch all products for the tailor
  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tailor-products", tailor?.id],
    queryFn: async () => {
      if (!tailor?.id) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("tailor_id", tailor.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TailorProduct[];
    },
    enabled: !!tailor?.id,
  });

  // Toggle product active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["tailor-products"] });
      toast({
        title: isActive ? "Product activated" : "Product deactivated",
        description: `The product is now ${isActive ? "visible" : "hidden"} in your catalog.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product status",
        variant: "destructive",
      });
    },
  });

  // Update product
  const updateProductMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TailorProduct>;
    }) => {
      const { error } = await supabase
        .from("products")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tailor-products"] });
      toast({
        title: "Product updated",
        description: "Your product has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  // Delete product
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tailor-products"] });
      toast({
        title: "Product deleted",
        description: "The product has been removed from your catalog.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  return {
    tailor,
    products: products || [],
    isLoading,
    error,
    toggleActive: toggleActiveMutation.mutate,
    updateProduct: updateProductMutation.mutate,
    deleteProduct: deleteProductMutation.mutate,
    isUpdating: updateProductMutation.isPending,
    isDeleting: deleteProductMutation.isPending,
  };
};
