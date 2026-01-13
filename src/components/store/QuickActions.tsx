import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Settings, Plus, FileText, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: "Add New Product",
      icon: Plus,
      onClick: () => navigate("/store/products/new"),
      variant: "default" as const,
    },
    {
      label: "View Orders",
      icon: ShoppingCart,
      onClick: () => navigate("/store/orders"),
      variant: "outline" as const,
    },
    {
      label: "Manage Products",
      icon: Package,
      onClick: () => navigate("/store/products"),
      variant: "outline" as const,
    },
    {
      label: "Sales Report",
      icon: FileText,
      onClick: () => navigate("/store/reports"),
      variant: "outline" as const,
    },
    {
      label: "Customers",
      icon: Users,
      onClick: () => navigate("/store/customers"),
      variant: "outline" as const,
    },
    {
      label: "Store Settings",
      icon: Settings,
      onClick: () => navigate("/store/settings"),
      variant: "outline" as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Manage your store</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              className="flex items-center gap-2 h-auto py-3"
              onClick={action.onClick}
            >
              <action.icon className="h-4 w-4" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
