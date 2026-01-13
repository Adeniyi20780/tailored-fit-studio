import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MeasurementSelector from '@/components/checkout/MeasurementSelector';
import ShippingAddressForm, { ShippingAddress } from '@/components/checkout/ShippingAddressForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateOrder } from '@/hooks/useCreateOrder';
import { Measurement } from '@/hooks/useCustomerMeasurements';
import { CustomizationState, ProductCategory } from '@/types/customization';
import { toast } from 'sonner';

interface PendingCustomization {
  customization: CustomizationState;
  productName: string;
  category: ProductCategory;
  basePrice: number;
  productId?: string;
  tailorId?: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createOrder = useCreateOrder();
  
  const [pendingData, setPendingData] = useState<PendingCustomization | null>(null);
  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'NG',
  });
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('pendingCustomization');
    if (stored) {
      try {
        setPendingData(JSON.parse(stored));
      } catch {
        navigate('/catalog');
      }
    } else {
      navigate('/catalog');
    }
  }, [navigate]);

  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to complete your order');
      navigate('/auth?redirect=/checkout');
    }
  }, [user, navigate]);

  const calculateTotal = () => {
    if (!pendingData) return 0;
    let total = pendingData.basePrice;
    
    Object.values(pendingData.customization).forEach((option) => {
      if (option && 'priceModifier' in option && option.priceModifier) {
        total += option.priceModifier;
      }
    });
    
    return total;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingAddress, string>> = {};
    
    if (!shippingAddress.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!shippingAddress.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!shippingAddress.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!shippingAddress.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!shippingAddress.country) {
      newErrors.country = 'Country is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!pendingData || !user) return;
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const order = await createOrder.mutateAsync({
        productId: pendingData.productId,
        tailorId: pendingData.tailorId,
        measurementId: selectedMeasurement?.id,
        customizations: pendingData.customization as unknown as Record<string, unknown>,
        shippingAddress,
        totalAmount: calculateTotal(),
        currency: 'USD',
        notes: notes || undefined,
      });

      sessionStorage.removeItem('pendingCustomization');
      setOrderNumber(order.order_number);
      setOrderComplete(true);
      toast.success('Order placed successfully!');
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Failed to place order. Please try again.');
    }
  };

  if (!pendingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (orderComplete) {
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
              Order Confirmed!
            </h1>
            <p className="text-muted-foreground mb-2">
              Thank you for your order. Your custom garment is being prepared.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Order Number: <span className="font-mono font-medium text-foreground">{orderNumber}</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/dashboard')} className="bg-accent text-accent-foreground">
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20">
        <div className="container py-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main checkout form */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                  Checkout
                </h1>
                <p className="text-muted-foreground">
                  Complete your order for your custom {pendingData.productName}
                </p>
              </motion.div>

              {/* Measurements section */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl border border-border p-6"
              >
                <MeasurementSelector
                  selected={selectedMeasurement}
                  onSelect={setSelectedMeasurement}
                />
              </motion.section>

              {/* Shipping address section */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl border border-border p-6"
              >
                <ShippingAddressForm
                  address={shippingAddress}
                  onChange={setShippingAddress}
                  errors={errors}
                />
              </motion.section>

              {/* Notes section */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-xl border border-border p-6"
              >
                <Label htmlFor="notes" className="font-display text-lg font-semibold">
                  Order Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions for your order..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-3"
                  rows={3}
                />
              </motion.section>

              {/* Place order button - mobile */}
              <div className="lg:hidden">
                <Button
                  onClick={handlePlaceOrder}
                  disabled={createOrder.isPending}
                  className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                >
                  {createOrder.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Place Order - ${calculateTotal().toFixed(2)}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Order summary sidebar */}
            <div className="lg:sticky lg:top-24 lg:self-start space-y-4">
              <OrderSummary
                productName={pendingData.productName}
                customization={pendingData.customization}
                basePrice={pendingData.basePrice}
              />
              
              <Button
                onClick={handlePlaceOrder}
                disabled={createOrder.isPending}
                className="hidden lg:flex w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              >
                {createOrder.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Place Order
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By placing your order, you agree to our terms of service
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
