import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, EyeOff, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSpacePublish } from '@/hooks/useSpacePublish';

interface PublishButtonProps {
  spaceId: string;
  currentStatus: string | null;
  canPublish: boolean;
  missingRequiredCount: number;
}

const PublishButton = ({
  spaceId,
  currentStatus,
  canPublish,
  missingRequiredCount,
}: PublishButtonProps) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [action, setAction] = useState<'publish' | 'unpublish'>('publish');
  
  const { publishSpace, unpublishSpace, isPublishing, isUnpublishing } = useSpacePublish(spaceId);

  const isPublished = currentStatus === 'published';
  const isLoading = isPublishing || isUnpublishing;

  const handlePublishClick = () => {
    if (!canPublish) return;
    setAction('publish');
    setShowConfirmDialog(true);
  };

  const handleUnpublishClick = () => {
    setAction('unpublish');
    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    if (action === 'publish') {
      publishSpace();
    } else {
      unpublishSpace();
    }
    setShowConfirmDialog(false);
  };

  if (isPublished) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3"
        >
          <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-2 rounded-lg">
            <Globe className="w-4 h-4" />
            <span className="font-medium">Published</span>
          </div>
          <Button
            variant="outline"
            onClick={handleUnpublishClick}
            disabled={isLoading}
            className="gap-2"
          >
            {isUnpublishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
            Take Offline
          </Button>
        </motion.div>

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Take Property Offline?</AlertDialogTitle>
              <AlertDialogDescription>
                This property will no longer be visible on the Explore page. You can republish it at any time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirm}>
                Take Offline
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  onClick={handlePublishClick}
                  disabled={!canPublish || isLoading}
                  className="gap-2"
                  size="lg"
                >
                  {isPublishing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : canPublish ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  Publish Property
                </Button>
              </span>
            </TooltipTrigger>
            {!canPublish && (
              <TooltipContent side="bottom" className="max-w-xs">
                <p>
                  {missingRequiredCount} required amenities must be marked as "provided" before publishing.
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </motion.div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Property?</AlertDialogTitle>
            <AlertDialogDescription>
              Your property will be visible on the Explore page for everyone to see. Make sure all information is accurate and up to date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="gap-2">
              <Globe className="w-4 h-4" />
              Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PublishButton;
