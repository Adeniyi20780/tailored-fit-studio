import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { FabricOption } from '@/types/customization';
import { cn } from '@/lib/utils';

interface FabricSelectorProps {
  fabrics: FabricOption[];
  selected: FabricOption | null;
  onSelect: (fabric: FabricOption) => void;
}

const texturePatterns: Record<FabricOption['texture'], string> = {
  smooth: 'bg-gradient-to-br from-muted/50 to-muted',
  textured: 'bg-[repeating-linear-gradient(45deg,hsl(var(--muted))_0px,hsl(var(--muted))_2px,transparent_2px,transparent_4px)]',
  ribbed: 'bg-[repeating-linear-gradient(90deg,hsl(var(--muted))_0px,hsl(var(--muted))_1px,transparent_1px,transparent_3px)]',
  woven: 'bg-[repeating-conic-gradient(hsl(var(--muted))_0_90deg,transparent_0_180deg)_0_0/4px_4px]',
  brushed: 'bg-gradient-to-b from-muted via-muted/70 to-muted',
};

export default function FabricSelector({ fabrics, selected, onSelect }: FabricSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground">Fabric</h3>
        {selected && (
          <span className="text-sm text-muted-foreground">
            {selected.type} • {selected.texture}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {fabrics.map((fabric) => {
          const isSelected = selected?.id === fabric.id;
          
          return (
            <motion.button
              key={fabric.id}
              onClick={() => onSelect(fabric)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'relative p-4 rounded-lg border-2 transition-all duration-200 text-left',
                isSelected
                  ? 'border-accent bg-accent/5 shadow-gold'
                  : 'border-border hover:border-accent/50 bg-card'
              )}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-accent-foreground" />
                </motion.div>
              )}
              
              <div
                className={cn(
                  'w-full h-12 rounded-md mb-3',
                  texturePatterns[fabric.texture]
                )}
              />
              
              <p className="font-medium text-sm text-foreground">{fabric.label}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {fabric.description}
              </p>
              
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                  {fabric.weight}
                </span>
                {fabric.priceModifier && (
                  <span className="text-xs text-accent font-medium">
                    +${fabric.priceModifier}
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
