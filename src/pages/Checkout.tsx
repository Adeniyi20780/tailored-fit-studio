import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Loader2, CheckCircle, ShoppingCart, CreditCard, Wallet, Share2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MeasurementSelector from '@/components/checkout/MeasurementSelector';
import ShippingAddressForm, { ShippingAddress } from '@/components/checkout/ShippingAddressForm';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { useCreateOrder } from '@/hooks/useCreateOrder';
import { useWallet } from '@/hooks/useWallet';
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
  const { wallet, useWalletForPurchase, isProcessingPurchase } = useWallet();
  
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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');
  const [shareMeasurements, setShareMeasurements] = useState(true);

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

    const totalAmount = calculateTotal();
    
    // Check wallet balance if paying with wallet
    if (paymentMethod === 'wallet') {
      if (!wallet || wallet.balance < totalAmount) {
        toast.error('Insufficient wallet balance');
        return;
      }
    }

    setIsPlacingOrder(true);

    try {
      let items: Array<{ name: string; quantity: number; amount: number }> = [];
      let orderId: string | undefined;
      let orderNum: string | undefined;
      let currency: string = 'USD';
      const createdOrderNumbers: string[] = [];

      if (checkoutMode === 'single' && pendingData) {
        // Single product checkout (from customization)
        const order = await createOrder.mutateAsync({
          productId: pendingData.productId,
          tailorId: pendingData.tailorId,
          measurementId: selectedMeasurement?.id,
          customizations: pendingData.customization as unknown as Record<string, unknown>,
          shippingAddress,
          totalAmount,
          currency: 'USD',
          notes: notes || undefined,
        });

        orderId = order.id;
        orderNum = order.order_number;
        createdOrderNumbers.push(order.order_number);
        items = [{
          name: pendingData.productName,
          quantity: 1,
          amount: totalAmount,
        }];
      } else {
        // Cart-based checkout - create first order for payment reference
        const firstItem = cartItemsWithProducts[0];
        const firstOrder = await createOrder.mutateAsync({
          productId: firstItem.product_id,
          tailorId: firstItem.product.tailor_id || undefined,
          measurementId: selectedMeasurement?.id,
          customizations: firstItem.customizations || {},
          shippingAddress,
          totalAmount: firstItem.product.base_price * firstItem.quantity,
          currency: firstItem.product.currency || 'USD',
          notes: notes || undefined,
        });

        orderId = firstOrder.id;
        orderNum = firstOrder.order_number;
        currency = firstItem.product.currency || 'USD';
        createdOrderNumbers.push(firstOrder.order_number);

        // Create remaining orders
        if (cartItemsWithProducts.length > 1) {
          const remainingPromises = cartItemsWithProducts.slice(1).map(item => 
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
          const remainingOrders = await Promise.all(remainingPromises);
          remainingOrders.forEach(o => createdOrderNumbers.push(o.order_number));
        }

        items = cartItemsWithProducts.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          amount: item.product.base_price * item.quantity,
        }));

        clearCart();
      }

      if (paymentMethod === 'wallet') {
        // Pay with wallet balance
        await useWalletForPurchase({
          amount: totalAmount,
          orderId,
          description: `Order ${orderNum}`,
        });

        // Update order status to confirmed
        await supabase
          .from('orders')
          .update({ status: 'confirmed' })
          .eq('id', orderId);

        // Send order notification
        await supabase.functions.invoke('send-order-notification', {
          body: { orderId, orderNumber: orderNum },
        });

        // Clear pending customization
        sessionStorage.removeItem('pendingCustomization');
        
        setOrderNumbers(createdOrderNumbers);
        setOrderComplete(true);
        toast.success('Order placed successfully with wallet credits!');
      } else {
        // Pay with card via Stripe
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
          body: {
            amount: totalAmount,
            currency,
            orderId,
            orderNumber: orderNum,
            items,
          },
        });

        if (paymentError || !paymentData?.url) {
          throw new Error(paymentError?.message || 'Failed to create payment session');
        }

        // Redirect to Stripe Checkout
        window.location.href = paymentData.url;
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Failed to process order. Please try again.');
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
        {cartItemsWithProducts.map(item => {
          const customizations = item.customizations as Record<string, any> | null;
          const isStraight = customizations?.type === 'straight';
          return (
            <div key={item.id} className="flex gap-4 p-3 rounded-lg bg-muted/30">
              <img
                src={item.product.images?.[0] || '/placeholder.svg'}
                alt={item.product.name}
                className="w-16 h-16 object-cover rounded-md"
              />
              <div className="flex-1">
                <h4 className="font-medium">{item.product.name}</h4>
                {isStraight && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {customizations?.size && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">Size: {customizations.size}</span>
                    )}
                    {customizations?.color && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">Color: {customizations.color}</span>
                    )}
                    {customizations?.fabric && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">Fabric: {customizations.fabric}</span>
                    )}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                <p className="font-semibold mt-1">
                  {item.product.currency || '$'}{(item.product.base_price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          );
        })}
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

              {/* Payment method section */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-card rounded-xl border border-border p-6"
              >
                <Label className="font-display text-lg font-semibold">Payment Method</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as 'card' | 'wallet')}
                  className="mt-4 space-y-3"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:border-primary/50 cursor-pointer">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="h-4 w-4" />
                      Pay with Card
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:border-primary/50 cursor-pointer">
                    <RadioGroupItem value="wallet" id="wallet" disabled={!wallet || wallet.balance < calculateTotal()} />
                    <Label htmlFor="wallet" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Wallet className="h-4 w-4" />
                      <span>Pay with Wallet</span>
                      <span className="ml-auto text-sm text-muted-foreground">
                        Balance: ${wallet?.balance?.toFixed(2) || '0.00'}
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
                {wallet && wallet.balance < calculateTotal() && paymentMethod === 'card' && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Add more credits to your wallet to pay with wallet balance
                  </p>
                )}
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
                  disabled={isPlacingOrder || isProcessingPurchase}
                  className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                >
                  {isPlacingOrder || isProcessingPurchase ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : paymentMethod === 'wallet' ? (
                    <>
                      <Wallet className="w-4 h-4" />
                      Pay ${calculateTotal().toFixed(2)} with Wallet
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Pay ${calculateTotal().toFixed(2)}
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
                disabled={isPlacingOrder || isProcessingPurchase}
                className="hidden lg:flex w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              >
                {isPlacingOrder || isProcessingPurchase ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : paymentMethod === 'wallet' ? (
                  <>
                    <Wallet className="w-4 h-4" />
                    Pay with Wallet
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pay with Card
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4" />
                <span>Secure payment powered by Stripe</span>
              </div>

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
