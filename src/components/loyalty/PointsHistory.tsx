import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpCircle, ArrowDownCircle, Gift, Clock } from "lucide-react";
import { useLoyaltyProgram } from "@/hooks/useLoyaltyProgram";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const typeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  earned: {
    icon: <ArrowUpCircle className="h-4 w-4" />,
    color: "text-green-600 bg-green-100",
    label: "Earned",
  },
  redeemed: {
    icon: <ArrowDownCircle className="h-4 w-4" />,
    color: "text-blue-600 bg-blue-100",
    label: "Redeemed",
  },
  expired: {
    icon: <Clock className="h-4 w-4" />,
    color: "text-gray-600 bg-gray-100",
    label: "Expired",
  },
  bonus: {
    icon: <Gift className="h-4 w-4" />,
    color: "text-purple-600 bg-purple-100",
    label: "Bonus",
  },
};

export const PointsHistory = () => {
  const { transactions, isLoading } = useLoyaltyProgram();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Points History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Start shopping to earn points!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const config = typeConfig[transaction.type];

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${config.color}`}>
                        {config.icon}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {transaction.description || config.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(transaction.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={transaction.points > 0 ? "default" : "secondary"}
                      className={transaction.points > 0 ? "bg-green-600" : ""}
                    >
                      {transaction.points > 0 ? "+" : ""}
                      {transaction.points.toLocaleString()} pts
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
