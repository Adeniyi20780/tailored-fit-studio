import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useTailorVerification = () => {
  const { user } = useAuth();

  const { data: tailorStatus, isLoading } = useQuery({
    queryKey: ["tailor-verification-status", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("tailors")
        .select("id, is_verified, is_active, store_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching tailor status:", error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  return {
    tailorStatus,
    isLoading,
    isVerified: tailorStatus?.is_verified ?? false,
    isPending: tailorStatus && !tailorStatus.is_verified,
    hasTailorProfile: !!tailorStatus,
  };
};
