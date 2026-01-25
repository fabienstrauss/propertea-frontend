import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSpacePublish = (spaceId: string) => {
  const queryClient = useQueryClient();

  const publishSpace = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('space')
        .update({ status: 'published' })
        .eq('id', spaceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space', spaceId] });
      toast.success('Property published successfully! It is now visible on Explore.');
    },
    onError: () => {
      toast.error('Failed to publish property');
    },
  });

  const unpublishSpace = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('space')
        .update({ status: 'draft' })
        .eq('id', spaceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space', spaceId] });
      toast.success('Property taken offline');
    },
    onError: () => {
      toast.error('Failed to take property offline');
    },
  });

  return {
    publishSpace: publishSpace.mutate,
    unpublishSpace: unpublishSpace.mutate,
    isPublishing: publishSpace.isPending,
    isUnpublishing: unpublishSpace.isPending,
  };
};
