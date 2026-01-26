import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, Gift, Users, TrendingUp, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface LoyaltyTier {
  id: string;
  name: string;
  min_points: number;
  multiplier: number;
  benefits: string[];
  created_at: string;
}

interface LoyaltyReward {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  reward_type: string;
  reward_value: number;
  min_tier_id: string | null;
  is_active: boolean;
  stock: number | null;
  created_at: string;
}

interface CustomerLoyalty {
  id: string;
  user_id: string;
  total_points: number;
  available_points: number;
  lifetime_points: number;
  current_tier_id: string | null;
  created_at: string;
}

interface PointsTransaction {
  id: string;
  user_id: string;
  points: number;
  type: string;
  description: string | null;
  created_at: string;
}

const AdminLoyaltySection = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [isAddingReward, setIsAddingReward] = useState(false);

  // Fetch all loyalty data
  const { data: tiers = [] } = useQuery({
    queryKey: ["admin-loyalty-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_tiers")
        .select("*")
        .order("min_points", { ascending: true });
      if (error) throw error;
      return data as LoyaltyTier[];
    },
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ["admin-loyalty-rewards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_rewards")
        .select("*")
        .order("points_cost", { ascending: true });
      if (error) throw error;
      return data as LoyaltyReward[];
    },
  });

  const { data: customerLoyalty = [] } = useQuery({
    queryKey: ["admin-customer-loyalty"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_loyalty")
        .select("*, loyalty_tiers(name)")
        .order("lifetime_points", { ascending: false });
      if (error) throw error;
      return data as (CustomerLoyalty & { loyalty_tiers: { name: string } | null })[];
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["admin-points-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("points_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as PointsTransaction[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles-for-loyalty"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email");
      if (error) throw error;
      return data || [];
    },
  });

  // Update tier mutation
  const updateTier = useMutation({
    mutationFn: async (tier: Partial<LoyaltyTier> & { id: string }) => {
      const { error } = await supabase
        .from("loyalty_tiers")
        .update({
          name: tier.name,
          min_points: tier.min_points,
          multiplier: tier.multiplier,
          benefits: tier.benefits,
        })
        .eq("id", tier.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-loyalty-tiers"] });
      setEditingTier(null);
      toast({ title: "Tier updated successfully" });
    },
  });

  // Reward mutations
  const createReward = useMutation({
    mutationFn: async (reward: Omit<LoyaltyReward, "id" | "created_at">) => {
      const { error } = await supabase.from("loyalty_rewards").insert(reward);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-loyalty-rewards"] });
      setIsAddingReward(false);
      toast({ title: "Reward created successfully" });
    },
  });

  const updateReward = useMutation({
    mutationFn: async (reward: Partial<LoyaltyReward> & { id: string }) => {
      const { id, ...data } = reward;
      const { error } = await supabase
        .from("loyalty_rewards")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-loyalty-rewards"] });
      setEditingReward(null);
      toast({ title: "Reward updated successfully" });
    },
  });

  const deleteReward = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("loyalty_rewards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-loyalty-rewards"] });
      toast({ title: "Reward deleted successfully" });
    },
  });

  // Stats
  const totalPoints = customerLoyalty.reduce((sum, c) => sum + c.total_points, 0);
  const activeMembers = customerLoyalty.length;
  const totalRedemptions = transactions.filter((t) => t.type === "redeemed").length;

  const getProfileName = (userId: string) => {
    const profile = profiles.find((p) => p.user_id === userId);
    return profile?.full_name || profile?.email || userId.slice(0, 8);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{activeMembers}</p>
                <p className="text-sm text-muted-foreground">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{totalPoints.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Points Issued</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-terracotta/10 flex items-center justify-center">
                <Gift className="w-5 h-5 text-terracotta" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{totalRedemptions}</p>
                <p className="text-sm text-muted-foreground">Rewards Redeemed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Crown className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{tiers.length}</p>
                <p className="text-sm text-muted-foreground">Loyalty Tiers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tiers">Tiers</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tier Distribution</CardTitle>
                <CardDescription>Members by loyalty tier</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tiers.map((tier) => {
                    const memberCount = customerLoyalty.filter(
                      (c) => c.current_tier_id === tier.id
                    ).length;
                    const percentage = activeMembers > 0 ? (memberCount / activeMembers) * 100 : 0;
                    return (
                      <div key={tier.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{tier.name}</span>
                          <span className="text-muted-foreground">{memberCount} members</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Members</CardTitle>
                <CardDescription>Highest lifetime points</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customerLoyalty.slice(0, 5).map((member, index) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium">{getProfileName(member.user_id)}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.loyalty_tiers?.name || "Bronze"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{member.lifetime_points.toLocaleString()} pts</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tiers Tab */}
        <TabsContent value="tiers">
          <Card>
            <CardHeader>
              <CardTitle>Loyalty Tiers</CardTitle>
              <CardDescription>Manage tier levels and benefits</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Min Points</TableHead>
                    <TableHead>Multiplier</TableHead>
                    <TableHead>Benefits</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell className="font-medium">{tier.name}</TableCell>
                      <TableCell>{tier.min_points.toLocaleString()}</TableCell>
                      <TableCell>{tier.multiplier}x</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {tier.benefits?.slice(0, 2).map((benefit, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {benefit}
                            </Badge>
                          ))}
                          {(tier.benefits?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{tier.benefits!.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog open={editingTier?.id === tier.id} onOpenChange={(open) => !open && setEditingTier(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTier(tier)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit {tier.name} Tier</DialogTitle>
                            </DialogHeader>
                            <TierEditForm
                              tier={editingTier!}
                              onSave={(data) => updateTier.mutate({ ...data, id: tier.id })}
                              isLoading={updateTier.isPending}
                            />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Loyalty Rewards</CardTitle>
                <CardDescription>Manage redeemable rewards</CardDescription>
              </div>
              <Dialog open={isAddingReward} onOpenChange={setIsAddingReward}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Reward
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Reward</DialogTitle>
                  </DialogHeader>
                  <RewardForm
                    tiers={tiers}
                    onSave={(data) => createReward.mutate(data)}
                    isLoading={createReward.isPending}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reward</TableHead>
                    <TableHead>Points Cost</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Min Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.map((reward) => (
                    <TableRow key={reward.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{reward.name}</p>
                          <p className="text-xs text-muted-foreground">{reward.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>{reward.points_cost.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{reward.reward_type.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>
                        {reward.reward_type.includes("percentage")
                          ? `${reward.reward_value}%`
                          : `$${reward.reward_value}`}
                      </TableCell>
                      <TableCell>
                        {tiers.find((t) => t.id === reward.min_tier_id)?.name || "All"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={reward.is_active ? "default" : "secondary"}>
                          {reward.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog open={editingReward?.id === reward.id} onOpenChange={(open) => !open && setEditingReward(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingReward(reward)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Reward</DialogTitle>
                              </DialogHeader>
                              <RewardForm
                                reward={editingReward!}
                                tiers={tiers}
                                onSave={(data) => updateReward.mutate({ ...data, id: reward.id })}
                                isLoading={updateReward.isPending}
                              />
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteReward.mutate(reward.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Loyalty Members</CardTitle>
              <CardDescription>All customers enrolled in the loyalty program</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Available Points</TableHead>
                    <TableHead>Lifetime Points</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerLoyalty.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {getProfileName(member.user_id)}
                      </TableCell>
                      <TableCell>
                        <Badge>{member.loyalty_tiers?.name || "Bronze"}</Badge>
                      </TableCell>
                      <TableCell>{member.available_points.toLocaleString()}</TableCell>
                      <TableCell>{member.lifetime_points.toLocaleString()}</TableCell>
                      <TableCell>
                        {format(new Date(member.created_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Points Activity</CardTitle>
              <CardDescription>Recent points transactions across all users</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">
                        {getProfileName(tx.user_id)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tx.type === "earned" || tx.type === "bonus"
                              ? "default"
                              : tx.type === "redeemed"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={
                          tx.points > 0 ? "text-success" : "text-destructive"
                        }
                      >
                        {tx.points > 0 ? "+" : ""}{tx.points}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {tx.description || "-"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(tx.created_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Tier Edit Form Component
const TierEditForm = ({
  tier,
  onSave,
  isLoading,
}: {
  tier: LoyaltyTier;
  onSave: (data: Partial<LoyaltyTier>) => void;
  isLoading: boolean;
}) => {
  const [name, setName] = useState(tier?.name || "");
  const [minPoints, setMinPoints] = useState(tier?.min_points || 0);
  const [multiplier, setMultiplier] = useState(tier?.multiplier || 1);
  const [benefits, setBenefits] = useState((tier?.benefits || []).join("\n"));

  if (!tier) return null;

  return (
    <div className="space-y-4">
      <div>
        <Label>Tier Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>Minimum Points</Label>
        <Input
          type="number"
          value={minPoints}
          onChange={(e) => setMinPoints(Number(e.target.value))}
        />
      </div>
      <div>
        <Label>Points Multiplier</Label>
        <Input
          type="number"
          step="0.1"
          value={multiplier}
          onChange={(e) => setMultiplier(Number(e.target.value))}
        />
      </div>
      <div>
        <Label>Benefits (one per line)</Label>
        <Textarea
          value={benefits}
          onChange={(e) => setBenefits(e.target.value)}
          rows={4}
        />
      </div>
      <Button
        onClick={() =>
          onSave({
            name,
            min_points: minPoints,
            multiplier,
            benefits: benefits.split("\n").filter(Boolean),
          })
        }
        disabled={isLoading}
        className="w-full"
      >
        Save Changes
      </Button>
    </div>
  );
};

// Reward Form Component
const RewardForm = ({
  reward,
  tiers,
  onSave,
  isLoading,
}: {
  reward?: LoyaltyReward;
  tiers: LoyaltyTier[];
  onSave: (data: Omit<LoyaltyReward, "id" | "created_at">) => void;
  isLoading: boolean;
}) => {
  const [name, setName] = useState(reward?.name || "");
  const [description, setDescription] = useState(reward?.description || "");
  const [pointsCost, setPointsCost] = useState(reward?.points_cost || 100);
  const [rewardType, setRewardType] = useState(reward?.reward_type || "discount_percentage");
  const [rewardValue, setRewardValue] = useState(reward?.reward_value || 10);
  const [minTierId, setMinTierId] = useState(reward?.min_tier_id || "");
  const [isActive, setIsActive] = useState(reward?.is_active ?? true);
  const [stock, setStock] = useState(reward?.stock || null);

  return (
    <div className="space-y-4">
      <div>
        <Label>Reward Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Points Cost</Label>
          <Input
            type="number"
            value={pointsCost}
            onChange={(e) => setPointsCost(Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Reward Value</Label>
          <Input
            type="number"
            value={rewardValue}
            onChange={(e) => setRewardValue(Number(e.target.value))}
          />
        </div>
      </div>
      <div>
        <Label>Reward Type</Label>
        <Select value={rewardType} onValueChange={setRewardType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="discount_percentage">Discount Percentage</SelectItem>
            <SelectItem value="discount_fixed">Fixed Discount</SelectItem>
            <SelectItem value="free_shipping">Free Shipping</SelectItem>
            <SelectItem value="free_product">Free Product</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Minimum Tier Required</Label>
        <Select value={minTierId} onValueChange={setMinTierId}>
          <SelectTrigger>
            <SelectValue placeholder="All tiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Tiers</SelectItem>
            {tiers.map((tier) => (
              <SelectItem key={tier.id} value={tier.id}>
                {tier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label>Active</Label>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>
      <Button
        onClick={() =>
          onSave({
            name,
            description,
            points_cost: pointsCost,
            reward_type: rewardType,
            reward_value: rewardValue,
            min_tier_id: minTierId || null,
            is_active: isActive,
            stock,
          })
        }
        disabled={isLoading || !name}
        className="w-full"
      >
        {reward ? "Save Changes" : "Create Reward"}
      </Button>
    </div>
  );
};

export default AdminLoyaltySection;
