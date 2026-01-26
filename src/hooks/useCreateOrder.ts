import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

interface CreateOrderData {
  productId?: string;
  tailorId?: string;
  measurementId?: string;
  customizations: Record<string, unknown>;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  totalAmount: number;
  currency?: string;
  notes?: string;
}

export function useCreateOrder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      if (!user) throw new Error('Not authenticated');

      // Generate a temporary order number (will be replaced by trigger)
      const tempOrderNumber = `TS-${Date.now()}`;

      const { data, error } = await supabase
        .from('orders')
        .insert([{
          order_number: tempOrderNumber,
          customer_id: user.id,
          product_id: orderData.productId || null,
          tailor_id: orderData.tailorId || null,
          measurement_id: orderData.measurementId || null,
          customizations: orderData.customizations as Json,
          shipping_address: orderData.shippingAddress as Json,
          total_amount: orderData.totalAmount,
          currency: orderData.currency || 'USD',
          notes: orderData.notes || null,
          status: 'pending',
        }])
        .select()
        .single();

      if (error) throw error;

      // Award loyalty points for the purchase
      try {
        await supabase.functions.invoke('award-loyalty-points', {
          body: {
            order_id: data.id,
            customer_id: user.id,
            amount: orderData.totalAmount,
          },
        });
      } catch (loyaltyError) {
        console.error('Failed to award loyalty points:', loyaltyError);
        // Don't throw - order was successful, loyalty points are a bonus
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['customer-loyalty'] });
      queryClient.invalidateQueries({ queryKey: ['points-transactions'] });
    },
  });
}
