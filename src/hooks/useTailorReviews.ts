import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TailorReview {
  id: string;
  tailor_id: string;
  order_id: string;
  customer_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  order_number?: string;
}

export interface ReviewableOrder {
  id: string;
  order_number: string;
  tailor_id: string;
  tailor_name: string;
  created_at: string;
  hasReview: boolean;
}

export const useTailorReviews = (tailorId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all reviews for a tailor
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ["tailor-reviews", tailorId],
    queryFn: async () => {
      const { data: reviewsData, error } = await supabase
        .from("tailor_reviews")
        .select("*")
        .eq("tailor_id", tailorId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch customer names
      const customerIds = [...new Set(reviewsData.map((r) => r.customer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", customerIds);

      // Fetch order numbers
      const orderIds = reviewsData.map((r) => r.order_id);
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_number")
        .in("id", orderIds);

      const profileMap = new Map(
        profiles?.map((p) => [p.user_id, p.full_name]) || []
      );
      const orderMap = new Map(
        orders?.map((o) => [o.id, o.order_number]) || []
      );

      return reviewsData.map((review) => ({
        ...review,
        customer_name: profileMap.get(review.customer_id) || "Anonymous",
        order_number: orderMap.get(review.order_id) || "Unknown",
      })) as TailorReview[];
    },
    enabled: !!tailorId,
  });

  // Fetch user's reviewable orders for this tailor (delivered orders without reviews)
  const { data: reviewableOrders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["reviewable-tailor-orders", tailorId, user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get delivered orders from this tailor
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, order_number, tailor_id, created_at")
        .eq("customer_id", user.id)
        .eq("tailor_id", tailorId)
        .eq("status", "delivered");

      if (ordersError) throw ordersError;

      // Get existing reviews by this user for this tailor
      const { data: existingReviews, error: reviewsError } = await supabase
        .from("tailor_reviews")
        .select("order_id")
        .eq("customer_id", user.id)
        .eq("tailor_id", tailorId);

      if (reviewsError) throw reviewsError;

      // Get tailor name
      const { data: tailor } = await supabase
        .from("tailors")
        .select("store_name")
        .eq("id", tailorId)
        .single();

      const reviewedOrderIds = new Set(existingReviews?.map((r) => r.order_id));

      return orders.map((order) => ({
        ...order,
        tailor_name: tailor?.store_name || "Unknown Store",
        hasReview: reviewedOrderIds.has(order.id),
      })) as ReviewableOrder[];
    },
    enabled: !!user && !!tailorId,
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

      const { error } = await supabase.from("tailor_reviews").insert({
        tailor_id: tailorId,
        order_id: orderId,
        customer_id: user.id,
        rating,
        review_text: reviewText || null,
      });

      if (error) throw error;

      // Update tailor's rating and total reviews
      const { data: allReviews } = await supabase
        .from("tailor_reviews")
        .select("rating")
        .eq("tailor_id", tailorId);

      if (allReviews && allReviews.length > 0) {
        const totalReviews = allReviews.length;
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

        await supabase
          .from("tailors")
          .update({
            rating: Math.round(avgRating * 10) / 10,
            total_reviews: totalReviews,
          })
          .eq("id", tailorId);
      }
    },
    onSuccess: () => {
      toast.success("Review submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["tailor-reviews", tailorId] });
      queryClient.invalidateQueries({ queryKey: ["reviewable-tailor-orders", tailorId] });
      queryClient.invalidateQueries({ queryKey: ["tailor-store"] });
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

// Hook for customer to see all their reviewable orders
export const useCustomerReviewableOrders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["customer-reviewable-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all delivered orders for this customer
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, order_number, tailor_id, created_at")
        .eq("customer_id", user.id)
        .eq("status", "delivered")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Get existing tailor reviews by this user
      const { data: existingReviews, error: reviewsError } = await supabase
        .from("tailor_reviews")
        .select("order_id")
        .eq("customer_id", user.id);

      if (reviewsError) throw reviewsError;

      const reviewedOrderIds = new Set(existingReviews?.map((r) => r.order_id));

      // Get tailor names
      const tailorIds = [...new Set(orders.map((o) => o.tailor_id).filter(Boolean))];
      const { data: tailors } = await supabase
        .from("tailors")
        .select("id, store_name")
        .in("id", tailorIds);

      const tailorMap = new Map(
        tailors?.map((t) => [t.id, t.store_name]) || []
      );

      return orders
        .filter((order) => !reviewedOrderIds.has(order.id))
        .map((order) => ({
          ...order,
          tailor_name: tailorMap.get(order.tailor_id!) || "Unknown Store",
          hasReview: false,
        })) as ReviewableOrder[];
    },
    enabled: !!user,
  });
};
