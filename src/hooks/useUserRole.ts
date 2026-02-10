import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "admin" | "tailor" | "customer";

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [adminLevel, setAdminLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) {
        setRoles([]);
        setAdminLevel(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role, admin_level")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching roles:", error);
        setRoles([]);
        setAdminLevel(null);
      } else {
        setRoles(data?.map((r) => r.role as AppRole) || []);
        const adminRole = data?.find((r) => r.role === "admin");
        setAdminLevel(adminRole?.admin_level ?? null);
      }
      setLoading(false);
    };

    fetchRoles();
  }, [user]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isTailor = () => hasRole("tailor");
  const isAdmin = () => hasRole("admin");
  const isCustomer = () => hasRole("customer");

  return { roles, loading, hasRole, isTailor, isAdmin, isCustomer, adminLevel };
};
