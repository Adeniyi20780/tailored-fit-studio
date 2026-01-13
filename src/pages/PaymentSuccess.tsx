import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  const orderNum = searchParams.get('order_number');

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        if (orderNum) {
          setOrderNumber(orderNum);
        }

        // Send order confirmation email
        if (orderId && user) {
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
              *,
              products (name, base_price, currency)
            `)
            .eq('id', orderId)
            .single();

          if (!orderError && order) {
            const shippingAddr = order.shipping_address as {
              fullName: string;
              address: string;
              city: string;
              state: string;
              postalCode: string;
              country: string;
            };

            await supabase.functions.invoke('send-order-notification', {
              body: {
                orderId: order.id,
                orderNumber: order.order_number,
                customerEmail: user.email,
                customerName: shippingAddr?.fullName || 'Valued Customer',
                items: [{
                  name: order.products?.name || 'Custom Product',
                  quantity: 1,
                  price: order.total_amount,
                  customizations: order.customizations,
                }],
                totalAmount: order.total_amount,
                currency: order.currency || 'USD',
                shippingAddress: shippingAddr,
                estimatedDelivery: order.estimated_delivery,
              },
            });
          }
        }

        // Clear any remaining cart data
        sessionStorage.removeItem('pendingCustomization');
        
        toast.success('Payment completed successfully!');
      } catch (error) {
        console.error('Error processing payment success:', error);
      } finally {
        setIsLoading(false);
      }
    };

    handlePaymentSuccess();
  }, [orderId, orderNum, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />
            <p className="text-muted-foreground">Processing your payment...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">
            Payment Successful!
          </h1>
          
          <p className="text-muted-foreground mb-2">
            Thank you for your order. Your custom garment is being prepared by our expert tailors.
          </p>
          
          {orderNumber && (
            <div className="mb-6 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="font-mono font-bold text-lg text-foreground">{orderNumber}</p>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 text-left">
              <Package className="w-8 h-8 text-accent" />
              <div>
                <p className="font-medium text-foreground">What's Next?</p>
                <p className="text-sm text-muted-foreground">
                  You'll receive a confirmation email with tracking details shortly.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => navigate('/my-orders')} 
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              View My Orders
            </Button>
            <Button variant="outline" onClick={() => navigate('/catalog')}>
              Continue Shopping
            </Button>
          </div>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
}
