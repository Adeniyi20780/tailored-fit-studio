import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ProductReview {
  id: string;
  product_id: string;
  order_id: string;
  customer_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string;
  customer_name?: string;
}

export interface ReviewableOrder {
  id: string;
  order_number: string;
  product_id: string;
  created_at: string;
  hasReview: boolean;
}

export const useProductReviews = (productId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all reviews for a product
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      const { data: reviewsData, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch customer names
      const customerIds = [...new Set(reviewsData.map((r) => r.customer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", customerIds);

      const profileMap = new Map(
        profiles?.map((p) => [p.user_id, p.full_name]) || []
      );

      return reviewsData.map((review) => ({
        ...review,
        customer_name: profileMap.get(review.customer_id) || "Anonymous",
      })) as ProductReview[];
    },
    enabled: !!productId,
  });

  // Fetch user's reviewable orders for this product (delivered orders without reviews)
  const { data: reviewableOrders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["reviewable-orders", productId, user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get delivered orders for this product
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, order_number, product_id, created_at")
        .eq("customer_id", user.id)
        .eq("product_id", productId)
        .eq("status", "delivered");

      if (ordersError) throw ordersError;

      // Get existing reviews by this user
      const { data: existingReviews, error: reviewsError } = await supabase
        .from("product_reviews")
        .select("order_id")
        .eq("customer_id", user.id)
        .eq("product_id", productId);

      if (reviewsError) throw reviewsError;

      const reviewedOrderIds = new Set(existingReviews?.map((r) => r.order_id));

      return orders.map((order) => ({
        ...order,
        hasReview: reviewedOrderIds.has(order.id),
      })) as ReviewableOrder[];
    },
    enabled: !!user && !!productId,
  });

  // Submit a new review
  const submitReviewMutation = useMutation({
    mutationFn: async ({
      orderId,
      rating,
      reviewText,
    }: {
      orderId: string;
      rating: number;
      reviewText: string;
    }) => {
      if (!user) throw new Error("Must be logged in to submit a review");

      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        order_id: orderId,
        customer_id: user.id,
        rating,
        review_text: reviewText || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["reviewable-orders", productId] });
    },
    onError: (error) => {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review. Please try again.");
    },
  });

  // Calculate average rating
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const pendingReviewOrders = reviewableOrders.filter((o) => !o.hasReview);

  return {
    reviews,
    reviewableOrders: pendingReviewOrders,
    averageRating,
    totalReviews: reviews.length,
    isLoading: isLoadingReviews || isLoadingOrders,
    submitReview: submitReviewMutation.mutate,
    isSubmitting: submitReviewMutation.isPending,
  };
};
