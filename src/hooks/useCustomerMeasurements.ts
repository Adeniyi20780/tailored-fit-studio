import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Measurement = Tables<'customer_measurements'>;
export type MeasurementInsert = TablesInsert<'customer_measurements'>;

export function useCustomerMeasurements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['measurements', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('customer_measurements')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Measurement[];
    },
    enabled: !!user,
  });
}

export function useCreateMeasurement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (measurement: Omit<MeasurementInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('customer_measurements')
        .insert({ ...measurement, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements', user?.id] });
    },
  });
}
