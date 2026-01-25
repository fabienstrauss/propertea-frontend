import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Video, FileText, Image, Film, ArrowRight, CheckCircle2, Trash2, Loader2, ArrowLeft, AlertCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileUploadModal from "@/components/FileUploadModal";
import { FileUploadProvider, useFileUploadContext } from "@/contexts/FileUploadContext";

const BACKEND_URL = import.meta.env.VITE_REALTIME_BACKEND_URL || "http://localhost:3000";

interface Space {
  id: string;
  name?: string;
  space_type: string;
  address?: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

interface Room {
  id: string;
  space_id: string;
  name: string;
  room_type?: string;
}

interface Observation {
  id: string;
  space_id: string;
  label: string;
  details: string;
  created_at: string;
}

interface Document {
  id: string;
  space_id: string;
  file_name: string;
  file_type: string;
  storage_url: string;
}

interface SpaceContext {
  summary: string;
  collected: string[];
  missing: string[];
}

interface SpaceData {
  space: Space;
  rooms: Room[];
  observations: Observation[];
  documents: Document[];
  context: SpaceContext;
}

const SpaceContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [spaceData, setSpaceData] = useState<SpaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { uploadedFiles, deleteFile } = useFileUploadContext();

  useEffect(() => {
    const fetchSpaceContext = async () => {
      if (!id) {
        setError("Invalid space ID");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/spaces/${id}/context`);
        
        if (response.status === 404) {
          setError("Space not found");
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch space data");
        }

        const data = await response.json();
        setSpaceData(data);
      } catch (err) {
        console.error("Error fetching space:", err);
        setError("Failed to load space data");
      } finally {
        setLoading(false);
      }
    };

    fetchSpaceContext();
  }, [id]);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/') || type === 'image') return Image;
    if (type.startsWith('video/') || type === 'video') return Film;
    return FileText;
  };

  const handleGoLive = () => {
    navigate(`/space/${id}/live`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-coral" />
          <p className="text-muted-foreground">Analyzing your space...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">{error}</h2>
          <p className="text-muted-foreground max-w-md">
            The space you're looking for doesn't exist or has been removed.
          </p>
          <Button variant="coral" onClick={() => navigate("/")}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  const context = spaceData?.context;
  const hasCollectedData = (context?.collected?.length || 0) > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <span className="text-sm text-muted-foreground font-mono">
            Space: {id?.slice(0, 8)}...
          </span>
        </div>
      </header>

      <section className="py-16 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-coral-light text-coral text-sm font-medium mb-4">
              Onboarding
            </span>
            <h2 className="text-4xl md:text-5xl font-display text-foreground mb-6">
              Let's finish the onboarding
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {context?.summary || "Add information about your property to create a complete listing."}
            </p>
          </motion.div>

          {/* Progress Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid md:grid-cols-2 gap-6 mb-12"
          >
            {/* Collected Items */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                What we have
              </h3>
              {hasCollectedData ? (
                <ul className="space-y-2">
                  {context?.collected.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No information collected yet. Start by uploading files or going live!</p>
              )}
            </div>

            {/* Missing Items */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Circle className="w-5 h-5 text-coral" />
                What we still need
              </h3>
              <ul className="space-y-2">
                {context?.missing.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Circle className="w-4 h-4 text-coral flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Observations & Documents */}
          {spaceData && (spaceData.observations.length > 0 || spaceData.documents.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-12"
            >
              {spaceData.observations.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Observations ({spaceData.observations.length})
                  </h3>
                  <div className="grid gap-3">
                    {spaceData.observations.slice(0, 5).map((obs) => (
                      <div
                        key={obs.id}
                        className="p-4 bg-card rounded-xl border border-border"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-coral-light flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-coral" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{obs.label}</p>
                            <p className="text-sm text-muted-foreground">{obs.details}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {spaceData.observations.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{spaceData.observations.length - 5} more observations
                      </p>
                    )}
                  </div>
                </div>
              )}

              {spaceData.documents.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Documents ({spaceData.documents.length})
                  </h3>
                  <div className="grid gap-3">
                    {spaceData.documents.slice(0, 5).map((doc) => {
                      const FileIcon = getFileIcon(doc.file_type);
                      return (
                        <div
                          key={doc.id}
                          className="p-4 bg-card rounded-xl border border-border flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                            <FileIcon className="w-5 h-5 text-coral" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">{doc.file_type}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Action Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
              How would you like to continue?
            </h3>
            <p className="text-muted-foreground text-center mb-8">
              Choose the method that works best for you
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Upload Card */}
            <div className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Upload Documents
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Add photos, PDFs, or videos of your property. Our AI will extract all relevant information.
              </p>
              
              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mb-4 space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Session Files ({uploadedFiles.length})</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uploadedFiles.map((file) => {
                      const FileIcon = getFileIcon(file.fileType);
                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-2 p-2 bg-secondary rounded-lg"
                        >
                          <FileIcon className="w-4 h-4 text-coral" />
                          <span className="text-sm text-foreground truncate flex-1">{file.fileName}</span>
                          {file.status === 'processing' || file.status === 'uploading' ? (
                            <Loader2 className="w-4 h-4 animate-spin text-coral" />
                          ) : (
                            <button
                              onClick={() => deleteFile(file.dbId || file.id, file.storagePath)}
                              className="p-1 hover:bg-destructive/10 rounded"
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsUploadModalOpen(true)}
              >
                Upload Files
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Live Card */}
            <div className="bg-card rounded-2xl p-6 border border-coral/30 hover:border-coral/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-coral-light flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-coral" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                AI Video Call
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Start a live session with our AI agent. Show your property on camera and let the AI guide you through.
              </p>
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                AI agent ready
              </div>
              <Button 
                variant="coral" 
                className="w-full"
                onClick={handleGoLive}
              >
                Go Live
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Upload Modal */}
        <FileUploadModal 
          isOpen={isUploadModalOpen} 
          onClose={() => setIsUploadModalOpen(false)} 
        />
      </section>
    </div>
  );
};

const Space = () => {
  return (
    <FileUploadProvider>
      <SpaceContent />
    </FileUploadProvider>
  );
};

export default Space;
