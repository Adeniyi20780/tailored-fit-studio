import { Palette, Ruler, Shirt, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Product } from "@/hooks/useProducts";

interface ProductSpecificationsProps {
  product: Product;
}

const ProductSpecifications = ({ product }: ProductSpecificationsProps) => {
  const specifications = [
    {
      label: "Category",
      value: product.category,
      icon: Tag,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Basic Specifications */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Specifications</h3>
        <div className="grid grid-cols-2 gap-4">
          {specifications.map((spec) => (
            <div key={spec.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <spec.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{spec.label}</p>
                <p className="font-medium capitalize">{spec.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Available Colors */}
      {product.colors && product.colors.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Available Colors</h3>
            <span className="text-sm text-muted-foreground">({product.colors.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((color) => (
              <Badge key={color} variant="secondary" className="capitalize">
                {color}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Available Fabrics */}
      {product.fabrics && product.fabrics.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Shirt className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Available Fabrics</h3>
            <span className="text-sm text-muted-foreground">({product.fabrics.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.fabrics.map((fabric) => (
              <Badge key={fabric} variant="outline" className="capitalize">
                {fabric}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Available Sizes */}
      {product.sizes && product.sizes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Ruler className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Available Sizes</h3>
            <span className="text-sm text-muted-foreground">({product.sizes.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <Badge key={size} variant="outline" className="uppercase">
                {size}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSpecifications;
