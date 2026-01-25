import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  BedDouble,
  Bath,
  Wifi,
  Car,
  Waves,
  Dumbbell,
  Tv,
  Coffee,
  Flame,
  Wind,
  Trees,
  Home,
  DoorOpen,
  UtensilsCrossed,
  WashingMachine,
  Snowflake,
  Shield,
  type LucideIcon
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DiscoveredItem {
  type: 'amenity' | 'room' | 'feature' | 'detail';
  name: string;
  category: string;
  value?: string | number;
  confidence: number;
}

interface ZenModeDiscoveryProps {
  items: DiscoveredItem[];
  isAnalyzing: boolean;
  summary?: string;
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  bedroom: BedDouble,
  bathroom: Bath,
  kitchen: UtensilsCrossed,
  living: Tv,
  laundry: WashingMachine,
  technology: Wifi,
  safety: Shield,
  outdoor: Trees,
  recreation: Waves,
  parking: Car,
  heating: Flame,
  cooling: Snowflake,
  fitness: Dumbbell,
  entrance: DoorOpen,
  default: Home,
};

const TYPE_COLORS: Record<string, string> = {
  room: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  amenity: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  feature: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  detail: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const ZenModeDiscovery = ({ items, isAnalyzing, summary }: ZenModeDiscoveryProps) => {
  const [visibleItems, setVisibleItems] = useState<DiscoveredItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Animate items appearing one by one
  useEffect(() => {
    if (items.length === 0) {
      setVisibleItems([]);
      setCurrentIndex(0);
      return;
    }

    if (currentIndex < items.length) {
      const timer = setTimeout(() => {
        setVisibleItems(prev => [...prev, items[currentIndex]]);
        setCurrentIndex(prev => prev + 1);
      }, 150); // 150ms delay between each item

      return () => clearTimeout(timer);
    }
  }, [items, currentIndex]);

  // Reset when items change
  useEffect(() => {
    setVisibleItems([]);
    setCurrentIndex(0);
  }, [items.length === 0]);

  const getIcon = (item: DiscoveredItem) => {
    const IconComponent = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.default;
    return IconComponent;
  };

  const roomCount = visibleItems.filter(i => i.type === 'room').length;
  const amenityCount = visibleItems.filter(i => i.type === 'amenity' || i.type === 'feature').length;

  if (!isAnalyzing && items.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Header with counts */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-coral" />
          <h4 className="font-semibold text-foreground">Discovered</h4>
        </div>
        {visibleItems.length > 0 && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-blue-400">
              {roomCount} room{roomCount !== 1 ? 's' : ''}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-emerald-400">
              {amenityCount} amenities
            </span>
          </div>
        )}
      </div>

      {/* Analyzing indicator */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-coral/10 border border-coral/20"
          >
            <Loader2 className="w-5 h-5 animate-spin text-coral" />
            <span className="text-sm text-foreground">
              AI is analyzing your documents...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      <AnimatePresence>
        {summary && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-muted/50 border border-border"
          >
            <p className="text-sm text-muted-foreground">{summary}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable discovery area */}
      <ScrollArea className="h-[300px] rounded-xl border border-border bg-background/50 p-4">
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {visibleItems.map((item, index) => {
              const IconComponent = getIcon(item);
              const colorClass = TYPE_COLORS[item.type] || TYPE_COLORS.detail;

              return (
                <motion.div
                  key={`${item.type}-${item.name}-${index}`}
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.9 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 30,
                    delay: 0.05
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${colorClass}`}
                >
                  <div className="flex-shrink-0">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {item.type} • {item.category}
                    </p>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Loading placeholder items */}
          {isAnalyzing && visibleItems.length === 0 && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={`placeholder-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30"
                >
                  <div className="w-5 h-5 rounded bg-muted animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Completion indicator */}
      <AnimatePresence>
        {!isAnalyzing && visibleItems.length > 0 && currentIndex >= items.length && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-green-500">
              Analysis complete! Found {items.length} items
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ZenModeDiscovery;
