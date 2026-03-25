import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MeasurementGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  measurement: string;
}

const GUIDES: Record<string, { title: string; instruction: string; svg: JSX.Element }> = {
  chest: {
    title: 'Chest Measurement',
    instruction: 'Wrap the measuring tape around the fullest part of your chest, just under your armpits. Keep the tape level all the way around and snug but not tight. Breathe normally.',
    svg: (
      <svg viewBox="0 0 200 320" className="w-full max-w-[180px] mx-auto">
        {/* Body outline */}
        <path d="M100 20 C100 20 85 20 80 30 L70 50 L55 55 L40 80 L38 120 L42 140 L50 145 L48 200 L45 260 L50 310 L70 310 L75 260 L80 220 L85 260 L80 310 L100 310 L120 310 L115 260 L120 220 L125 260 L130 310 L150 310 L155 260 L152 200 L150 145 L158 140 L162 120 L160 80 L145 55 L130 50 L120 30 C115 20 100 20 100 20Z" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.4" />
        {/* Chest measurement line */}
        <ellipse cx="100" cy="90" rx="55" ry="12" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeDasharray="6 3" />
        {/* Arrows */}
        <polygon points="45,88 50,84 50,92" fill="hsl(var(--primary))" />
        <polygon points="155,88 150,84 150,92" fill="hsl(var(--primary))" />
        {/* Label */}
        <text x="100" y="78" textAnchor="middle" fontSize="10" fill="hsl(var(--primary))" fontWeight="600">CHEST</text>
      </svg>
    ),
  },
  waist: {
    title: 'Waist Measurement',
    instruction: 'Measure around your natural waistline — the narrowest part of your torso, usually just above your belly button. Keep the tape comfortably snug and parallel to the floor.',
    svg: (
      <svg viewBox="0 0 200 320" className="w-full max-w-[180px] mx-auto">
        <path d="M100 20 C100 20 85 20 80 30 L70 50 L55 55 L40 80 L38 120 L42 140 L50 145 L48 200 L45 260 L50 310 L70 310 L75 260 L80 220 L85 260 L80 310 L100 310 L120 310 L115 260 L120 220 L125 260 L130 310 L150 310 L155 260 L152 200 L150 145 L158 140 L162 120 L160 80 L145 55 L130 50 L120 30 C115 20 100 20 100 20Z" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.4" />
        <ellipse cx="100" cy="145" rx="48" ry="10" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeDasharray="6 3" />
        <polygon points="52,143 57,139 57,147" fill="hsl(var(--primary))" />
        <polygon points="148,143 143,139 143,147" fill="hsl(var(--primary))" />
        <text x="100" y="133" textAnchor="middle" fontSize="10" fill="hsl(var(--primary))" fontWeight="600">WAIST</text>
      </svg>
    ),
  },
  hips: {
    title: 'Hips Measurement',
    instruction: 'Measure around the fullest part of your hips and buttocks. Stand with feet together and keep the tape level all the way around.',
    svg: (
      <svg viewBox="0 0 200 320" className="w-full max-w-[180px] mx-auto">
        <path d="M100 20 C100 20 85 20 80 30 L70 50 L55 55 L40 80 L38 120 L42 140 L50 145 L48 200 L45 260 L50 310 L70 310 L75 260 L80 220 L85 260 L80 310 L100 310 L120 310 L115 260 L120 220 L125 260 L130 310 L150 310 L155 260 L152 200 L150 145 L158 140 L162 120 L160 80 L145 55 L130 50 L120 30 C115 20 100 20 100 20Z" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.4" />
        <ellipse cx="100" cy="195" rx="52" ry="11" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeDasharray="6 3" />
        <polygon points="48,193 53,189 53,197" fill="hsl(var(--primary))" />
        <polygon points="152,193 147,189 147,197" fill="hsl(var(--primary))" />
        <text x="100" y="183" textAnchor="middle" fontSize="10" fill="hsl(var(--primary))" fontWeight="600">HIPS</text>
      </svg>
    ),
  },
  shoulder_width: {
    title: 'Shoulder Width',
    instruction: 'Measure from one shoulder point to the other across your upper back. The shoulder point is where your arm meets your shoulder — the bony protrusion on top.',
    svg: (
      <svg viewBox="0 0 200 320" className="w-full max-w-[180px] mx-auto">
        <path d="M100 20 C100 20 85 20 80 30 L70 50 L55 55 L40 80 L38 120 L42 140 L50 145 L48 200 L45 260 L50 310 L70 310 L75 260 L80 220 L85 260 L80 310 L100 310 L120 310 L115 260 L120 220 L125 260 L130 310 L150 310 L155 260 L152 200 L150 145 L158 140 L162 120 L160 80 L145 55 L130 50 L120 30 C115 20 100 20 100 20Z" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.4" />
        <line x1="55" y1="55" x2="145" y2="55" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeDasharray="6 3" />
        <polygon points="55,55 60,51 60,59" fill="hsl(var(--primary))" />
        <polygon points="145,55 140,51 140,59" fill="hsl(var(--primary))" />
        <text x="100" y="48" textAnchor="middle" fontSize="10" fill="hsl(var(--primary))" fontWeight="600">SHOULDERS</text>
      </svg>
    ),
  },
  sleeve_length: {
    title: 'Sleeve Length',
    instruction: 'Measure from your shoulder point (where arm meets shoulder) down to your wrist bone. Keep your arm slightly bent at a natural angle.',
    svg: (
      <svg viewBox="0 0 200 320" className="w-full max-w-[180px] mx-auto">
        <path d="M100 20 C100 20 85 20 80 30 L70 50 L55 55 L40 80 L38 120 L42 140 L50 145 L48 200 L45 260 L50 310 L70 310 L75 260 L80 220 L85 260 L80 310 L100 310 L120 310 L115 260 L120 220 L125 260 L130 310 L150 310 L155 260 L152 200 L150 145 L158 140 L162 120 L160 80 L145 55 L130 50 L120 30 C115 20 100 20 100 20Z" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.4" />
        {/* Sleeve line from shoulder to wrist on left arm */}
        <line x1="55" y1="55" x2="38" y2="140" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeDasharray="6 3" />
        <polygon points="55,55 51,61 58,62" fill="hsl(var(--primary))" />
        <polygon points="38,140 42,134 35,133" fill="hsl(var(--primary))" />
        <text x="28" y="100" textAnchor="middle" fontSize="9" fill="hsl(var(--primary))" fontWeight="600" transform="rotate(-75 28 100)">SLEEVE</text>
      </svg>
    ),
  },
  neck: {
    title: 'Neck Measurement',
    instruction: 'Measure around the base of your neck, just above the collarbone. Insert one finger between the tape and your neck for a comfortable fit.',
    svg: (
      <svg viewBox="0 0 200 220" className="w-full max-w-[180px] mx-auto">
        {/* Head */}
        <ellipse cx="100" cy="50" rx="30" ry="38" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.4" />
        {/* Neck */}
        <rect x="85" y="85" width="30" height="30" rx="5" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.4" />
        {/* Shoulders */}
        <path d="M85 115 L40 140 L40 180 L160 180 L160 140 L115 115" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.4" />
        {/* Neck measurement */}
        <ellipse cx="100" cy="108" rx="22" ry="8" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeDasharray="6 3" />
        <polygon points="78,106 83,102 83,110" fill="hsl(var(--primary))" />
        <polygon points="122,106 117,102 117,110" fill="hsl(var(--primary))" />
        <text x="100" y="96" textAnchor="middle" fontSize="10" fill="hsl(var(--primary))" fontWeight="600">NECK</text>
      </svg>
    ),
  },
  inseam: {
    title: 'Inseam Measurement',
    instruction: 'Measure from the crotch seam (where the inner leg seams meet) straight down along the inside of your leg to your ankle bone.',
    svg: (
      <svg viewBox="0 0 200 320" className="w-full max-w-[180px] mx-auto">
        <path d="M100 20 C100 20 85 20 80 30 L70 50 L55 55 L40 80 L38 120 L42 140 L50 145 L48 200 L45 260 L50 310 L70 310 L75 260 L80 220 L85 260 L80 310 L100 310 L120 310 L115 260 L120 220 L125 260 L130 310 L150 310 L155 260 L152 200 L150 145 L158 140 L162 120 L160 80 L145 55 L130 50 L120 30 C115 20 100 20 100 20Z" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.4" />
        {/* Inseam line */}
        <line x1="80" y1="215" x2="80" y2="310" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeDasharray="6 3" />
        <polygon points="80,215 76,221 84,221" fill="hsl(var(--primary))" />
        <polygon points="80,310 76,304 84,304" fill="hsl(var(--primary))" />
        <text x="68" y="265" textAnchor="middle" fontSize="9" fill="hsl(var(--primary))" fontWeight="600" transform="rotate(-90 68 265)">INSEAM</text>
      </svg>
    ),
  },
  height: {
    title: 'Height Measurement',
    instruction: 'Stand straight against a flat wall with your feet together and heels touching the wall. Have someone measure from the floor to the top of your head.',
    svg: (
      <svg viewBox="0 0 200 320" className="w-full max-w-[180px] mx-auto">
        <path d="M100 20 C100 20 85 20 80 30 L70 50 L55 55 L40 80 L38 120 L42 140 L50 145 L48 200 L45 260 L50 310 L70 310 L75 260 L80 220 L85 260 L80 310 L100 310 L120 310 L115 260 L120 220 L125 260 L130 310 L150 310 L155 260 L152 200 L150 145 L158 140 L162 120 L160 80 L145 55 L130 50 L120 30 C115 20 100 20 100 20Z" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.4" />
        {/* Height arrow */}
        <line x1="175" y1="20" x2="175" y2="310" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeDasharray="6 3" />
        <polygon points="175,20 171,26 179,26" fill="hsl(var(--primary))" />
        <polygon points="175,310 171,304 179,304" fill="hsl(var(--primary))" />
        {/* Floor line */}
        <line x1="40" y1="312" x2="185" y2="312" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.5" />
        <text x="185" y="170" textAnchor="middle" fontSize="9" fill="hsl(var(--primary))" fontWeight="600" transform="rotate(90 185 170)">HEIGHT</text>
      </svg>
    ),
  },
};

export default function MeasurementGuideDialog({ open, onOpenChange, measurement }: MeasurementGuideDialogProps) {
  const guide = GUIDES[measurement];
  if (!guide) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">{guide.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 pt-2">
          <div className="w-full bg-muted/30 rounded-lg p-6">
            {guide.svg}
          </div>
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            {guide.instruction}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
