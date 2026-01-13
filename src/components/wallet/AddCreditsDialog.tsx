import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/hooks/useWallet";
import { CreditCard, Loader2 } from "lucide-react";

const PRESET_AMOUNTS = [25, 50, 100, 250];

interface AddCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddCreditsDialog = ({ open, onOpenChange }: AddCreditsDialogProps) => {
  const { addCredits, isAddingCredits } = useWallet();
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState("");

  const handleAddCredits = () => {
    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    if (finalAmount > 0) {
      addCredits({ amount: finalAmount, description: "Added wallet credits" });
      onOpenChange(false);
      setCustomAmount("");
      setAmount(50);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Credits to Wallet
          </DialogTitle>
          <DialogDescription>
            Choose an amount to add to your wallet balance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            {PRESET_AMOUNTS.map((preset) => (
              <Button
                key={preset}
                variant={amount === preset && !customAmount ? "default" : "outline"}
                className="h-12"
                onClick={() => {
                  setAmount(preset);
                  setCustomAmount("");
                }}
              >
                ${preset}
              </Button>
            ))}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or enter custom amount</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-amount">Custom Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="custom-amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                className="pl-7"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span>Amount to add:</span>
              <span className="font-semibold">
                ${customAmount ? parseFloat(customAmount).toFixed(2) : amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddCredits} disabled={isAddingCredits}>
            {isAddingCredits && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Credits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
