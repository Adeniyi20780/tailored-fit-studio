import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { ColorOption } from '@/types/customization';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ColorSelectorProps {
  colors: ColorOption[];
  selected: ColorOption | null;
  onSelect: (color: ColorOption) => void;
}

export default function ColorSelector({ colors, selected, onSelect }: ColorSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground">Color</h3>
        {selected && (
          <span className="text-sm text-muted-foreground">{selected.label}</span>
        )}
      </div>
      
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => {
          const isSelected = selected?.id === color.id;
          const isLight = isLightColor(color.hex);
          
          return (
            <Tooltip key={color.id}>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => onSelect(color)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'relative w-10 h-10 rounded-full transition-all duration-200',
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-accent ring-offset-background'
                      : 'hover:ring-2 hover:ring-offset-2 hover:ring-border hover:ring-offset-background'
                  )}
                  style={{ backgroundColor: color.hex }}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Check
                        className={cn(
                          'w-5 h-5',
                          isLight ? 'text-foreground' : 'text-white'
                        )}
                      />
                    </motion.div>
                  )}
                  
                  {/* Border for light colors */}
                  {isLight && (
                    <span className="absolute inset-0 rounded-full border border-border" />
                  )}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{color.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
}
