import { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Layers, ZoomIn, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FloorPlanDisplayProps {
  spaceId: string;
  floorPlanUrl?: string | null;
}

const FloorPlanDisplay = ({ spaceId, floorPlanUrl }: FloorPlanDisplayProps) => {
  const [isZoomed, setIsZoomed] = useState(false);

  // For now, we'll show a placeholder since floor plans are generated on demand
  // In a full implementation, you'd fetch saved floor plans from the database
  
  if (!floorPlanUrl) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-8 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
          <Layers className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <p className="text-muted-foreground font-medium">Floor plan coming soon</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            The host is preparing the floor plan for this property
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative rounded-xl overflow-hidden border border-border group cursor-pointer"
        onClick={() => setIsZoomed(true)}
      >
        <img
          src={floorPlanUrl}
          alt="Property floor plan"
          className="w-full h-auto max-h-[400px] object-contain bg-secondary"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <Button
            variant="secondary"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity gap-2"
          >
            <ZoomIn className="w-4 h-4" />
            View Full Size
          </Button>
        </div>
      </motion.div>

      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Floor Plan
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <img
              src={floorPlanUrl}
              alt="Property floor plan - full size"
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloorPlanDisplay;
