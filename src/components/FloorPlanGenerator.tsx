import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Loader2, Download, RefreshCw, Sparkles, Layers, Upload, FileText, Image, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface FloorPlanGeneratorProps {
  propertyId: string;
  propertyName: string;
  address?: string;
  rooms?: { name: string; room_type: string }[];
  onFloorPlanGenerated?: (imageUrl: string) => void;
}

interface UploadedFloorplanFile {
  id: string;
  fileName: string;
  fileType: string;
  storageUrl: string;
  storagePath: string;
  status: 'uploading' | 'completed' | 'error';
}

const FloorPlanGenerator = ({
  propertyId,
  propertyName,
  address,
  rooms,
  onFloorPlanGenerated,
}: FloorPlanGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [floorPlanUrl, setFloorPlanUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFloorplanFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      
      if (!isImage && !isPdf) {
        toast.error(`${file.name} is not a supported file type. Please upload images or PDFs.`);
        continue;
      }

      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum file size is 20MB.`);
        continue;
      }

      const fileId = uuidv4();
      const fileExtension = file.name.split('.').pop();
      const storagePath = `${propertyId}/floorplan/${fileId}.${fileExtension}`;

      // Add to state as uploading
      const newFile: UploadedFloorplanFile = {
        id: fileId,
        fileName: file.name,
        fileType: file.type,
        storageUrl: '',
        storagePath,
        status: 'uploading',
      };
      setUploadedFiles(prev => [...prev, newFile]);

      try {
        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('property-documents')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('property-documents')
          .getPublicUrl(storagePath);

        const storageUrl = urlData.publicUrl;

        // Create space_document entry with is_floorplan_related_doc = true
        const { error: dbError } = await supabase
          .from('space_document')
          .insert([{
            space_id: propertyId,
            file_name: file.name,
            file_type: isImage ? 'image' : 'pdf',
            mime_type: file.type,
            file_size: file.size,
            storage_url: storageUrl,
            storage_path: storagePath,
            processing_status: 'pending' as const,
            is_floorplan_related_doc: true,
          }]);

        if (dbError) throw dbError;

        // Update state with completed status
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? { ...f, storageUrl, status: 'completed' }
              : f
          )
        );

        toast.success(`${file.name} uploaded successfully`);
      } catch (err) {
        console.error('Error uploading file:', err);
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileId ? { ...f, status: 'error' } : f
          )
        );
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setIsUploading(false);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (file: UploadedFloorplanFile) => {
    try {
      // Delete from storage
      await supabase.storage
        .from('property-documents')
        .remove([file.storagePath]);

      // Delete from database
      await supabase
        .from('space_document')
        .delete()
        .eq('storage_path', file.storagePath);

      // Remove from state
      setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
      toast.success('File deleted');
    } catch (err) {
      console.error('Error deleting file:', err);
      toast.error('Failed to delete file');
    }
  };

  const handleGenerate = async () => {
    if (uploadedFiles.filter(f => f.status === 'completed').length === 0) {
      toast.error('Please upload at least one image or PDF first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Get the URLs of uploaded files
      const fileUrls = uploadedFiles
        .filter(f => f.status === 'completed')
        .map(f => f.storageUrl);

      const { data, error: fnError } = await supabase.functions.invoke('generate-floorplan', {
        body: {
          spaceId: propertyId,
          address,
          propertyName,
          rooms,
          fileUrls,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      console.log('Floor plan response:', data);

      // Handle the response from Tower.dev
      let imageUrl = null;

      if (data?.output?.image_url) {
        imageUrl = data.output.image_url;
      } else if (data?.output?.url) {
        imageUrl = data.output.url;
      } else if (data?.result?.image_url) {
        imageUrl = data.result.image_url;
      } else if (data?.result?.url) {
        imageUrl = data.result.url;
      } else if (data?.image_url) {
        imageUrl = data.image_url;
      } else if (data?.url) {
        imageUrl = data.url;
      } else if (typeof data?.output === 'string' && data.output.startsWith('http')) {
        imageUrl = data.output;
      } else if (typeof data?.result === 'string' && data.result.startsWith('http')) {
        imageUrl = data.result;
      }

      if (imageUrl) {
        setFloorPlanUrl(imageUrl);
        onFloorPlanGenerated?.(imageUrl);
        toast.success('Floor plan generated successfully!');
      } else {
        console.log('Full response for debugging:', JSON.stringify(data, null, 2));
        toast.info('Floor plan request submitted. It may take a moment to generate.');
        setError('Floor plan is being generated. Please try refreshing in a moment.');
      }
    } catch (err) {
      console.error('Error generating floor plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate floor plan');
      toast.error('Failed to generate floor plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (floorPlanUrl) {
      window.open(floorPlanUrl, '_blank');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    return FileText;
  };

  const completedFilesCount = uploadedFiles.filter(f => f.status === 'completed').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <div className="relative bg-card rounded-3xl p-8 border border-border hover:border-primary/30 transition-all duration-300 shadow-airbnb hover:shadow-airbnb-hover">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-coral/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Layers className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-foreground mb-1 flex items-center gap-2">
              AI Floor Plan
              <Sparkles className="w-5 h-5 text-coral" />
            </h3>
            <p className="text-muted-foreground text-sm">
              Upload images or PDFs to generate a professional floor plan
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-muted-foreground mb-6 leading-relaxed">
          Upload property images, blueprints, or PDF documents. Our AI will analyze them to create 
          a detailed architectural floor plan for your listing.
        </p>

        {/* File Upload Area */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-coral hover:bg-coral-light/30 transition-all cursor-pointer group/upload"
          >
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3 group-hover/upload:bg-coral-light transition-colors">
              <Upload className="w-5 h-5 text-muted-foreground group-hover/upload:text-coral transition-colors" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isUploading ? 'Uploading...' : (
                <>Drop images or PDFs here or <span className="text-coral font-medium">browse</span></>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports images and PDF files up to 20MB
            </p>
          </div>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mb-6 space-y-2">
            <h4 className="text-sm font-medium text-foreground">
              Uploaded Files ({completedFilesCount})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {uploadedFiles.map((file) => {
                const FileIcon = getFileIcon(file.fileType);
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-2.5 bg-secondary rounded-xl"
                  >
                    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                      <FileIcon className="w-4 h-4 text-coral" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {file.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {file.status === 'completed' ? 'Ready' : 
                         file.status === 'uploading' ? 'Uploading...' : 'Error'}
                      </p>
                    </div>
                    {file.status === 'uploading' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-coral" />
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file);
                        }}
                        className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Delete file"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Preview Area */}
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative rounded-2xl overflow-hidden bg-secondary aspect-[4/3] flex flex-col items-center justify-center gap-4"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 rounded-full border-4 border-coral/20 border-t-coral"
                />
                <Home className="absolute inset-0 m-auto w-6 h-6 text-coral" />
              </div>
              <div className="text-center">
                <p className="text-foreground font-medium">Generating floor plan...</p>
                <p className="text-muted-foreground text-sm">Analyzing your uploaded files</p>
              </div>
            </motion.div>
          ) : floorPlanUrl ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="relative rounded-2xl overflow-hidden bg-secondary"
            >
              <img
                src={floorPlanUrl}
                alt="Generated floor plan"
                className="w-full h-auto max-h-[400px] object-contain"
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerate}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </Button>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl bg-destructive/10 border border-destructive/20 p-6 text-center"
            >
              <p className="text-destructive text-sm mb-4">{error}</p>
              <Button size="sm" variant="outline" onClick={handleGenerate}>
                Try Again
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Generate Button */}
        <Button
          variant="coral"
          size="lg"
          className="w-full mt-6 group/btn rounded-xl gap-2"
          onClick={handleGenerate}
          disabled={isGenerating || isUploading || completedFilesCount === 0}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Floor Plan
              {completedFilesCount > 0 && (
                <span className="ml-1 text-xs opacity-80">({completedFilesCount} file{completedFilesCount > 1 ? 's' : ''})</span>
              )}
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default FloorPlanGenerator;
