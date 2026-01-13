import { format } from "date-fns";
import { StarRating } from "./StarRating";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ProductReview } from "@/hooks/useProductReviews";

interface ReviewCardProps {
  review: ProductReview;
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  const initials = review.customer_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div className="border-b border-border pb-6 last:border-0">
      <div className="flex items-start gap-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-medium text-foreground">
              {review.customer_name}
            </span>
            <span className="text-sm text-muted-foreground">
              {format(new Date(review.created_at), "MMM d, yyyy")}
            </span>
          </div>

          <StarRating rating={review.rating} size="sm" />

          {review.review_text && (
            <p className="mt-3 text-muted-foreground leading-relaxed">
              {review.review_text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
