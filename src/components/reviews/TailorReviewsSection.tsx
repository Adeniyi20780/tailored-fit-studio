import { useTailorReviews } from "@/hooks/useTailorReviews";
import { useAuth } from "@/contexts/AuthContext";
import { StarRating } from "./StarRating";
import { ReviewCard } from "./ReviewCard";
import { TailorReviewForm } from "./TailorReviewForm";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";

interface TailorReviewsSectionProps {
  tailorId: string;
}

export const TailorReviewsSection = ({ tailorId }: TailorReviewsSectionProps) => {
  const { user } = useAuth();
  const {
    reviews,
    reviewableOrders,
    averageRating,
    totalReviews,
    isLoading,
    submitReview,
    isSubmitting,
  } = useTailorReviews(tailorId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-foreground">
          Customer Reviews
        </h3>
        {totalReviews > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={averageRating} size="sm" />
            <span className="text-sm text-muted-foreground">
              {averageRating.toFixed(1)} ({totalReviews} review{totalReviews !== 1 ? "s" : ""})
            </span>
          </div>
        )}
      </div>

      {/* Review form for logged-in users with delivered orders */}
      {user && reviewableOrders.length > 0 && (
        <TailorReviewForm
          reviewableOrders={reviewableOrders}
          onSubmit={submitReview}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Reviews list */}
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={{
                id: review.id,
                product_id: review.tailor_id,
                order_id: review.order_id,
                customer_id: review.customer_id,
                rating: review.rating,
                review_text: review.review_text,
                created_at: review.created_at,
                updated_at: review.updated_at,
                customer_name: review.customer_name,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No reviews yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Be the first to review this tailor after your order is delivered
          </p>
        </div>
      )}
    </section>
  );
};
