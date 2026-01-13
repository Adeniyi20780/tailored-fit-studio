import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Product {
  id: string;
  name: string;
  sales: number;
  revenue: number;
}

interface BestSellingProductsProps {
  products: Product[];
  isLoading: boolean;
}

const BestSellingProducts = ({ products, isLoading }: BestSellingProductsProps) => {
  const maxSales = products.length > 0 ? Math.max(...products.map((p) => p.sales)) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Best Selling Designs</CardTitle>
        <CardDescription>Your top performing products</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No sales data yet
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{product.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {product.sales} sales · ${product.revenue.toFixed(2)}
                  </span>
                </div>
                <Progress value={(product.sales / maxSales) * 100} className="h-2" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BestSellingProducts;
