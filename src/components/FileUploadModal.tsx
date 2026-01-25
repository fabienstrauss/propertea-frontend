import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Image, Film, CheckCircle2, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFileUploadContext } from '@/contexts/FileUploadContext';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FileUploadModal = ({ isOpen, onClose }: FileUploadModalProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { uploadedFiles, isUploading, uploadFiles, deleteFile } = useFileUploadContext();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadFiles(files);
    }
  }, [uploadFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFiles(files);
    }
  }, [uploadFiles]);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Film;
    return FileText;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-coral" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'AI Processing...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Failed';
      default:
        return status;
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-2xl font-display text-foreground">Upload Documents</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Drag and drop files or click to browse
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Upload Area */}
          <div className="p-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
                ${isDragging 
                  ? 'border-coral bg-coral-light/30' 
                  : 'border-border hover:border-coral/50 hover:bg-secondary/50'
                }
              `}
            >
              <input
                type="file"
                multiple
                accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mov"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className={`
                w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors
                ${isDragging ? 'bg-coral-light' : 'bg-secondary'}
              `}>
                <Upload className={`w-7 h-7 transition-colors ${isDragging ? 'text-coral' : 'text-muted-foreground'}`} />
              </div>
              
              <p className="text-foreground font-medium mb-2">
                {isDragging ? 'Drop files here' : 'Drop files here or click to browse'}
              </p>
              <p className="text-muted-foreground text-sm">
                Supports PDF, images, videos, and text documents (up to 50MB)
              </p>
              
              {/* Supported formats */}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {[
                  { icon: FileText, label: 'PDF' },
                  { icon: Image, label: 'Images' },
                  { icon: Film, label: 'Video' },
                  { icon: FileText, label: 'Text' },
                ].map((format) => (
                  <div 
                    key={format.label}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-xs"
                  >
                    <format.icon className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{format.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-medium text-foreground">Uploaded Files</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {uploadedFiles.map((file) => {
                    const FileIcon = getFileIcon(file.fileType);
                    return (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-3 bg-secondary rounded-xl"
                      >
                        <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                          <FileIcon className="w-5 h-5 text-coral" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {file.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {getStatusText(file.status)}
                          </span>
                          {getStatusIcon(file.status)}
                          <button
                            onClick={() => deleteFile(file.dbId || file.id, file.storagePath)}
                            className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors ml-1"
                            title="Delete file"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-secondary/30">
            <Button variant="outline" onClick={handleClose} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              variant="coral" 
              onClick={handleClose}
              disabled={isUploading || uploadedFiles.length === 0}
              className="rounded-xl"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Done'
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FileUploadModal;
