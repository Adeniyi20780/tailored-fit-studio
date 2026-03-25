import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Plus, Ruler, User, Trash2 } from 'lucide-react';
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
import { useCustomerMeasurements, useCreateMeasurement, useDeleteMeasurement, Measurement } from '@/hooks/useCustomerMeasurements';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MeasurementSelectorProps {
  selected: Measurement | null;
  onSelect: (measurement: Measurement) => void;
}

const MAX_SAVED_MEASUREMENTS = 3;

export default function MeasurementSelector({ selected, onSelect }: MeasurementSelectorProps) {
  const { data: measurements, isLoading } = useCustomerMeasurements();
  const createMeasurement = useCreateMeasurement();
  const deleteMeasurement = useDeleteMeasurement();
  const [showNewForm, setShowNewForm] = useState(false);
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
                    onChange={(e) =>
                      setNewMeasurement({ ...newMeasurement, measurement_name: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Chest (cm)</Label>
                    <Input type="number" placeholder="96" value={newMeasurement.chest} onChange={(e) => setNewMeasurement({ ...newMeasurement, chest: e.target.value })} />
                  </div>
                  <div>
                    <Label>Waist (cm)</Label>
                    <Input type="number" placeholder="84" value={newMeasurement.waist} onChange={(e) => setNewMeasurement({ ...newMeasurement, waist: e.target.value })} />
                  </div>
                  <div>
                    <Label>Hips (cm)</Label>
                    <Input type="number" placeholder="100" value={newMeasurement.hips} onChange={(e) => setNewMeasurement({ ...newMeasurement, hips: e.target.value })} />
                  </div>
                  <div>
                    <Label>Shoulders (cm)</Label>
                    <Input type="number" placeholder="46" value={newMeasurement.shoulder_width} onChange={(e) => setNewMeasurement({ ...newMeasurement, shoulder_width: e.target.value })} />
                  </div>
                  <div>
                    <Label>Sleeve (cm)</Label>
                    <Input type="number" placeholder="64" value={newMeasurement.sleeve_length} onChange={(e) => setNewMeasurement({ ...newMeasurement, sleeve_length: e.target.value })} />
                  </div>
                  <div>
                    <Label>Neck (cm)</Label>
                    <Input type="number" placeholder="40" value={newMeasurement.neck} onChange={(e) => setNewMeasurement({ ...newMeasurement, neck: e.target.value })} />
                  </div>
                  <div>
                    <Label>Inseam (cm)</Label>
                    <Input type="number" placeholder="80" value={newMeasurement.inseam} onChange={(e) => setNewMeasurement({ ...newMeasurement, inseam: e.target.value })} />
                  </div>
                  <div>
                    <Label>Height (cm)</Label>
                    <Input type="number" placeholder="175" value={newMeasurement.height} onChange={(e) => setNewMeasurement({ ...newMeasurement, height: e.target.value })} />
                  </div>
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
    </div>
  );
}
