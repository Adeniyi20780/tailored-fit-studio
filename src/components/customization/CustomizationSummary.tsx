import { motion } from 'framer-motion';
import { CustomizationState, ColorOption, FabricOption, CustomizationOption } from '@/types/customization';
import { Separator } from '@/components/ui/separator';

interface CustomizationSummaryProps {
  customization: CustomizationState;
  basePrice: number;
}

export default function CustomizationSummary({
  customization,
  basePrice,
}: CustomizationSummaryProps) {
  const calculateTotal = () => {
    let total = basePrice;
    
    Object.values(customization).forEach((option) => {
      if (option && 'priceModifier' in option && option.priceModifier) {
        total += option.priceModifier;
      }
    });
    
    return total;
  };

  const getModifiers = () => {
    const modifiers: { label: string; price: number }[] = [];
    
    const entries = Object.entries(customization) as [
      keyof CustomizationState,
      FabricOption | ColorOption | CustomizationOption | null
    ][];
    
    entries.forEach(([key, option]) => {
      if (option && 'priceModifier' in option && option.priceModifier) {
        modifiers.push({
          label: option.label,
          price: option.priceModifier,
        });
      }
    });
    
    return modifiers;
  };

  const modifiers = getModifiers();
  const total = calculateTotal();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-6 sticky top-4"
    >
      <h3 className="font-display text-xl font-semibold text-foreground mb-4">
        Your Selection
      </h3>
      
      <div className="space-y-3">
        {customization.fabric && (
          <SummaryRow label="Fabric" value={customization.fabric.label} />
        )}
        {customization.color && (
          <SummaryRow
            label="Color"
            value={customization.color.label}
            colorHex={customization.color.hex}
          />
        )}
        {customization.fit && (
          <SummaryRow label="Fit" value={customization.fit.label} />
        )}
        {customization.collar && (
          <SummaryRow label="Collar" value={customization.collar.label} />
        )}
        {customization.sleeve && (
          <SummaryRow label="Sleeve" value={customization.sleeve.label} />
        )}
        {customization.buttons && (
          <SummaryRow label="Buttons" value={customization.buttons.label} />
        )}
        {customization.embroidery && (
          <SummaryRow label="Embroidery" value={customization.embroidery.label} />
        )}
        {customization.cutLength && (
          <SummaryRow label="Length" value={customization.cutLength.label} />
        )}
      </div>
      
      <Separator className="my-4" />
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Base Price</span>
          <span className="text-foreground">${basePrice.toFixed(2)}</span>
        </div>
        
        {modifiers.map((mod, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{mod.label}</span>
            <span className="text-accent">+${mod.price.toFixed(2)}</span>
          </div>
        ))}
      </div>
      
      <Separator className="my-4" />
      
      <div className="flex justify-between items-center">
        <span className="font-display text-lg font-semibold text-foreground">Total</span>
        <span className="font-display text-2xl font-bold text-gradient-gold">
          ${total.toFixed(2)}
        </span>
      </div>
    </motion.div>
  );
}

function SummaryRow({
  label,
  value,
  colorHex,
}: {
  label: string;
  value: string;
  colorHex?: string;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {colorHex && (
          <span
            className="w-4 h-4 rounded-full border border-border"
            style={{ backgroundColor: colorHex }}
          />
        )}
        <span className="text-foreground font-medium">{value}</span>
      </div>
    </div>
  );
}
