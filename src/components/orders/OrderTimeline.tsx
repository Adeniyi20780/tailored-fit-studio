import { format } from "date-fns";
import { motion } from "framer-motion";
import { 
  Clock, 
  Package, 
  Scissors, 
  Box, 
  Truck, 
  CheckCircle2, 
  XCircle,
  AlertCircle
} from "lucide-react";
import { useOrderTimeline, TimelineEvent } from "@/hooks/useOrderTimeline";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface OrderTimelineProps {
  orderId: string;
  className?: string;
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return <Clock className="h-5 w-5" />;
    case "processing":
      return <AlertCircle className="h-5 w-5" />;
    case "tailoring":
      return <Scissors className="h-5 w-5" />;
    case "packaging":
      return <Box className="h-5 w-5" />;
    case "shipped":
      return <Truck className="h-5 w-5" />;
    case "delivered":
    case "completed":
      return <CheckCircle2 className="h-5 w-5" />;
    case "cancelled":
      return <XCircle className="h-5 w-5" />;
    default:
      return <Package className="h-5 w-5" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "text-yellow-500 bg-yellow-500/10";
    case "processing":
      return "text-blue-500 bg-blue-500/10";
    case "tailoring":
      return "text-purple-500 bg-purple-500/10";
    case "packaging":
      return "text-orange-500 bg-orange-500/10";
    case "shipped":
      return "text-indigo-500 bg-indigo-500/10";
    case "delivered":
    case "completed":
      return "text-green-500 bg-green-500/10";
    case "cancelled":
      return "text-red-500 bg-red-500/10";
    default:
      return "text-muted-foreground bg-muted";
  }
};

const formatStatus = (status: string) => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const OrderTimeline = ({ orderId, className }: OrderTimelineProps) => {
  const { timeline, isLoading } = useOrderTimeline(orderId);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <Clock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No timeline events yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Events will appear as your order progresses
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-6">
        {timeline.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex gap-4"
          >
            {/* Icon */}
            <div
              className={cn(
                "relative z-10 flex h-10 w-10 items-center justify-center rounded-full",
                getStatusColor(event.status)
              )}
            >
              {getStatusIcon(event.status)}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-medium text-foreground">
                  {formatStatus(event.status)}
                </h4>
                <time className="text-xs text-muted-foreground">
                  {format(new Date(event.created_at), "MMM d, h:mm a")}
                </time>
              </div>
              {event.note && (
                <p className="text-sm text-muted-foreground mt-1">
                  {event.note}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
