import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import ClothingCustomizer from '@/components/customization/ClothingCustomizer';
import { ProductCategory, CustomizationState } from '@/types/customization';

const categoryLabels: Record<ProductCategory, string> = {
  shirts: 'Custom Shirt',
  suits: 'Bespoke Suit',
  jeans: 'Tailored Jeans',
  kaftans: 'Luxury Kaftan',
  traditional: 'Traditional Attire',
};

const categoryBasePrices: Record<ProductCategory, number> = {
  shirts: 89,
  suits: 349,
  jeans: 129,
  kaftans: 199,
  traditional: 249,
};

export default function Customize() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const categoryParam = searchParams.get('category') as ProductCategory | null;
  const productName = searchParams.get('name') || (categoryParam ? categoryLabels[categoryParam] : 'Custom Garment');
  const category: ProductCategory = categoryParam || 'shirts';
  const basePrice = categoryBasePrices[category];

  const handleComplete = (customization: CustomizationState) => {
    console.log('Customization complete:', customization);
    toast.success('Customization saved! Proceeding to checkout...');
    
    // Store customization in session/state for order creation
    sessionStorage.setItem('pendingCustomization', JSON.stringify({
      customization,
      productName,
      category,
      basePrice,
    }));
    
    // Navigate to checkout or order page
    navigate('/dashboard');
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <ClothingCustomizer
      productName={productName}
      category={category}
      basePrice={basePrice}
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}
