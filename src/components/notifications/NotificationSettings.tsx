import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, BellRing } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export const NotificationSettings = () => {
  const { permission, isSubscribed, requestPermission, unsubscribe } = usePushNotifications();

  const isEnabled = permission === "granted" && isSubscribed;

  const handleToggle = async () => {
    if (isEnabled) {
      await unsubscribe();
    } else {
      await requestPermission();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {isEnabled ? (
            <BellRing className="h-5 w-5 text-primary" />
          ) : (
            <Bell className="h-5 w-5 text-muted-foreground" />
          )}
          <CardTitle>Push Notifications</CardTitle>
        </div>
        <CardDescription>
          Get real-time updates about your order status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {permission === "denied" ? (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg">
            <BellOff className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Notifications Blocked</p>
              <p className="text-sm text-muted-foreground">
                Please enable notifications in your browser settings
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Order Status Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications when your order status changes
              </p>
            </div>
            <Switch
              id="notifications"
              checked={isEnabled}
              onCheckedChange={handleToggle}
            />
          </div>
        )}

        {isEnabled && (
          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium">You'll be notified about:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-primary rounded-full" />
                Order confirmation
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-primary rounded-full" />
                Tailoring progress updates
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-primary rounded-full" />
                Shipping notifications
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-primary rounded-full" />
                Delivery confirmation
              </li>
            </ul>
          </div>
        )}

        {permission === "default" && (
          <Button onClick={requestPermission} className="w-full">
            <Bell className="h-4 w-4 mr-2" />
            Enable Notifications
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
