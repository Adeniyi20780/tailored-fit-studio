import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Sparkles, Trophy } from "lucide-react";
import { useLoyaltyProgram } from "@/hooks/useLoyaltyProgram";
import { Skeleton } from "@/components/ui/skeleton";

const tierIcons: Record<string, React.ReactNode> = {
  Bronze: <Star className="h-5 w-5" />,
  Silver: <Sparkles className="h-5 w-5" />,
  Gold: <Crown className="h-5 w-5" />,
  Platinum: <Trophy className="h-5 w-5" />,
};

const tierColors: Record<string, string> = {
  Bronze: "bg-amber-600",
  Silver: "bg-slate-400",
  Gold: "bg-yellow-500",
  Platinum: "bg-purple-600",
};

export const LoyaltyCard = () => {
  const { loyalty, currentTier, nextTier, progressToNextTier, pointsToNextTier, isLoading } = useLoyaltyProgram();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className={`h-2 ${tierColors[currentTier?.name || "Bronze"]}`} />
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-full ${tierColors[currentTier?.name || "Bronze"]} text-white`}>
              {tierIcons[currentTier?.name || "Bronze"]}
            </div>
            <div>
              <CardTitle className="text-lg">{currentTier?.name || "Bronze"} Member</CardTitle>
              <CardDescription>
                {currentTier?.multiplier}x points multiplier
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {loyalty?.available_points.toLocaleString() || 0} pts
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{loyalty?.available_points.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground">Available Points</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{loyalty?.lifetime_points.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground">Lifetime Points</p>
          </div>
        </div>

        {nextTier && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to {nextTier.name}</span>
              <span className="text-muted-foreground">{pointsToNextTier.toLocaleString()} pts to go</span>
            </div>
            <Progress value={progressToNextTier} className="h-2" />
          </div>
        )}

        {currentTier && (
          <div className="pt-2">
            <p className="text-sm font-medium mb-2">Your Benefits:</p>
            <ul className="space-y-1">
              {currentTier.benefits.map((benefit, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-primary rounded-full" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
