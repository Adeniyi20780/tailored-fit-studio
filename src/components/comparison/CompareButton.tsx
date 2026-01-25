import { Button } from "@/components/ui/button";
import { GitCompare, Check } from "lucide-react";
import { useProductComparison } from "@/hooks/useProductComparison";
import { cn } from "@/lib/utils";

interface CompareButtonProps {
  productId: string;
  variant?: "icon" | "full";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export const CompareButton = ({
  productId,
  variant = "icon",
  size = "default",
  className,
}: CompareButtonProps) => {
  const { addToComparison, removeFromComparison, isInComparison, canAddMore } = useProductComparison();

  const inComparison = isInComparison(productId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inComparison) {
      removeFromComparison(productId);
    } else {
      addToComparison(productId);
    }
  };

  if (variant === "icon") {
    return (
      <Button
        variant={inComparison ? "default" : "outline"}
        size="icon"
        className={cn("h-8 w-8", className)}
        onClick={handleClick}
        disabled={!inComparison && !canAddMore}
        title={inComparison ? "Remove from comparison" : "Add to comparison"}
      >
        {inComparison ? (
          <Check className="h-4 w-4" />
        ) : (
          <GitCompare className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={inComparison ? "secondary" : "outline"}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={!inComparison && !canAddMore}
    >
      {inComparison ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          In Comparison
        </>
      ) : (
        <>
          <GitCompare className="h-4 w-4 mr-2" />
          Compare
        </>
      )}
    </Button>
  );
};
