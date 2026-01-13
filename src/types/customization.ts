export type ProductCategory = 'shirts' | 'suits' | 'jeans' | 'kaftans' | 'traditional';

export interface CustomizationOption {
  id: string;
  label: string;
  description?: string;
  priceModifier?: number;
  imageUrl?: string;
}

export interface FabricOption extends CustomizationOption {
  texture: 'smooth' | 'textured' | 'ribbed' | 'woven' | 'brushed';
  type: 'cotton' | 'linen' | 'silk' | 'wool' | 'polyester' | 'blend' | 'denim' | 'velvet';
  weight?: 'light' | 'medium' | 'heavy';
}

export interface ColorOption extends CustomizationOption {
  hex: string;
}

export interface CustomizationState {
  fabric: FabricOption | null;
  color: ColorOption | null;
  fit: CustomizationOption | null;
  collar: CustomizationOption | null;
  sleeve: CustomizationOption | null;
  buttons: CustomizationOption | null;
  embroidery: CustomizationOption | null;
  cutLength: CustomizationOption | null;
}

export interface CustomizationConfig {
  fabrics: FabricOption[];
  colors: ColorOption[];
  fits: CustomizationOption[];
  collars: CustomizationOption[];
  sleeves: CustomizationOption[];
  buttons: CustomizationOption[];
  embroideries: CustomizationOption[];
  cutLengths: CustomizationOption[];
}

// Default customization options
export const defaultFabrics: FabricOption[] = [
  { id: 'cotton-smooth', label: 'Premium Cotton', texture: 'smooth', type: 'cotton', weight: 'medium', description: 'Soft, breathable everyday comfort' },
  { id: 'linen-textured', label: 'Irish Linen', texture: 'textured', type: 'linen', weight: 'light', description: 'Cool and crisp for warm weather' },
  { id: 'silk-smooth', label: 'Mulberry Silk', texture: 'smooth', type: 'silk', weight: 'light', description: 'Luxurious sheen and drape', priceModifier: 50 },
  { id: 'wool-woven', label: 'Merino Wool', texture: 'woven', type: 'wool', weight: 'medium', description: 'Temperature regulating excellence', priceModifier: 30 },
  { id: 'denim-textured', label: 'Japanese Denim', texture: 'textured', type: 'denim', weight: 'heavy', description: 'Authentic selvedge quality', priceModifier: 25 },
  { id: 'velvet-brushed', label: 'Velvet', texture: 'brushed', type: 'velvet', weight: 'medium', description: 'Rich and opulent texture', priceModifier: 40 },
  { id: 'blend-ribbed', label: 'Cotton-Linen Blend', texture: 'ribbed', type: 'blend', weight: 'light', description: 'Best of both worlds' },
  { id: 'poly-smooth', label: 'Performance Blend', texture: 'smooth', type: 'polyester', weight: 'light', description: 'Wrinkle-resistant and durable' },
];

export const defaultColors: ColorOption[] = [
  { id: 'midnight', label: 'Midnight Navy', hex: '#1a1f3c' },
  { id: 'charcoal', label: 'Charcoal', hex: '#36454f' },
  { id: 'ivory', label: 'Ivory', hex: '#fffff0' },
  { id: 'burgundy', label: 'Burgundy', hex: '#722f37' },
  { id: 'forest', label: 'Forest Green', hex: '#228b22' },
  { id: 'camel', label: 'Camel', hex: '#c19a6b' },
  { id: 'slate', label: 'Slate Blue', hex: '#6a5acd' },
  { id: 'terracotta', label: 'Terracotta', hex: '#e2725b' },
  { id: 'cream', label: 'Cream', hex: '#fffdd0' },
  { id: 'black', label: 'Jet Black', hex: '#0a0a0a' },
  { id: 'white', label: 'Pure White', hex: '#ffffff' },
  { id: 'olive', label: 'Olive', hex: '#808000' },
];

export const defaultFits: CustomizationOption[] = [
  { id: 'slim', label: 'Slim Fit', description: 'Tailored close to the body' },
  { id: 'regular', label: 'Regular Fit', description: 'Classic comfortable cut' },
  { id: 'relaxed', label: 'Relaxed Fit', description: 'Extra room for ease of movement' },
  { id: 'tailored', label: 'Tailored Fit', description: 'Custom to your exact measurements', priceModifier: 20 },
];

export const defaultCollars: CustomizationOption[] = [
  { id: 'spread', label: 'Spread Collar', description: 'Modern and versatile' },
  { id: 'point', label: 'Point Collar', description: 'Traditional and sharp' },
  { id: 'button-down', label: 'Button-Down', description: 'Casual and polished' },
  { id: 'mandarin', label: 'Mandarin', description: 'Sleek, collarless design' },
  { id: 'club', label: 'Club Collar', description: 'Rounded vintage style' },
  { id: 'wingtip', label: 'Wingtip', description: 'Formal for bow ties', priceModifier: 10 },
];

export const defaultSleeves: CustomizationOption[] = [
  { id: 'full', label: 'Full Length', description: 'Classic long sleeves' },
  { id: 'three-quarter', label: 'Three-Quarter', description: 'Stylish mid-length' },
  { id: 'half', label: 'Half Sleeves', description: 'Casual and cool' },
  { id: 'short', label: 'Short Sleeves', description: 'Summer ready' },
  { id: 'sleeveless', label: 'Sleeveless', description: 'Bold and modern' },
  { id: 'roll-up', label: 'Roll-Up Tab', description: 'Convertible style', priceModifier: 5 },
];

export const defaultButtons: CustomizationOption[] = [
  { id: 'mother-pearl', label: 'Mother of Pearl', description: 'Classic elegance', priceModifier: 15 },
  { id: 'horn', label: 'Horn Buttons', description: 'Natural and unique', priceModifier: 10 },
  { id: 'corozo', label: 'Corozo Nut', description: 'Sustainable luxury', priceModifier: 8 },
  { id: 'metal', label: 'Brushed Metal', description: 'Modern and bold', priceModifier: 12 },
  { id: 'fabric', label: 'Fabric Covered', description: 'Seamless integration' },
  { id: 'hidden', label: 'Hidden Placket', description: 'Clean minimal look', priceModifier: 5 },
];

export const defaultEmbroideries: CustomizationOption[] = [
  { id: 'none', label: 'No Embroidery', description: 'Keep it simple' },
  { id: 'monogram', label: 'Monogram', description: 'Your initials, your style', priceModifier: 15 },
  { id: 'chest-logo', label: 'Chest Logo', description: 'Subtle brand placement', priceModifier: 20 },
  { id: 'cuff', label: 'Cuff Detail', description: 'Elegant wrist accent', priceModifier: 25 },
  { id: 'collar', label: 'Collar Embroidery', description: 'Distinctive neckline', priceModifier: 30 },
  { id: 'full-pattern', label: 'Full Pattern', description: 'All-over intricate design', priceModifier: 75 },
];

export const defaultCutLengths: CustomizationOption[] = [
  { id: 'cropped', label: 'Cropped', description: 'Modern short cut above waist' },
  { id: 'regular', label: 'Regular', description: 'Standard length at hip' },
  { id: 'long', label: 'Long', description: 'Extended coverage below hip' },
  { id: 'tunic', label: 'Tunic Length', description: 'Elegant mid-thigh length' },
  { id: 'full', label: 'Full Length', description: 'Floor-grazing elegance' },
];

// Category-specific available options
export const categoryCustomizations: Record<ProductCategory, (keyof CustomizationState)[]> = {
  shirts: ['fabric', 'color', 'fit', 'collar', 'sleeve', 'buttons', 'embroidery', 'cutLength'],
  suits: ['fabric', 'color', 'fit', 'buttons', 'embroidery', 'cutLength'],
  jeans: ['fabric', 'color', 'fit', 'cutLength'],
  kaftans: ['fabric', 'color', 'fit', 'sleeve', 'embroidery', 'cutLength'],
  traditional: ['fabric', 'color', 'fit', 'collar', 'sleeve', 'buttons', 'embroidery', 'cutLength'],
};
