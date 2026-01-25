import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LoyaltyCard } from "@/components/loyalty/LoyaltyCard";
import { RewardsGrid } from "@/components/loyalty/RewardsGrid";
import { PointsHistory } from "@/components/loyalty/PointsHistory";
import { MyRewards } from "@/components/loyalty/MyRewards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLoyaltyProgram } from "@/hooks/useLoyaltyProgram";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Crown, Gift, History, Ticket, Star, Trophy, Sparkles } from "lucide-react";

const LoyaltyProgram = () => {
  const { user } = useAuth();
  const { tiers, isLoading } = useLoyaltyProgram();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <Crown className="h-16 w-16 mx-auto mb-6 text-primary" />
            <h1 className="text-3xl font-bold mb-4">Join Our Loyalty Program</h1>
            <p className="text-muted-foreground mb-8">
              Sign in to start earning points on every purchase and unlock exclusive rewards.
            </p>
            <Button asChild size="lg">
              <Link to="/auth">Sign In to Get Started</Link>
            </Button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  const tierIcons = [
    <Star key="bronze" className="h-8 w-8" />,
    <Sparkles key="silver" className="h-8 w-8" />,
    <Crown key="gold" className="h-8 w-8" />,
    <Trophy key="platinum" className="h-8 w-8" />,
  ];

  const tierColors = ["bg-amber-600", "bg-slate-400", "bg-yellow-500", "bg-purple-600"];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Loyalty Rewards</h1>
            <p className="text-muted-foreground">
              Earn points with every purchase and redeem for exclusive rewards
            </p>
          </div>

          {/* Loyalty Card */}
          <div className="max-w-xl mx-auto">
            <LoyaltyCard />
          </div>

          {/* Tiers Overview */}
          <div className="py-8">
            <h2 className="text-xl font-semibold text-center mb-6">Membership Tiers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tiers.map((tier, index) => (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center p-4 rounded-lg border bg-card"
                >
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white ${tierColors[index]}`}>
                    {tierIcons[index]}
                  </div>
                  <h3 className="font-semibold mt-3">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {tier.min_points.toLocaleString()} pts
                  </p>
                  <p className="text-xs text-primary font-medium mt-1">
                    {tier.multiplier}x points
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Tabs for Rewards, History, My Rewards */}
          <Tabs defaultValue="rewards" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="rewards" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                <span className="hidden sm:inline">Rewards</span>
              </TabsTrigger>
              <TabsTrigger value="my-rewards" className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                <span className="hidden sm:inline">My Rewards</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rewards" className="mt-6">
              <RewardsGrid />
            </TabsContent>

            <TabsContent value="my-rewards" className="mt-6">
              <div className="max-w-2xl mx-auto">
                <MyRewards />
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <div className="max-w-2xl mx-auto">
                <PointsHistory />
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default LoyaltyProgram;
