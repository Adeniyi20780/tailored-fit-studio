import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, XCircle, Clock } from "lucide-react";
import { useLoyaltyProgram } from "@/hooks/useLoyaltyProgram";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  active: {
    icon: <Clock className="h-4 w-4" />,
    color: "bg-green-100 text-green-700",
    label: "Active",
  },
  used: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: "bg-gray-100 text-gray-700",
    label: "Used",
  },
  expired: {
    icon: <XCircle className="h-4 w-4" />,
    color: "bg-red-100 text-red-700",
    label: "Expired",
  },
};

export const MyRewards = () => {
  const { redemptions, isLoading } = useLoyaltyProgram();
  const { toast } = useToast();

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied!",
      description: "Reward code copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeRedemptions = redemptions.filter((r) => r.status === "active");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">My Rewards</CardTitle>
          {activeRedemptions.length > 0 && (
            <Badge>{activeRedemptions.length} active</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {redemptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No redeemed rewards yet</p>
              <p className="text-sm">Redeem your points for exclusive rewards!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {redemptions.map((redemption) => {
                const config = statusConfig[redemption.status];

                return (
                  <div
                    key={redemption.id}
                    className="p-4 rounded-lg border space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {redemption.loyalty_rewards?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {redemption.loyalty_rewards?.description}
                        </p>
                      </div>
                      <Badge className={config.color}>
                        {config.icon}
                        <span className="ml-1">{config.label}</span>
                      </Badge>
                    </div>

                    {redemption.status === "active" && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <code className="flex-1 text-sm font-mono">
                          {redemption.code}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyCode(redemption.code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        Redeemed: {format(new Date(redemption.created_at), "MMM d, yyyy")}
                      </span>
                      {redemption.expires_at && redemption.status === "active" && (
                        <span>
                          Expires: {format(new Date(redemption.expires_at), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
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
