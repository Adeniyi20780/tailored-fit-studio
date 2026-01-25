import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Palette, Ruler, Sparkles, Heart, GitCompare, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useProductComparison } from '@/hooks/useProductComparison';
import type { Product } from '@/hooks/useProducts';
import type { ProductCategory } from '@/types/customization';

interface ProductCardProps {
  product: Product;
  index: number;
}

const categoryMap: Record<string, ProductCategory> = {
  shirts: 'shirts',
  suits: 'suits',
  jeans: 'jeans',
  kaftans: 'kaftans',
  traditional: 'traditional',
  Shirts: 'shirts',
  Suits: 'suits',
  Jeans: 'jeans',
  Kaftans: 'kaftans',
  Traditional: 'traditional',
};

export default function ProductCard({ product, index }: ProductCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isInWishlist, toggleWishlist, isToggling } = useWishlist();
  const { addToComparison, removeFromComparison, isInComparison, canAddMore } = useProductComparison();
  
  const inComparison = isInComparison(product.id);
  
  const handleViewProduct = () => {
    navigate(`/product/${product.id}`);
  };

  const handleCustomize = (e: React.MouseEvent) => {
    e.stopPropagation();
    const category = categoryMap[product.category] || 'shirts';
    navigate(`/customize?category=${category}&name=${encodeURIComponent(product.name)}&productId=${product.id}&basePrice=${product.base_price}`);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to your wishlist",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    toggleWishlist(product.id);
  };

  const imageUrl = product.images?.[0] || '/placeholder.svg';
  const hasColors = product.colors && product.colors.length > 0;
  const hasFabrics = product.fabrics && product.fabrics.length > 0;
  const isWishlisted = isInWishlist(product.id);

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inComparison) {
      removeFromComparison(product.id);
    } else {
      addToComparison(product.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-card-hover transition-all duration-300 cursor-pointer"
      onClick={handleViewProduct}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Wishlist & Compare buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button
            onClick={handleWishlistClick}
            disabled={isToggling}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              isWishlisted 
                ? 'bg-destructive text-destructive-foreground' 
                : 'bg-background/90 text-muted-foreground hover:text-destructive hover:bg-background'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleCompareClick}
            disabled={!inComparison && !canAddMore}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              inComparison 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-background/90 text-muted-foreground hover:text-primary hover:bg-background'
            } ${!inComparison && !canAddMore ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={inComparison ? "Remove from comparison" : "Add to comparison"}
          >
            {inComparison ? <Check className="w-4 h-4" /> : <GitCompare className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick customize button on hover */}
        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <Button
            onClick={handleCustomize}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Customize Now
          </Button>
        </div>

        {/* Category badge */}
        <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground">
          {product.category}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground line-clamp-1">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        {/* Options indicators */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {hasColors && (
            <div className="flex items-center gap-1">
              <Palette className="w-3.5 h-3.5" />
              <span>{product.colors?.length} colors</span>
            </div>
          )}
          {hasFabrics && (
            <div className="flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5" />
              <span>{product.fabrics?.length} fabrics</span>
            </div>
          )}
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Starting from</p>
            <p className="font-display text-xl font-bold text-foreground">
              {product.currency || '$'}{product.base_price.toFixed(2)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCustomize}
            className="gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Customize
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
