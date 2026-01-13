import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import ProductImageUpload from "@/components/products/ProductImageUpload";
import ProductFormFields from "@/components/products/ProductFormFields";
import ProductVariantsSection from "@/components/products/ProductVariantsSection";
import { useCreateProduct, ProductFormData } from "@/hooks/useCreateProduct";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100),
  description: z.string().max(1000).optional().default(""),
  category: z.string().min(1, "Category is required"),
  base_price: z.number().min(0.01, "Price must be greater than 0"),
  currency: z.string().default("USD"),
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  fabric_types: z.array(z.string()).default([]),
  fabric_textures: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
});

const StoreProductsNew = () => {
  const {
    uploadedImages,
    isUploading,
    handleImageUpload,
    removeImage,
    createProduct,
    isCreating,
  } = useCreateProduct();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      base_price: 0,
      currency: "USD",
      sizes: [],
      colors: [],
      fabric_types: [],
      fabric_textures: [],
      is_active: true,
    },
  });

  const onSubmit = (data: ProductFormData) => {
    createProduct(data);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container max-w-5xl py-6">
          <div className="flex items-center gap-4">
            <Link to="/store">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-display font-bold text-foreground">
                Add New Product
              </h1>
              <p className="text-muted-foreground text-sm">
                Create a new product for your store
              </p>
            </div>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isCreating || isUploading}
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Product
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container max-w-5xl py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Images */}
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="pt-6">
                    <ProductImageUpload
                      images={uploadedImages}
                      isUploading={isUploading}
                      onUpload={handleImageUpload}
                      onRemove={removeImage}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Form Fields */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <ProductFormFields form={form} />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <ProductVariantsSection form={form} />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Mobile Save Button */}
            <div className="lg:hidden">
              <Button
                type="submit"
                className="w-full"
                disabled={isCreating || isUploading}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Product
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default StoreProductsNew;
