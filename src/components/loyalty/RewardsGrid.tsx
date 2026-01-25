import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Percent, Truck, Package } from "lucide-react";
import { useLoyaltyProgram, LoyaltyReward } from "@/hooks/useLoyaltyProgram";
import { Skeleton } from "@/components/ui/skeleton";

const rewardIcons: Record<string, React.ReactNode> = {
  discount_percentage: <Percent className="h-6 w-6" />,
  discount_fixed: <Gift className="h-6 w-6" />,
  free_shipping: <Truck className="h-6 w-6" />,
  free_product: <Package className="h-6 w-6" />,
};

const formatRewardValue = (reward: LoyaltyReward) => {
  switch (reward.reward_type) {
    case "discount_percentage":
      return `${reward.reward_value}% Off`;
    case "discount_fixed":
      return `₦${reward.reward_value.toLocaleString()} Off`;
    case "free_shipping":
      return "Free Shipping";
    case "free_product":
      return "Free Product";
    default:
      return reward.name;
  }
};

export const RewardsGrid = () => {
  const { rewards, loyalty, redeemReward, isRedeeming, isLoading } = useLoyaltyProgram();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Available Rewards</h3>
        <Badge variant="outline">
          {loyalty?.available_points.toLocaleString() || 0} points available
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward) => {
          const canRedeem = (loyalty?.available_points || 0) >= reward.points_cost;

          return (
            <Card key={reward.id} className={!canRedeem ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {rewardIcons[reward.reward_type]}
                  </div>
                  <Badge variant="secondary">{reward.points_cost} pts</Badge>
                </div>
                <CardTitle className="text-base mt-3">{reward.name}</CardTitle>
                <CardDescription>{reward.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    {formatRewardValue(reward)}
                  </span>
                  <Button
                    size="sm"
                    disabled={!canRedeem || isRedeeming}
                    onClick={() => redeemReward(reward.id)}
                  >
                    Redeem
                  </Button>
                </div>
                {!canRedeem && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Need {(reward.points_cost - (loyalty?.available_points || 0)).toLocaleString()} more points
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
