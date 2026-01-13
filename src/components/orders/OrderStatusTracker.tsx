import { Check, Package, Scissors, Box, Truck, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_STEPS, getStatusIndex } from "@/hooks/useCustomerOrders";

interface OrderStatusTrackerProps {
  currentStatus: string;
  className?: string;
}

const STATUS_ICONS = [Package, Package, Scissors, Box, Truck, Home];

const OrderStatusTracker = ({ currentStatus, className }: OrderStatusTrackerProps) => {
  const currentIndex = getStatusIndex(currentStatus);
  const isCancelled = currentStatus === "cancelled";

  if (isCancelled) {
    return (
      <div className={cn("p-4 bg-destructive/10 rounded-lg text-center", className)}>
        <p className="text-destructive font-medium">Order Cancelled</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {ORDER_STATUS_STEPS.map((step, index) => {
          const Icon = STATUS_ICONS[index];
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={step.value} className="flex flex-col items-center flex-1 relative">
              {/* Connector line */}
              {index > 0 && (
                <div
                  className={cn(
                    "absolute top-4 -left-1/2 w-full h-0.5",
                    isCompleted || isCurrent ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
              
              {/* Status circle */}
              <div
                className={cn(
                  "relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  isPending && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "mt-2 text-xs text-center font-medium",
                  isCurrent && "text-primary",
                  isPending && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatusTracker;
