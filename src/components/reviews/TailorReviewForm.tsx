import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StarRating } from "./StarRating";
import { Label } from "@/components/ui/label";
import type { ReviewableOrder } from "@/hooks/useTailorReviews";

interface TailorReviewFormProps {
  reviewableOrders: ReviewableOrder[];
  onSubmit: (data: { orderId: string; rating: number; reviewText: string }) => void;
  isSubmitting: boolean;
}

export const TailorReviewForm = ({
  reviewableOrders,
  onSubmit,
  isSubmitting,
}: TailorReviewFormProps) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || rating === 0) return;

    onSubmit({
      orderId: selectedOrderId,
      rating,
      reviewText: reviewText.trim(),
    });

    // Reset form
    setSelectedOrderId("");
    setRating(0);
    setReviewText("");
  };

  if (reviewableOrders.length === 0) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-muted/30 rounded-lg border">
      <h4 className="font-semibold text-foreground">Rate Your Experience</h4>
      <p className="text-sm text-muted-foreground">
        Share your experience working with this tailor
      </p>

      <div className="space-y-2">
        <Label htmlFor="order-select">Select Order</Label>
        <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
          <SelectTrigger id="order-select">
            <SelectValue placeholder="Choose which order to review" />
          </SelectTrigger>
          <SelectContent>
            {reviewableOrders.map((order) => (
              <SelectItem key={order.id} value={order.id}>
                {order.order_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Rating</Label>
        <div className="flex items-center gap-2">
          <StarRating
            rating={rating}
            size="lg"
            interactive
            onRatingChange={setRating}
          />
          {rating > 0 && (
            <span className="text-sm text-muted-foreground">
              {rating} star{rating !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-text">Your Review (optional)</Label>
        <Textarea
          id="review-text"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="How was your experience with this tailor? Quality of work, communication, delivery time..."
          rows={4}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground text-right">
          {reviewText.length}/1000
        </p>
      </div>

      <Button
        type="submit"
        disabled={!selectedOrderId || rating === 0 || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
};
