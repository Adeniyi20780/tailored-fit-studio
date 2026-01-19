import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AlterationTicket {
  id: string;
  order_id: string;
  customer_id: string;
  tailor_id: string;
  issue_type: string;
  description: string;
  images: string[] | null;
  status: string;
  resolution: string | null;
  created_at: string;
  updated_at: string;
  order?: {
    order_number: string;
    product?: {
      name: string;
    };
  };
}

export const useCustomerAlterationTickets = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["alteration-tickets", "customer", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alteration_tickets")
        .select(`
          *,
          order:orders(order_number, product:products(name))
        `)
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AlterationTicket[];
    },
    enabled: !!user,
  });

  const createTicket = useMutation({
    mutationFn: async (ticket: {
      order_id: string;
      tailor_id: string;
      issue_type: string;
      description: string;
      images?: string[];
    }) => {
      const { data, error } = await supabase
        .from("alteration_tickets")
        .insert({
          ...ticket,
          customer_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alteration-tickets"] });
      toast.success("Alteration request submitted successfully");
    },
    onError: (error) => {
      toast.error("Failed to submit request: " + error.message);
    },
  });

  return {
    tickets,
    isLoading,
    createTicket,
    isCreating: createTicket.isPending,
  };
};

export const useTailorAlterationTickets = (tailorId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["alteration-tickets", "tailor", tailorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alteration_tickets")
        .select(`
          *,
          order:orders(order_number, product:products(name))
        `)
        .eq("tailor_id", tailorId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AlterationTicket[];
    },
    enabled: !!tailorId,
  });

  const updateTicket = useMutation({
    mutationFn: async ({
      ticketId,
      status,
      resolution,
    }: {
      ticketId: string;
      status: string;
      resolution?: string;
    }) => {
      const { data, error } = await supabase
        .from("alteration_tickets")
        .update({ status, resolution })
        .eq("id", ticketId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alteration-tickets"] });
      toast.success("Ticket updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update ticket: " + error.message);
    },
  });

  return {
    tickets,
    isLoading,
    updateTicket,
    isUpdating: updateTicket.isPending,
  };
};
