import { UseFormReturn } from "react-hook-form";
import MultiSelectTags from "./MultiSelectTags";
import { ProductFormData } from "@/hooks/useCreateProduct";

interface ProductVariantsSectionProps {
  form: UseFormReturn<ProductFormData>;
}

const SIZE_SUGGESTIONS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Custom"];

const COLOR_SUGGESTIONS = [
  "Black",
  "White",
  "Navy Blue",
  "Charcoal",
  "Grey",
  "Brown",
  "Tan",
  "Burgundy",
  "Olive",
  "Cream",
  "Ivory",
  "Royal Blue",
];

const FABRIC_TYPE_SUGGESTIONS = [
  "Cotton",
  "Linen",
  "Wool",
  "Silk",
  "Polyester",
  "Velvet",
  "Cashmere",
  "Tweed",
  "Denim",
  "Satin",
  "Chiffon",
  "Ankara",
  "Aso-Oke",
  "Kente",
  "Lace",
  "Brocade",
];

const FABRIC_TEXTURE_SUGGESTIONS = [
  "Smooth",
  "Textured",
  "Matte",
  "Shiny",
  "Soft",
  "Crisp",
  "Lightweight",
  "Heavyweight",
  "Breathable",
  "Stretchy",
  "Structured",
  "Flowing",
];

const ProductVariantsSection = ({ form }: ProductVariantsSectionProps) => {
  const { watch, setValue } = form;

  return (
    <div className="space-y-6">
      {/* Sizes */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground border-b pb-2">
          Sizes
        </h3>
        <MultiSelectTags
          label="Available Sizes"
          values={watch("sizes") || []}
          onChange={(values) => setValue("sizes", values)}
          suggestions={SIZE_SUGGESTIONS}
          placeholder="Add size..."
        />
      </div>

      {/* Colors */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground border-b pb-2">
          Colors
        </h3>
        <MultiSelectTags
          label="Available Colors"
          values={watch("colors") || []}
          onChange={(values) => setValue("colors", values)}
          suggestions={COLOR_SUGGESTIONS}
          placeholder="Add color..."
        />
      </div>

      {/* Fabric Types */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground border-b pb-2">
          Fabric Types
        </h3>
        <MultiSelectTags
          label="Fabric Materials"
          values={watch("fabric_types") || []}
          onChange={(values) => setValue("fabric_types", values)}
          suggestions={FABRIC_TYPE_SUGGESTIONS}
          placeholder="Add fabric type..."
        />
      </div>

      {/* Fabric Textures */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground border-b pb-2">
          Fabric Textures
        </h3>
        <MultiSelectTags
          label="Texture Options"
          values={watch("fabric_textures") || []}
          onChange={(values) => setValue("fabric_textures", values)}
          suggestions={FABRIC_TEXTURE_SUGGESTIONS}
          placeholder="Add texture..."
        />
      </div>
    </div>
  );
};

export default ProductVariantsSection;
