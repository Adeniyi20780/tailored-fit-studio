import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TailorSettings {
  id: string;
  store_name: string;
  store_slug: string;
  description: string | null;
  location: string | null;
  logo_url: string | null;
  banner_url: string | null;
  specialties: string[] | null;
  is_active: boolean | null;
}

export interface UpdateTailorSettingsData {
  store_name?: string;
  description?: string | null;
  location?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  specialties?: string[] | null;
}

export const useTailorSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch tailor settings
  const { data: tailor, isLoading } = useQuery({
    queryKey: ["tailor-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("tailors")
        .select("id, store_name, store_slug, description, location, logo_url, banner_url, specialties, is_active")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as TailorSettings | null;
    },
    enabled: !!user?.id,
  });

  // Update tailor settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: UpdateTailorSettingsData) => {
      if (!tailor?.id) throw new Error("No tailor found");
      const { error } = await supabase
        .from("tailors")
        .update(data)
        .eq("id", tailor.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tailor-settings"] });
      queryClient.invalidateQueries({ queryKey: ["tailor"] });
      toast.success("Store settings updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update settings");
      console.error("Update error:", error);
    },
  });

  // Upload image
  const uploadImage = async (file: File, type: "logo" | "banner"): Promise<string> => {
    if (!user?.id) throw new Error("Not authenticated");

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("store-assets")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("store-assets")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  return {
    tailor,
    isLoading,
    updateSettings: updateSettingsMutation.mutate,
    updateSettingsAsync: updateSettingsMutation.mutateAsync,
    isUpdating: updateSettingsMutation.isPending,
    uploadImage,
  };
};
