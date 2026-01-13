import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const isSelected = selected === category;
        
        return (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={cn(
              'relative px-4 py-2 rounded-full text-sm font-medium transition-colors',
              isSelected
                ? 'text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80'
            )}
          >
            {isSelected && (
              <motion.div
                layoutId="category-pill"
                className="absolute inset-0 bg-accent rounded-full"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 capitalize">
              {category === 'all' ? 'All Products' : category}
            </span>
          </button>
        );
      })}
    </div>
  );
}
