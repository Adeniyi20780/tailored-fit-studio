import { useProductReviews } from "@/hooks/useProductReviews";
import { useAuth } from "@/contexts/AuthContext";
import { StarRating } from "./StarRating";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";

interface ProductReviewsSectionProps {
  productId: string;
}

export const ProductReviewsSection = ({ productId }: ProductReviewsSectionProps) => {
  const { user } = useAuth();
  const {
    reviews,
    reviewableOrders,
    averageRating,
    totalReviews,
    isLoading,
    submitReview,
    isSubmitting,
  } = useProductReviews(productId);

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
        <ReviewForm
          reviewableOrders={reviewableOrders}
          onSubmit={submitReview}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Reviews list */}
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No reviews yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Be the first to review this product after your order is delivered
          </p>
        </div>
      )}
    </section>
  );
};
