import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Video, FileText, Image, Film, ArrowRight, CheckCircle2, Trash2, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileUploadModal from "./FileUploadModal";
import ProcessingSection from "./ProcessingSection";
import { FileUploadProvider, useFileUploadContext } from "@/contexts/FileUploadContext";

const UploadOptionsSectionContent = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { uploadedFiles, deleteFile } = useFileUploadContext();

  // Mock function to process files
  const handleProcessFiles = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsProcessing(true);
    
    // Get the first file's ID (or all file IDs)
    const fileIds = uploadedFiles.map(f => f.dbId || f.id);
    
    // Mock API call - replace with actual endpoint later
    console.log('Processing files with IDs:', fileIds);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 15000));
      console.log('Processing complete!');
    } catch (error) {
      console.error('Processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  console.log('UploadOptionsSection - uploadedFiles:', uploadedFiles);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Film;
    return FileText;
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-coral-light text-coral text-sm font-medium mb-4">
            How it works
          </span>
          <h2 className="text-4xl md:text-5xl font-display text-foreground mb-6">
            Two ways to add properties
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the method that works best for you. Both paths lead to a beautifully 
            organized property listing.
          </p>
        </motion.div>

        {/* Upload Options Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
        >
          {/* File Upload Card */}
          <motion.div variants={cardVariants} className="group">
            <div className="relative bg-card rounded-3xl p-8 border border-border hover:border-primary/30 transition-all duration-300 shadow-airbnb hover:shadow-airbnb-hover h-full">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7 text-foreground" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-semibold text-foreground mb-3">
                Upload Documents
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Drag and drop your property files. We support PDFs, images, videos, 
                and text documents. Our AI extracts all relevant information automatically.
              </p>

              {/* Supported Formats */}
              <div className="flex flex-wrap gap-2 mb-8">
                {[
                  { icon: FileText, label: "PDF" },
                  { icon: Image, label: "Images" },
                  { icon: Film, label: "Video" },
                  { icon: FileText, label: "Text" },
                ].map((format) => (
                  <div 
                    key={format.label}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm"
                  >
                    <format.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{format.label}</span>
                  </div>
                ))}
              </div>

              {/* Upload Area */}
              <div 
                onClick={() => setIsUploadModalOpen(true)}
                className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-coral hover:bg-coral-light/30 transition-all cursor-pointer group/upload"
              >
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 group-hover/upload:bg-coral-light transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground group-hover/upload:text-coral transition-colors" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Drop files here or <span className="text-coral font-medium">browse</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Up to 50MB per file
                </p>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Session Files ({uploadedFiles.length})</h4>
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
                               file.status === 'processing' ? 'Processing...' : 
                               file.status === 'uploading' ? 'Uploading...' : file.status}
                            </p>
                          </div>
                          {file.status === 'processing' || file.status === 'uploading' ? (
                            <Loader2 className="w-4 h-4 animate-spin text-coral" />
                          ) : (
                            <button
                              onClick={() => deleteFile(file.dbId || file.id, file.storagePath)}
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

              {/* CTA - Process Button */}
              <Button 
                variant="coral" 
                size="lg" 
                className="w-full mt-6 group/btn rounded-xl"
                onClick={handleProcessFiles}
                disabled={uploadedFiles.length === 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Process Files
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>

          {/* Video Call Card */}
          <motion.div variants={cardVariants} className="group">
            <div className="relative bg-card rounded-3xl p-8 border border-border hover:border-coral/30 transition-all duration-300 shadow-airbnb hover:shadow-airbnb-hover h-full">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-coral-light flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Video className="w-7 h-7 text-coral" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-semibold text-foreground mb-3">
                AI Video Call
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Start a video call with our AI agent. Simply talk about your property 
                and show it on camera. Our agent guides you through the entire process.
              </p>

              {/* Features */}
              <div className="space-y-3 mb-8">
                {[
                  "Voice-guided property walkthrough",
                  "Real-time video analysis",
                  "Automatic documentation",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-coral-light flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-coral" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Video Preview Mockup */}
              <div className="relative rounded-2xl overflow-hidden bg-charcoal aspect-video flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/50 to-charcoal/30" />
                
                {/* Animated ring */}
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 w-16 h-16 rounded-full bg-coral/30"
                  />
                  <div className="relative w-16 h-16 rounded-full bg-coral/20 flex items-center justify-center backdrop-blur-sm border border-coral/30">
                    <Video className="w-7 h-7 text-coral" />
                  </div>
                </div>
                
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-primary-foreground text-xs font-medium">Ready to connect</span>
                </div>
              </div>

              {/* CTA */}
              <Button variant="coral" size="lg" className="w-full mt-6 group/btn rounded-xl">
                Start Video Call
                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Upload Modal */}
      <FileUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />

      {/* Processing Section */}
      <ProcessingSection isProcessing={isProcessing} />
    </section>
  );
};

const UploadOptionsSection = () => {
  return (
    <FileUploadProvider>
      <UploadOptionsSectionContent />
    </FileUploadProvider>
  );
};

export default UploadOptionsSection;
