import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Loader2, CheckCircle, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MeasurementSelector from '@/components/checkout/MeasurementSelector';
import ShippingAddressForm, { ShippingAddress } from '@/components/checkout/ShippingAddressForm';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { useCreateOrder } from '@/hooks/useCreateOrder';
import { Measurement } from '@/hooks/useCustomerMeasurements';
import { CustomizationState, ProductCategory } from '@/types/customization';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PendingCustomization {
  customization: CustomizationState;
  productName: string;
  category: ProductCategory;
  basePrice: number;
  productId?: string;
  tailorId?: string;
}

interface CartItemWithProduct {
  id: string;
  product_id: string;
  quantity: number;
  customizations: Record<string, any> | null;
  product: {
    id: string;
    name: string;
    base_price: number;
    images: string[] | null;
    currency: string | null;
    tailor_id: string | null;
  };
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createOrder = useCreateOrder();
  const { cartItems, clearCart } = useCart();
  
  const [pendingData, setPendingData] = useState<PendingCustomization | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<'cart' | 'single' | null>(null);
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
  const [orderNumbers, setOrderNumbers] = useState<string[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Fetch product details for cart items
  const { data: cartProducts = [] } = useQuery({
    queryKey: ["checkout-cart-products", cartItems.map(c => c.product_id)],
    queryFn: async () => {
      if (cartItems.length === 0) return [];
      
      const productIds = cartItems.map(c => c.product_id);
      const { data, error } = await supabase
        .from("products")
        .select("id, name, base_price, images, currency, tailor_id")
        .in("id", productIds);

      if (error) throw error;
      return data;
    },
    enabled: cartItems.length > 0,
  });

  const cartItemsWithProducts: CartItemWithProduct[] = cartItems.map(item => ({
    ...item,
    product: cartProducts.find(p => p.id === item.product_id) || {
      id: item.product_id,
      name: 'Loading...',
      base_price: 0,
      images: null,
      currency: null,
      tailor_id: null,
    }
  })).filter(item => item.product.name !== 'Loading...');

  useEffect(() => {
    const stored = sessionStorage.getItem('pendingCustomization');
    if (stored) {
      try {
        setPendingData(JSON.parse(stored));
        setCheckoutMode('single');
      } catch {
        // Fall back to cart mode
        setCheckoutMode('cart');
      }
    } else {
      setCheckoutMode('cart');
    }
  }, []);

  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to complete your order');
      navigate('/auth?redirect=/checkout');
    }
  }, [user, navigate]);

  // Redirect if cart is empty and no pending customization
  useEffect(() => {
    if (checkoutMode === 'cart' && cartItems.length === 0 && !pendingData) {
      navigate('/catalog');
    }
  }, [checkoutMode, cartItems.length, pendingData, navigate]);

  const calculateSingleTotal = () => {
    if (!pendingData) return 0;
    let total = pendingData.basePrice;
    
    Object.values(pendingData.customization).forEach((option) => {
      if (option && 'priceModifier' in option && option.priceModifier) {
        total += option.priceModifier;
      }
    });
    
    return total;
  };

  const calculateCartTotal = () => {
    return cartItemsWithProducts.reduce((sum, item) => {
      return sum + item.product.base_price * item.quantity;
    }, 0);
  };

  const calculateTotal = () => {
    if (checkoutMode === 'single' && pendingData) {
      return calculateSingleTotal();
    }
    return calculateCartTotal();
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
    if (!user) return;
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsPlacingOrder(true);

    try {
      if (checkoutMode === 'single' && pendingData) {
        // Single product checkout (from customization)
        const order = await createOrder.mutateAsync({
          productId: pendingData.productId,
          tailorId: pendingData.tailorId,
          measurementId: selectedMeasurement?.id,
          customizations: pendingData.customization as unknown as Record<string, unknown>,
          shippingAddress,
          totalAmount: calculateSingleTotal(),
          currency: 'USD',
          notes: notes || undefined,
        });

        sessionStorage.removeItem('pendingCustomization');
        setOrderNumbers([order.order_number]);
        setOrderComplete(true);
        toast.success('Order placed successfully!');
      } else {
        // Cart-based checkout
        const orderPromises = cartItemsWithProducts.map(item => 
          createOrder.mutateAsync({
            productId: item.product_id,
            tailorId: item.product.tailor_id || undefined,
            measurementId: selectedMeasurement?.id,
            customizations: item.customizations || {},
            shippingAddress,
            totalAmount: item.product.base_price * item.quantity,
            currency: item.product.currency || 'USD',
            notes: notes || undefined,
          })
        );

        const orders = await Promise.all(orderPromises);
        clearCart();
        setOrderNumbers(orders.map(o => o.order_number));
        setOrderComplete(true);
        toast.success(`${orders.length} order(s) placed successfully!`);
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (checkoutMode === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (checkoutMode === 'cart' && cartItems.length === 0) {
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
              Order{orderNumbers.length > 1 ? 's' : ''} Confirmed!
            </h1>
            <p className="text-muted-foreground mb-2">
              Thank you for your order{orderNumbers.length > 1 ? 's' : ''}. Your custom garment{orderNumbers.length > 1 ? 's are' : ' is'} being prepared.
            </p>
            <div className="text-sm text-muted-foreground mb-6 space-y-1">
              {orderNumbers.map((num, idx) => (
                <p key={idx}>
                  Order Number: <span className="font-mono font-medium text-foreground">{num}</span>
                </p>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/my-orders')} className="bg-accent text-accent-foreground">
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

  const renderOrderItems = () => {
    if (checkoutMode === 'single' && pendingData) {
      return (
        <div className="space-y-3">
          <div className="flex gap-4 p-3 rounded-lg bg-muted/30">
            <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-medium">{pendingData.productName}</h4>
              <p className="text-sm text-muted-foreground capitalize">{pendingData.category}</p>
              <p className="font-semibold mt-1">${pendingData.basePrice.toFixed(2)}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {cartItemsWithProducts.map(item => (
          <div key={item.id} className="flex gap-4 p-3 rounded-lg bg-muted/30">
            <img
              src={item.product.images?.[0] || '/placeholder.svg'}
              alt={item.product.name}
              className="w-16 h-16 object-cover rounded-md"
            />
            <div className="flex-1">
              <h4 className="font-medium">{item.product.name}</h4>
              <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
              <p className="font-semibold mt-1">
                {item.product.currency || '$'}{(item.product.base_price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

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
                  {checkoutMode === 'single' && pendingData
                    ? `Complete your order for your custom ${pendingData.productName}`
                    : `Complete your order for ${cartItemsWithProducts.length} item${cartItemsWithProducts.length !== 1 ? 's' : ''}`
                  }
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
                  disabled={isPlacingOrder}
                  className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                >
                  {isPlacingOrder ? (
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border p-6"
              >
                <h3 className="font-display text-xl font-semibold text-foreground mb-4">
                  Order Summary
                </h3>
                
                {renderOrderItems()}

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">${calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-foreground">Calculated at delivery</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center">
                  <span className="font-display text-lg font-semibold text-foreground">Total</span>
                  <span className="font-display text-2xl font-bold text-gradient-gold">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
              </motion.div>
              
              <Button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="hidden lg:flex w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              >
                {isPlacingOrder ? (
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
