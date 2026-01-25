import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, CalendarDays, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export type SpaceType = 'property' | 'event_space';

interface CreatePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertyCreated: () => void;
}

const CreatePropertyModal = ({ isOpen, onClose, onPropertyCreated }: CreatePropertyModalProps) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [spaceType, setSpaceType] = useState<SpaceType>('property');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a space name',
        variant: 'destructive',
      });
      return;
    }

    if (!user) return;

    setIsSubmitting(true);

    const { error } = await supabase.from('space').insert({
      name: name.trim(),
      address: address.trim() || null,
      description: description.trim() || null,
      user_id: user.id,
      space_type: spaceType,
    });

    if (error) {
      toast({
        title: 'Error creating space',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Space created!',
        description: 'Your new space has been added.',
      });
      setName('');
      setAddress('');
      setDescription('');
      setSpaceType('property');
      onPropertyCreated();
    }

    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-coral-light flex items-center justify-center">
                <Building2 className="w-5 h-5 text-coral" />
              </div>
              <div>
                <h2 className="text-xl font-display text-foreground">New Space</h2>
                <p className="text-sm text-muted-foreground">Add a new space to manage</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Space Type Selection */}
            <div className="space-y-2">
              <Label>Space Type *</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSpaceType('property')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    spaceType === 'property'
                      ? "border-coral bg-coral/5"
                      : "border-border hover:border-coral/50"
                  )}
                >
                  <Building2 className={cn(
                    "w-6 h-6",
                    spaceType === 'property' ? "text-coral" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    spaceType === 'property' ? "text-foreground" : "text-muted-foreground"
                  )}>Property</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Rental homes, apartments, vacation stays
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSpaceType('event_space')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    spaceType === 'event_space'
                      ? "border-coral bg-coral/5"
                      : "border-border hover:border-coral/50"
                  )}
                >
                  <CalendarDays className={cn(
                    "w-6 h-6",
                    spaceType === 'event_space' ? "text-coral" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    spaceType === 'event_space' ? "text-foreground" : "text-muted-foreground"
                  )}>Event Space</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Venues, conference rooms, studios
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Space Name *</Label>
              <Input
                id="name"
                placeholder={spaceType === 'property' ? "e.g., Downtown Apartment" : "e.g., Grand Ballroom"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="e.g., 123 Main St, City"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the space..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="coral"
                disabled={isSubmitting}
                className="rounded-xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Space'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreatePropertyModal;