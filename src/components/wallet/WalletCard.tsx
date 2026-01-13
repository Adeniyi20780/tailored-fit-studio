import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw, ShoppingBag } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { AddCreditsDialog } from "./AddCreditsDialog";
import { format } from "date-fns";

export const WalletCard = () => {
  const { wallet, transactions, isLoading } = useWallet();
  const [showAddCredits, setShowAddCredits] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-24" />
        </CardContent>
      </Card>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "credit":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case "debit":
      case "purchase":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case "refund":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return <ShoppingBag className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <CardTitle>My Wallet</CardTitle>
            </div>
            <Button size="sm" onClick={() => setShowAddCredits(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Credits
            </Button>
          </div>
          <CardDescription>Use your wallet balance for purchases</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
            <p className="text-3xl font-bold text-primary">
              ${wallet?.balance?.toFixed(2) || "0.00"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{wallet?.currency || "USD"}</p>
          </div>

          <div>
            <h4 className="font-medium mb-3">Recent Transactions</h4>
            {transactions && transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(tx.type)}
                      <div>
                        <p className="text-sm font-medium capitalize">{tx.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.description || "Transaction"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${
                          tx.amount > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No transactions yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <AddCreditsDialog open={showAddCredits} onOpenChange={setShowAddCredits} />
    </>
  );
};
