import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  base_price: number;
  currency: string;
  sizes: string[];
  colors: string[];
  fabric_types: string[];
  fabric_textures: string[];
  is_active: boolean;
  stock: number | null;
}

export const useCreateProduct = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Get tailor info for the current user
  const { data: tailor } = useQuery({
    queryKey: ["tailor", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("tailors")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${user?.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleImageUpload = async (files: FileList) => {
    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(uploadImage);
      const urls = await Promise.all(uploadPromises);
      setUploadedImages((prev) => [...prev, ...urls]);
      toast({
        title: "Images uploaded",
        description: `${files.length} image(s) uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (!tailor?.id) throw new Error("Tailor not found");

      // Combine fabric types and textures into fabrics array
      const fabrics = [
        ...data.fabric_types.map((t) => `type:${t}`),
        ...data.fabric_textures.map((t) => `texture:${t}`),
      ];

      const { error } = await supabase.from("products").insert({
        name: data.name,
        description: data.description,
        category: data.category,
        base_price: data.base_price,
        currency: data.currency,
        sizes: data.sizes,
        colors: data.colors,
        fabrics,
        images: uploadedImages,
        is_active: data.is_active,
        tailor_id: tailor.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Product created",
        description: "Your product has been created successfully",
      });
      navigate("/store");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  return {
    uploadedImages,
    isUploading,
    handleImageUpload,
    removeImage,
    createProduct: createProductMutation.mutate,
    isCreating: createProductMutation.isPending,
    tailor,
  };
};
