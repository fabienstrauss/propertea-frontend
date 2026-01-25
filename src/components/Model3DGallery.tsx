import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Loader2, Trash2, Box, Star, Check, Beaker
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import ModelViewer3D from './ModelViewer3D';

interface Model3DGalleryProps {
  spaceId: string;
  showExperimentalBadge?: boolean;
  compact?: boolean;
}

interface Model3D {
  id: string;
  space_id: string;
  file_name: string;
  file_size: number | null;
  storage_url: string;
  storage_path: string | null;
  is_primary: boolean | null;
  display_order: number | null;
  created_at: string | null;
}

const Model3DGallery = ({ spaceId, showExperimentalBadge = false, compact = false }: Model3DGalleryProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model3D | null>(null);

  // Fetch 3D models for this space
  const { data: models = [], isLoading } = useQuery({
    queryKey: ['space-3d-models', spaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('space_3d_model')
        .select('*')
        .eq('space_id', spaceId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Model3D[];
    },
    enabled: !!spaceId,
  });

  // Set default selected model to primary or first model
  const activeModel = selectedModel || models.find(m => m.is_primary) || models[0];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (model: Model3D) => {
      if (model.storage_path) {
        await supabase.storage.from('property-documents').remove([model.storage_path]);
      }
      const { error } = await supabase
        .from('space_3d_model')
        .delete()
        .eq('id', model.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-3d-models', spaceId] });
      toast.success('3D model deleted');
      setSelectedModel(null);
    },
    onError: () => {
      toast.error('Failed to delete model');
    },
  });

  // Set primary mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (modelId: string) => {
      // First, unset all as primary
      await supabase
        .from('space_3d_model')
        .update({ is_primary: false })
        .eq('space_id', spaceId);
      
      // Then set the selected one as primary
      const { error } = await supabase
        .from('space_3d_model')
        .update({ is_primary: true })
        .eq('id', modelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-3d-models', spaceId] });
      toast.success('Primary model updated');
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.glb')) {
        toast.error(`${file.name}: Only .glb files are supported`);
        continue;
      }

      if (file.size > 100 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 100MB)`);
        continue;
      }

      const fileId = uuidv4();
      const storagePath = `${spaceId}/3d-models/${fileId}.glb`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('property-documents')
          .upload(storagePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('property-documents')
          .getPublicUrl(storagePath);

        // Insert into database
        const isPrimary = models.length === 0;
        await supabase.from('space_3d_model').insert({
          space_id: spaceId,
          file_name: file.name,
          file_size: file.size,
          storage_url: urlData.publicUrl,
          storage_path: storagePath,
          is_primary: isPrimary,
          display_order: models.length,
        });

        queryClient.invalidateQueries({ queryKey: ['space-3d-models', spaceId] });
        toast.success(`${file.name} uploaded successfully`);
      } catch (err) {
        console.error('Upload error:', err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Compact view for explore page
  if (compact && models.length > 0 && activeModel) {
    return (
      <div className="rounded-xl overflow-hidden border border-border">
        <ModelViewer3D 
          src={activeModel.storage_url} 
          alt={activeModel.file_name}
          showExperimentalBadge={showExperimentalBadge}
          className="h-[400px]"
        />
      </div>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Box className="w-5 h-5 text-violet-500" />
              3D Scans
            </CardTitle>
            {showExperimentalBadge && (
              <Badge variant="secondary" className="bg-violet-500/10 text-violet-600 border-violet-500/20 gap-1">
                <Beaker className="w-3 h-3" />
                Experimental
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Upload .glb
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Viewer */}
        {activeModel ? (
          <div className="rounded-xl overflow-hidden border border-border bg-muted">
            <ModelViewer3D 
              src={activeModel.storage_url} 
              alt={activeModel.file_name}
              className="h-[350px]"
            />
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-violet-500/30 rounded-xl p-12 text-center cursor-pointer hover:border-violet-500 hover:bg-violet-500/5 transition-all"
          >
            <Box className="w-12 h-12 mx-auto mb-3 text-violet-500/50" />
            <p className="text-foreground font-medium mb-1">No 3D scans yet</p>
            <p className="text-sm text-muted-foreground">Upload .glb files to create an interactive 3D view</p>
          </div>
        )}

        {/* Gallery Grid */}
        {models.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">All Scans ({models.length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <AnimatePresence>
                {models.map((model) => (
                  <motion.div
                    key={model.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`relative group rounded-lg border-2 p-3 cursor-pointer transition-all ${
                      activeModel?.id === model.id 
                        ? 'border-violet-500 bg-violet-500/5' 
                        : 'border-border hover:border-violet-500/50'
                    }`}
                    onClick={() => setSelectedModel(model)}
                  >
                    <div className="flex items-center gap-2">
                      <Box className="w-8 h-8 text-violet-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{model.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {model.file_size ? `${(model.file_size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
                        </p>
                      </div>
                    </div>
                    
                    {model.is_primary && (
                      <Badge className="absolute -top-2 -right-2 bg-violet-500 text-white text-xs px-1.5">
                        <Star className="w-3 h-3" />
                      </Badge>
                    )}
                    
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      {!model.is_primary && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrimaryMutation.mutate(model.id);
                          }}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(model);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Add more button */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border-2 border-dashed border-border p-3 cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all flex flex-col items-center justify-center min-h-[76px]"
              >
                <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Add more</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Model3DGallery;
