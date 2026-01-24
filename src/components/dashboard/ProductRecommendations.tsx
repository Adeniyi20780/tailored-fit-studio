import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RecommendedProduct } from "@/hooks/useCustomerAnalytics";
import { Link } from "react-router-dom";
import { Sparkles, ExternalLink } from "lucide-react";

interface ProductRecommendationsProps {
  products: RecommendedProduct[];
  favoriteCategories: string[];
  isLoading: boolean;
}

const ProductRecommendations = ({ products, favoriteCategories, isLoading }: ProductRecommendationsProps) => {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Recommended for You
            </CardTitle>
            <CardDescription>
              {favoriteCategories.length > 0
                ? `Based on your interest in ${favoriteCategories.join(", ")}`
                : "Popular products you might like"}
            </CardDescription>
          </div>
          <Link to="/catalog">
            <Button variant="outline" size="sm">
              Browse All
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted h-32 rounded-lg mb-2"></div>
                <div className="bg-muted h-4 rounded w-3/4 mb-1"></div>
                <div className="bg-muted h-4 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground mb-4">
              We'll show personalized recommendations based on your purchases
            </p>
            <Link to="/catalog">
              <Button>Explore Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Link key={product.id} to={`/product/${product.id}`}>
                <div className="group border rounded-lg p-4 hover:border-accent/50 transition-colors cursor-pointer">
                  <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="mb-2">
                    {product.category}
                  </Badge>
                  <h4 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {product.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">{product.tailor_name}</p>
                  <p className="text-lg font-semibold text-primary mt-1">
                    ${product.base_price.toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductRecommendations;
