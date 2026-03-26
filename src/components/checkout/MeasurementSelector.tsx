import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Plus, Ruler, User, Trash2, HelpCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCustomerMeasurements, useCreateMeasurement, useDeleteMeasurement, Measurement } from '@/hooks/useCustomerMeasurements';
import MeasurementGuideDialog from '@/components/measurements/MeasurementGuideDialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MeasurementSelectorProps {
  selected: Measurement | null;
  onSelect: (measurement: Measurement) => void;
  shareable?: boolean;
}

const MAX_SAVED_MEASUREMENTS = 3;

const MEASUREMENT_FIELDS = [
  { key: 'chest', label: 'Chest', placeholder: '96' },
  { key: 'waist', label: 'Waist', placeholder: '84' },
  { key: 'hips', label: 'Hips', placeholder: '100' },
  { key: 'shoulder_width', label: 'Shoulders', placeholder: '46' },
  { key: 'sleeve_length', label: 'Sleeve', placeholder: '64' },
  { key: 'neck', label: 'Neck', placeholder: '40' },
  { key: 'inseam', label: 'Inseam', placeholder: '80' },
  { key: 'height', label: 'Height', placeholder: '175' },
] as const;

export default function MeasurementSelector({ selected, onSelect, shareable }: MeasurementSelectorProps) {
  const { data: measurements, isLoading } = useCustomerMeasurements();
  const createMeasurement = useCreateMeasurement();
  const deleteMeasurement = useDeleteMeasurement();
  const [showNewForm, setShowNewForm] = useState(false);
  const [guideField, setGuideField] = useState<string | null>(null);
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [newMeasurement, setNewMeasurement] = useState({
    measurement_name: '',
    chest: '',
    waist: '',
    hips: '',
    shoulder_width: '',
    sleeve_length: '',
    neck: '',
    inseam: '',
    height: '',
  });

  const measurementCount = measurements?.length ?? 0;
  const atLimit = measurementCount >= MAX_SAVED_MEASUREMENTS;

  const handleCreateMeasurement = async () => {
    if (!newMeasurement.measurement_name) {
      toast.error('Please enter a name for your measurements');
      return;
    }

    try {
      const result = await createMeasurement.mutateAsync({
        measurement_name: newMeasurement.measurement_name,
        chest: newMeasurement.chest ? parseFloat(newMeasurement.chest) : null,
        waist: newMeasurement.waist ? parseFloat(newMeasurement.waist) : null,
        hips: newMeasurement.hips ? parseFloat(newMeasurement.hips) : null,
        shoulder_width: newMeasurement.shoulder_width ? parseFloat(newMeasurement.shoulder_width) : null,
        sleeve_length: newMeasurement.sleeve_length ? parseFloat(newMeasurement.sleeve_length) : null,
        neck: newMeasurement.neck ? parseFloat(newMeasurement.neck) : null,
        inseam: newMeasurement.inseam ? parseFloat(newMeasurement.inseam) : null,
        height: newMeasurement.height ? parseFloat(newMeasurement.height) : null,
        unit: 'cm',
      });
      
      toast.success('Measurements saved!');
      setShowNewForm(false);
      onSelect(result as Measurement);
      setNewMeasurement({
        measurement_name: '',
        chest: '',
        waist: '',
        hips: '',
        shoulder_width: '',
        sleeve_length: '',
        neck: '',
        inseam: '',
        height: '',
      });
    } catch (error) {
      toast.error('Failed to save measurements');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteMeasurement.mutateAsync(id);
      toast.success('Measurement deleted');
    } catch {
      toast.error('Failed to delete measurement');
    }
  };

  const updateField = (key: string, value: string) => {
    setNewMeasurement(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-20 bg-muted rounded-lg" />
        <div className="h-20 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">Your Measurements</h3>
          <p className="text-xs text-muted-foreground">{measurementCount}/{MAX_SAVED_MEASUREMENTS} saved</p>
        </div>
        {!atLimit ? (
          <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Measurements</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Profile Name</Label>
                  <Input
                    placeholder="e.g., My Measurements"
                    value={newMeasurement.measurement_name}
                    onChange={(e) => updateField('measurement_name', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {MEASUREMENT_FIELDS.map((field) => (
                    <div key={field.key}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Label className="text-sm">
                          {field.label} {field.key === 'height' ? '' : '(cm)'}
                        </Label>
                        {field.key === 'height' && (
                          <ToggleGroup type="single" value={heightUnit} onValueChange={(v) => {
                            if (v === "cm" || v === "ft") {
                              setHeightUnit(v);
                              if (v === "ft" && newMeasurement.height) {
                                const totalInches = parseFloat(newMeasurement.height) / 2.54;
                                setHeightFeet(Math.floor(totalInches / 12).toString());
                                setHeightInches(Math.round(totalInches % 12).toString());
                              } else if (v === "cm" && heightFeet) {
                                const cm = (parseFloat(heightFeet || "0") * 30.48) + (parseFloat(heightInches || "0") * 2.54);
                                updateField('height', Math.round(cm).toString());
                              }
                            }
                          }} className="h-6">
                            <ToggleGroupItem value="cm" className="text-[10px] px-1.5 h-6">cm</ToggleGroupItem>
                            <ToggleGroupItem value="ft" className="text-[10px] px-1.5 h-6">ft</ToggleGroupItem>
                          </ToggleGroup>
                        )}
                        <button
                          type="button"
                          onClick={() => setGuideField(field.key)}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          aria-label={`How to measure ${field.label}`}
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {field.key === 'height' && heightUnit === 'ft' ? (
                        <div className="flex gap-1.5">
                          <div className="flex-1">
                            <Input
                              type="number"
                              placeholder="5"
                              value={heightFeet}
                              onChange={(e) => {
                                setHeightFeet(e.target.value);
                                const cm = (parseFloat(e.target.value || "0") * 30.48) + (parseFloat(heightInches || "0") * 2.54);
                                updateField('height', Math.round(cm).toString());
                              }}
                            />
                            <span className="text-[10px] text-muted-foreground">ft</span>
                          </div>
                          <div className="flex-1">
                            <Input
                              type="number"
                              placeholder="9"
                              value={heightInches}
                              onChange={(e) => {
                                setHeightInches(e.target.value);
                                const cm = (parseFloat(heightFeet || "0") * 30.48) + (parseFloat(e.target.value || "0") * 2.54);
                                updateField('height', Math.round(cm).toString());
                              }}
                            />
                            <span className="text-[10px] text-muted-foreground">in</span>
                          </div>
                        </div>
                      ) : (
                        <Input
                          type="number"
                          placeholder={field.placeholder}
                          value={newMeasurement[field.key as keyof typeof newMeasurement]}
                          onChange={(e) => updateField(field.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleCreateMeasurement}
                  disabled={createMeasurement.isPending}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {createMeasurement.isPending ? 'Saving...' : 'Save Measurements'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <p className="text-xs text-muted-foreground">Max {MAX_SAVED_MEASUREMENTS} reached</p>
        )}
      </div>

      {measurements && measurements.length > 0 ? (
        <div className="space-y-3">
          {measurements.map((measurement) => {
            const isSelected = selected?.id === measurement.id;
            
            return (
              <motion.div
                key={measurement.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  'w-full p-4 rounded-lg border-2 text-left transition-all duration-200 cursor-pointer',
                  isSelected
                    ? 'border-accent bg-accent/5 shadow-gold'
                    : 'border-border hover:border-accent/50 bg-card'
                )}
                onClick={() => onSelect(measurement)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {measurement.measurement_name || 'My Measurements'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Chest: {measurement.chest || '—'}cm • Waist: {measurement.waist || '—'}cm • Height: {measurement.height || '—'}cm
                      </p>
                      {isSelected && shareable && (
                        <p className="text-xs text-primary mt-1 flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                          Will be shared with your tailor
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDelete(e, measurement.id)}
                      disabled={deleteMeasurement.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-accent flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-accent-foreground" />
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
          <Ruler className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-3">No measurements saved yet</p>
          <Button
            variant="outline"
            onClick={() => setShowNewForm(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Your Measurements
          </Button>
        </div>
      )}

      {/* Measurement guide dialog */}
      <MeasurementGuideDialog
        open={!!guideField}
        onOpenChange={(open) => !open && setGuideField(null)}
        measurement={guideField || ''}
      />
    </div>
  );
}
