import { useState } from "react";
import { Palette, Ruler, Shirt, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface VariantSelection {
  size: string | null;
  color: string | null;
  fabric: string | null;
}

interface ProductVariantSelectorProps {
  sizes: string[] | null;
  colors: string[] | null;
  fabrics: string[] | null;
  selection: VariantSelection;
  onChange: (selection: VariantSelection) => void;
}

const ProductVariantSelector = ({
  sizes,
  colors,
  fabrics,
  selection,
  onChange,
}: ProductVariantSelectorProps) => {
  const hasSizes = sizes && sizes.length > 0;
  const hasColors = colors && colors.length > 0;
  const hasFabrics = fabrics && fabrics.length > 0;

  if (!hasSizes && !hasColors && !hasFabrics) return null;

  return (
    <div className="space-y-5">
      {/* Sizes */}
      {hasSizes && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Size</span>
            {selection.size && (
              <span className="text-sm text-muted-foreground">— {selection.size}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() =>
                  onChange({
                    ...selection,
                    size: selection.size === size ? null : size,
                  })
                }
                className={cn(
                  "px-4 py-2 rounded-md border text-sm font-medium transition-all",
                  selection.size === size
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/50"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Colors */}
      {hasColors && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Color</span>
            {selection.color && (
              <span className="text-sm text-muted-foreground">— {selection.color}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() =>
                  onChange({
                    ...selection,
                    color: selection.color === color ? null : color,
                  })
                }
                className={cn(
                  "px-4 py-2 rounded-md border text-sm font-medium transition-all",
                  selection.color === color
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/50"
                )}
              >
                {selection.color === color && <Check className="w-3 h-3 inline mr-1" />}
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fabrics */}
      {hasFabrics && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shirt className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Fabric</span>
            {selection.fabric && (
              <span className="text-sm text-muted-foreground">— {selection.fabric}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {fabrics.map((fabric) => (
              <button
                key={fabric}
                onClick={() =>
                  onChange({
                    ...selection,
                    fabric: selection.fabric === fabric ? null : fabric,
                  })
                }
                className={cn(
                  "px-4 py-2 rounded-md border text-sm font-medium transition-all capitalize",
                  selection.fabric === fabric
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/50"
                )}
              >
                {fabric}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariantSelector;
export type { VariantSelection };
