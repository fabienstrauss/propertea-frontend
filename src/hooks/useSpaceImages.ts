import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SpaceImage {
  id: string;
  space_id: string;
  storage_url: string;
  storage_path: string | null;
  file_name: string | null;
  display_order: number | null;
  is_primary: boolean | null;
  created_at: string | null;
}

export const useSpaceImages = (spaceId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['space-images', spaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('space_image')
        .select('*')
        .eq('space_id', spaceId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as SpaceImage[];
    },
    enabled: !!spaceId,
  });

  const uploadImage = async (file: File) => {
    if (!user) {
      toast.error('You must be logged in to upload images');
      return null;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const storagePath = `${spaceId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('property-documents')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-documents')
        .getPublicUrl(storagePath);

      // Get current max display order
      const maxOrder = images.length > 0 
        ? Math.max(...images.map(img => img.display_order || 0)) 
        : 0;

      // Insert record
      const { data, error: insertError } = await supabase
        .from('space_image')
        .insert({
          space_id: spaceId,
          storage_url: publicUrl,
          storage_path: storagePath,
          file_name: file.name,
          display_order: maxOrder + 1,
          is_primary: images.length === 0, // First image is primary by default
        })
        .select()
        .single();

      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ['space-images', spaceId] });
      toast.success('Image uploaded successfully');
      return data as SpaceImage;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = useMutation({
    mutationFn: async (image: SpaceImage) => {
      // Delete from storage if path exists
      if (image.storage_path) {
        await supabase.storage
          .from('property-documents')
          .remove([image.storage_path]);
      }

      // Delete record
      const { error } = await supabase
        .from('space_image')
        .delete()
        .eq('id', image.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-images', spaceId] });
      toast.success('Image deleted');
    },
    onError: () => {
      toast.error('Failed to delete image');
    },
  });

  const setPrimaryImage = useMutation({
    mutationFn: async (imageId: string) => {
      // Unset current primary
      await supabase
        .from('space_image')
        .update({ is_primary: false })
        .eq('space_id', spaceId);

      // Set new primary
      const { error } = await supabase
        .from('space_image')
        .update({ is_primary: true })
        .eq('id', imageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-images', spaceId] });
      toast.success('Primary image updated');
    },
    onError: () => {
      toast.error('Failed to update primary image');
    },
  });

  const reorderImages = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => 
        supabase
          .from('space_image')
          .update({ display_order: index })
          .eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-images', spaceId] });
    },
  });

  const primaryImage = images.find(img => img.is_primary) || images[0];

  return {
    images,
    isLoading,
    isUploading,
    uploadImage,
    deleteImage: deleteImage.mutate,
    setPrimaryImage: setPrimaryImage.mutate,
    reorderImages: reorderImages.mutate,
    primaryImage,
  };
};
