import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  status: 'uploading' | 'uploaded' | 'processing' | 'completed' | 'error';
  progress: number;
  dbId?: string;
}

export const useFileUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading] = useState(false);

  const uploadFile = async (file: File, spaceId?: string): Promise<UploadedFile | null> => {
    const fileId = crypto.randomUUID();
    const storagePath = `uploads/${Date.now()}_${file.name}`;

    const newFile: UploadedFile = {
      id: fileId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      storagePath,
      status: 'uploading',
      progress: 0,
    };

    setUploadedFiles(prev => [newFile, ...prev]);

    try {
      // Upload to storage
      const { error: storageError } = await supabase.storage
        .from('property-documents')
        .upload(storagePath, file);

      if (storageError) throw storageError;

      // Update progress
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === fileId ? { ...f, progress: 100, status: 'uploaded' } : f
        )
      );

      let targetSpaceId = spaceId;

      // Create space if not provided
      if (!targetSpaceId) {
        const { data: space, error: spaceError } = await supabase
          .from('space')
          .insert({
            name: `Space from ${file.name}`,
            status: 'pending',
            space_type: 'property',
          })
          .select()
          .single();

        if (spaceError) throw spaceError;
        targetSpaceId = space.id;
      }

      // Map file type to document type
      const getDocType = (mimeType: string): 'image' | 'video' | 'pdf' | 'document' | 'other' => {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType === 'application/pdf') return 'pdf';
        if (mimeType.startsWith('application/')) return 'document';
        return 'other';
      };

      // Get public URL for storage
      const { data: urlData } = supabase.storage
        .from('property-documents')
        .getPublicUrl(storagePath);

      // Insert document record
      const { data: docData, error: docError } = await supabase
        .from('space_document')
        .insert({
          space_id: targetSpaceId,
          file_name: file.name,
          file_type: getDocType(file.type),
          mime_type: file.type,
          storage_url: urlData.publicUrl,
          storage_path: storagePath,
          file_size: file.size,
          processing_status: 'processing',
        })
        .select()
        .single();

      if (docError) throw docError;

      // Update file with DB ID
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === fileId ? { ...f, dbId: docData.id, status: 'processing' } : f
        )
      );

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update to completed
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === fileId ? { ...f, status: 'completed' } : f
        )
      );

      // Update document status in DB
      await supabase
        .from('space_document')
        .update({ processing_status: 'completed' })
        .eq('id', docData.id);

      await supabase
        .from('space')
        .update({ status: 'active' })
        .eq('id', targetSpaceId);

      return { ...newFile, dbId: docData.id, status: 'completed', progress: 100 };
    } catch (error) {
      console.error('Upload error:', error);
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === fileId ? { ...f, status: 'error' } : f
        )
      );
      toast({
        title: 'Upload failed',
        description: `Failed to upload ${file.name}`,
        variant: 'destructive',
      });
      return null;
    }
  };

  const uploadFiles = async (files: FileList | File[], spaceId?: string) => {
    setIsUploading(true);
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      await uploadFile(file, spaceId);
    }
    
    setIsUploading(false);
    toast({
      title: 'Upload complete',
      description: `${fileArray.length} file(s) uploaded and processed`,
    });
  };

  const deleteFile = async (fileId: string, storagePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('property-documents')
        .remove([storagePath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from space_document table
      const { error: dbError } = await supabase
        .from('space_document')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      // Remove from state
      setUploadedFiles(prev => prev.filter(f => f.dbId !== fileId && f.id !== fileId));

      toast({
        title: 'File deleted',
        description: 'The file has been removed successfully.',
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the file.',
        variant: 'destructive',
      });
    }
  };

  const clearFiles = () => {
    setUploadedFiles([]);
  };

  return {
    uploadedFiles,
    isUploading,
    isLoading,
    uploadFiles,
    deleteFile,
    clearFiles,
  };
};