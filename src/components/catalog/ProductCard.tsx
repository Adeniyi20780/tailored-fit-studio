import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Palette, Ruler, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  
  const handleCustomize = () => {
    const category = categoryMap[product.category] || 'shirts';
    navigate(`/customize?category=${category}&name=${encodeURIComponent(product.name)}&productId=${product.id}&basePrice=${product.base_price}`);
  };

  const imageUrl = product.images?.[0] || '/placeholder.svg';
  const hasColors = product.colors && product.colors.length > 0;
  const hasFabrics = product.fabrics && product.fabrics.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-card-hover transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
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
