import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { CustomizationOption } from '@/types/customization';
import { cn } from '@/lib/utils';

interface OptionSelectorProps {
  title: string;
  options: CustomizationOption[];
  selected: CustomizationOption | null;
  onSelect: (option: CustomizationOption) => void;
  columns?: 2 | 3 | 4;
}

export default function OptionSelector({
  title,
  options,
  selected,
  onSelect,
  columns = 3,
}: OptionSelectorProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
        {selected && (
          <span className="text-sm text-muted-foreground">{selected.label}</span>
        )}
      </div>
      
      <div className={cn('grid gap-3', gridCols[columns])}>
        {options.map((option) => {
          const isSelected = selected?.id === option.id;
          
          return (
            <motion.button
              key={option.id}
              onClick={() => onSelect(option)}
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
              
              <p className="font-medium text-sm text-foreground pr-6">{option.label}</p>
              {option.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {option.description}
                </p>
              )}
              
              {option.priceModifier && (
                <span className="text-xs text-accent font-medium mt-2 inline-block">
                  +${option.priceModifier}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
