import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { X, GitCompare, Star, Trash2 } from "lucide-react";
import { useProductComparison } from "@/hooks/useProductComparison";
import { Link } from "react-router-dom";

export const ComparisonDrawer = () => {
  const { products, comparisonCount, removeFromComparison, clearComparison, isLoading } = useProductComparison();

  if (comparisonCount === 0) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const allSpecs = [
    { key: "category", label: "Category" },
    { key: "sizes", label: "Sizes Available" },
    { key: "colors", label: "Colors" },
    { key: "fabrics", label: "Fabrics" },
    { key: "tailor", label: "Tailor" },
    { key: "rating", label: "Rating" },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 z-50 shadow-lg"
          size="lg"
        >
          <GitCompare className="h-5 w-5 mr-2" />
          Compare ({comparisonCount})
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Compare Products ({comparisonCount})</SheetTitle>
            <Button variant="ghost" size="sm" onClick={() => clearComparison()}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-full pb-8">
          <div className="min-w-max">
            {/* Product Images & Names Row */}
            <div className="flex border-b pb-4 mb-4">
              <div className="w-40 shrink-0" />
              {products.map((product) => (
                <div key={product.id} className="w-56 shrink-0 px-4 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 right-2 h-6 w-6"
                    onClick={() => removeFromComparison(product.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-3">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>
                  <Link to={`/product/${product.id}`} className="hover:underline">
                    <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                  </Link>
                  <p className="text-lg font-bold text-primary mt-1">
                    {formatPrice(product.base_price)}
                  </p>
                </div>
              ))}
            </div>

            {/* Specification Rows */}
            {allSpecs.map((spec) => (
              <div key={spec.key} className="flex border-b py-3">
                <div className="w-40 shrink-0 font-medium text-muted-foreground">
                  {spec.label}
                </div>
                {products.map((product) => {
                  let value: React.ReactNode;

                  switch (spec.key) {
                    case "category":
                      value = (
                        <Badge variant="secondary" className="capitalize">
                          {product.category}
                        </Badge>
                      );
                      break;
                    case "sizes":
                      value = product.sizes?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {product.sizes.map((size) => (
                            <Badge key={size} variant="outline" className="text-xs">
                              {size}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      );
                      break;
                    case "colors":
                      value = product.colors?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {product.colors.slice(0, 5).map((color) => (
                            <Badge key={color} variant="outline" className="text-xs">
                              {color}
                            </Badge>
                          ))}
                          {product.colors.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{product.colors.length - 5}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      );
                      break;
                    case "fabrics":
                      value = product.fabrics?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {product.fabrics.slice(0, 3).map((fabric) => (
                            <Badge key={fabric} variant="outline" className="text-xs">
                              {fabric}
                            </Badge>
                          ))}
                          {product.fabrics.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{product.fabrics.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      );
                      break;
                    case "tailor":
                      value = product.tailors?.store_name || (
                        <span className="text-muted-foreground">—</span>
                      );
                      break;
                    case "rating":
                      value = product.tailors?.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          <span>{product.tailors.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      );
                      break;
                    default:
                      value = <span className="text-muted-foreground">—</span>;
                  }

                  return (
                    <div key={product.id} className="w-56 shrink-0 px-4 text-sm">
                      {value}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Description Row */}
            <div className="flex border-b py-3">
              <div className="w-40 shrink-0 font-medium text-muted-foreground">
                Description
              </div>
              {products.map((product) => (
                <div key={product.id} className="w-56 shrink-0 px-4 text-sm">
                  <p className="line-clamp-3 text-muted-foreground">
                    {product.description || "No description available"}
                  </p>
                </div>
              ))}
            </div>

            {/* Action Buttons Row */}
            <div className="flex pt-4">
              <div className="w-40 shrink-0" />
              {products.map((product) => (
                <div key={product.id} className="w-56 shrink-0 px-4">
                  <Button asChild className="w-full">
                    <Link to={`/product/${product.id}`}>View Details</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
