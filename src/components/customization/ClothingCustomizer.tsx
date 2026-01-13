import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import FabricSelector from './FabricSelector';
import ColorSelector from './ColorSelector';
import OptionSelector from './OptionSelector';
import CustomizationSummary from './CustomizationSummary';
import {
  ProductCategory,
  CustomizationState,
  CustomizationConfig,
  categoryCustomizations,
  defaultFabrics,
  defaultColors,
  defaultFits,
  defaultCollars,
  defaultSleeves,
  defaultButtons,
  defaultEmbroideries,
  defaultCutLengths,
  FabricOption,
  ColorOption,
  CustomizationOption,
} from '@/types/customization';
import { cn } from '@/lib/utils';

interface ClothingCustomizerProps {
  productName: string;
  category: ProductCategory;
  basePrice: number;
  config?: Partial<CustomizationConfig>;
  onComplete: (customization: CustomizationState) => void;
  onCancel?: () => void;
}

type StepKey = keyof CustomizationState;

const stepLabels: Record<StepKey, string> = {
  fabric: 'Fabric',
  color: 'Color',
  fit: 'Fit',
  collar: 'Collar',
  sleeve: 'Sleeve',
  buttons: 'Buttons',
  embroidery: 'Embroidery',
  cutLength: 'Length',
};

export default function ClothingCustomizer({
  productName,
  category,
  basePrice,
  config,
  onComplete,
  onCancel,
}: ClothingCustomizerProps) {
  const availableSteps = categoryCustomizations[category];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [customization, setCustomization] = useState<CustomizationState>({
    fabric: null,
    color: null,
    fit: null,
    collar: null,
    sleeve: null,
    buttons: null,
    embroidery: null,
    cutLength: null,
  });

  const fullConfig: CustomizationConfig = {
    fabrics: config?.fabrics || defaultFabrics,
    colors: config?.colors || defaultColors,
    fits: config?.fits || defaultFits,
    collars: config?.collars || defaultCollars,
    sleeves: config?.sleeves || defaultSleeves,
    buttons: config?.buttons || defaultButtons,
    embroideries: config?.embroideries || defaultEmbroideries,
    cutLengths: config?.cutLengths || defaultCutLengths,
  };

  const currentStep = availableSteps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / availableSteps.length) * 100;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === availableSteps.length - 1;

  const handleSelect = (key: StepKey, value: FabricOption | ColorOption | CustomizationOption) => {
    setCustomization((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete(customization);
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (isFirstStep && onCancel) {
      onCancel();
    } else {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const canProceed = customization[currentStep] !== null;

  const renderStep = () => {
    switch (currentStep) {
      case 'fabric':
        return (
          <FabricSelector
            fabrics={fullConfig.fabrics}
            selected={customization.fabric}
            onSelect={(f) => handleSelect('fabric', f)}
          />
        );
      case 'color':
        return (
          <ColorSelector
            colors={fullConfig.colors}
            selected={customization.color}
            onSelect={(c) => handleSelect('color', c)}
          />
        );
      case 'fit':
        return (
          <OptionSelector
            title="Fit"
            options={fullConfig.fits}
            selected={customization.fit}
            onSelect={(o) => handleSelect('fit', o)}
            columns={2}
          />
        );
      case 'collar':
        return (
          <OptionSelector
            title="Collar Style"
            options={fullConfig.collars}
            selected={customization.collar}
            onSelect={(o) => handleSelect('collar', o)}
            columns={3}
          />
        );
      case 'sleeve':
        return (
          <OptionSelector
            title="Sleeve Style"
            options={fullConfig.sleeves}
            selected={customization.sleeve}
            onSelect={(o) => handleSelect('sleeve', o)}
            columns={3}
          />
        );
      case 'buttons':
        return (
          <OptionSelector
            title="Button Style"
            options={fullConfig.buttons}
            selected={customization.buttons}
            onSelect={(o) => handleSelect('buttons', o)}
            columns={3}
          />
        );
      case 'embroidery':
        return (
          <OptionSelector
            title="Embroidery"
            options={fullConfig.embroideries}
            selected={customization.embroidery}
            onSelect={(o) => handleSelect('embroidery', o)}
            columns={3}
          />
        );
      case 'cutLength':
        return (
          <OptionSelector
            title="Cut Length"
            options={fullConfig.cutLengths}
            selected={customization.cutLength}
            onSelect={(o) => handleSelect('cutLength', o)}
            columns={3}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Customizing</p>
              <h1 className="font-display text-2xl font-semibold text-foreground">
                {productName}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>
                Step {currentStepIndex + 1} of {availableSteps.length}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Step indicators */}
          <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-2">
            {availableSteps.map((step, idx) => (
              <button
                key={step}
                onClick={() => idx < currentStepIndex && setCurrentStepIndex(idx)}
                disabled={idx > currentStepIndex}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap',
                  idx === currentStepIndex
                    ? 'bg-accent text-accent-foreground'
                    : idx < currentStepIndex
                    ? 'bg-secondary text-secondary-foreground cursor-pointer hover:bg-secondary/80'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                {stepLabels[step]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Selector area */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={handleBack}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {isFirstStep ? 'Cancel' : 'Back'}
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {isLastStep ? 'Complete Customization' : 'Continue'}
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Summary sidebar */}
          <div className="hidden lg:block">
            <CustomizationSummary
              customization={customization}
              basePrice={basePrice}
            />
          </div>
        </div>
      </div>

      {/* Mobile summary */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Estimated Total</p>
            <p className="font-display text-xl font-bold text-gradient-gold">
              ${calculateTotal(customization, basePrice).toFixed(2)}
            </p>
          </div>
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isLastStep ? 'Complete' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function calculateTotal(customization: CustomizationState, basePrice: number): number {
  let total = basePrice;
  
  Object.values(customization).forEach((option) => {
    if (option && 'priceModifier' in option && option.priceModifier) {
      total += option.priceModifier;
    }
  });
  
  return total;
}
