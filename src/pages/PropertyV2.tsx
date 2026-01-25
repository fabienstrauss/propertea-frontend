import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  CheckCircle2,
  Circle,
  MapPin,
  Home,
  DollarSign,
  Users,
  FileText,
  X,
  Video,
  Edit3,
  Save,
  Image as ImageIcon,
  Mic,
  ChevronRight,
  Zap,
  ArrowRight,
  Plus,
  Upload,
  Layers,
  FileUp,
  Trash2,
  Box,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import PropertyImageGallery from "@/components/PropertyImageGallery";
import AmenitiesChecklist from "@/components/AmenitiesChecklist";
import Model3DGallery from "@/components/Model3DGallery";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface Message {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ProgressItem {
  key: string;
  label: string;
  category: string;
  value?: string | number;
}

interface ProgressDetails {
  percent: number;
  completedItems: ProgressItem[];
  remainingItems: ProgressItem[];
}

interface ContinueResponse {
  percent: number;
  messages: { role: string; content: string }[];
  suggestions: string[];
  progress_details?: {
    percent: number;
    completedItems: ProgressItem[];
    remainingItems: ProgressItem[];
  };
}

interface Space {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  status: string | null;
  space_type: string;
  metadata: Record<string, unknown> | null;
}

interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  storageUrl: string;
  storagePath: string;
  status: "uploading" | "completed" | "error";
}

type SpecialMode = null | "zen" | "floorplan" | "3dscan";

const PropertyV2 = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [specialMode, setSpecialMode] = useState<SpecialMode>(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [progress, setProgress] = useState<ProgressDetails | null>(null);
  const [lastExtracted, setLastExtracted] = useState<Record<string, any> | null>(null);
  const [currentAiMessage, setCurrentAiMessage] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingFloorplan, setIsGeneratingFloorplan] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual edit state
  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    description: "",
    city: "",
    state: "",
    zip_code: "",
    bedrooms: "",
    bathrooms: "",
    square_feet: "",
    price: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("basic");

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // Fetch space data
  const {
    data: space,
    isLoading: spaceLoading,
    refetch: refetchSpace,
  } = useQuery({
    queryKey: ["space", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("space")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        navigate("/dashboard");
        return null;
      }
      return data as Space;
    },
    enabled: !!user && !!id,
  });

  // Fetch rooms for floor plan
  const { data: rooms = [] } = useQuery({
    queryKey: ["property-rooms", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("room").select("name, room_type").eq("space_id", id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch floor plan from storage bucket
  const { data: floorPlanUrl, refetch: refetchFloorPlan } = useQuery({
    queryKey: ["space-floorplan-storage", id],
    queryFn: async () => {
      // List files in the uploads folder that match this property ID
      const { data: files, error } = await supabase.storage
        .from("property-documents")
        .list("uploads", {
          search: `${id}_floorplan`,
          sortBy: { column: "created_at", order: "desc" },
        });
      
      if (error) {
        console.error("Error fetching floor plans:", error);
        return null;
      }
      
      // Get the most recent floor plan
      if (files && files.length > 0) {
        const mostRecent = files[0];
        const { data: urlData } = supabase.storage
          .from("property-documents")
          .getPublicUrl(`uploads/${mostRecent.name}`);
        return urlData.publicUrl;
      }
      
      return null;
    },
    enabled: !!id,
  });

  // Initialize form when space loads
  useEffect(() => {
    if (space) {
      const metadata = (space.metadata || {}) as Record<string, unknown>;
      setEditForm({
        name: space.name || "",
        address: space.address || "",
        description: space.description || "",
        city: String(metadata.city || ""),
        state: String(metadata.state || ""),
        zip_code: String(metadata.zip_code || ""),
        bedrooms: String(metadata.bedrooms || ""),
        bathrooms: String(metadata.bathrooms || ""),
        square_feet: String(metadata.square_feet || ""),
        price: String(metadata.price || ""),
      });
    }
  }, [space]);

  // Load conversation on mount
  useEffect(() => {
    if (user && id && space) loadConversation();
  }, [user, id, space]);

  const loadConversation = async () => {
    try {
      const url = `${import.meta.env.VITE_REALTIME_BACKEND_URL}/api/space/${id}/continue`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to load");
      const data: ContinueResponse = await res.json();
      
      // Update progress with data from response
      const progressData = data.progress_details || { percent: data.percent, completedItems: [], remainingItems: [] };
      setProgress({
        percent: progressData.percent,
        completedItems: progressData.completedItems || [],
        remainingItems: progressData.remainingItems || [],
      });
      setSuggestions(data.suggestions || []);
      // Get the last assistant message
      const lastAssistantMsg = data.messages?.filter(m => m.role === "assistant").pop();
      if (lastAssistantMsg) setCurrentAiMessage(lastAssistantMsg.content);
    } catch (error) {
      console.error("Error loading:", error);
    }
  };

  const sendMessage = async (message?: string) => {
    const messageToSend = message || userInput.trim();
    if (!messageToSend || isSending) return;

    setUserInput("");
    setIsSending(true);
    setLastExtracted(null);
    setSuggestions([]);

    const userMsg: Message = { role: "user", content: messageToSend, created_at: new Date().toISOString() };

    try {
      const url = `${import.meta.env.VITE_REALTIME_BACKEND_URL}/api/space/${id}/continue`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          userMessage: messageToSend,
          uploadedFiles,
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      const data: ContinueResponse = await res.json();
      
      // Get the last assistant message
      const lastAssistantMsg = data.messages?.filter(m => m.role === "assistant").pop();
      if (lastAssistantMsg) {
        const aiMsg: Message = { role: "assistant", content: lastAssistantMsg.content, created_at: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg, aiMsg]);
        setCurrentAiMessage(lastAssistantMsg.content);
      }
      
      // Update progress with data from response
      const progressData = data.progress_details || { percent: data.percent, completedItems: [], remainingItems: [] };
      setProgress({
        percent: progressData.percent,
        completedItems: progressData.completedItems || [],
        remainingItems: progressData.remainingItems || [],
      });
      setSuggestions(data.suggestions || []);
      
      // Refetch space data to get any updates
      refetchSpace();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsSending(false);
    }
  };

  // File upload handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const isFloorplan = specialMode === "floorplan";
    const is3DScan = specialMode === "3dscan";

    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      const isVideo = file.type.startsWith("video/");
      const isGlb = file.name.toLowerCase().endsWith(".glb");

      if (isFloorplan && !isImage && !isPdf) {
        toast.error(`${file.name}: Floor plans require images or PDFs`);
        continue;
      }

      if (is3DScan && !isGlb) {
        toast.error(`${file.name}: Only .glb files are supported for 3D scans`);
        continue;
      }

      const maxSize = is3DScan ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max ${is3DScan ? "100MB" : "50MB"})`);
        continue;
      }

      const fileId = uuidv4();
      const fileExtension = file.name.split(".").pop();
      const folder = is3DScan ? "3d-models" : isFloorplan ? "floorplan" : "documents";
      const storagePath = `${id}/${folder}/${fileId}.${fileExtension}`;

      const newFile: UploadedFile = {
        id: fileId,
        fileName: file.name,
        fileType: file.type,
        storageUrl: "",
        storagePath,
        status: "uploading",
      };
      setUploadedFiles((prev) => [...prev, newFile]);

      try {
        const { error: uploadError } = await supabase.storage
          .from("property-documents")
          .upload(storagePath, file, { cacheControl: "3600", upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("property-documents").getPublicUrl(storagePath);

        // Insert into appropriate table based on file type
        if (is3DScan) {
          await supabase.from("space_3d_model").insert([
            {
              space_id: id!,
              file_name: file.name,
              file_size: file.size,
              storage_url: urlData.publicUrl,
              storage_path: storagePath,
            },
          ]);
        } else {
          await supabase.from("space_document").insert([
            {
              space_id: id!,
              file_name: file.name,
              file_type: isImage ? "image" : isPdf ? "pdf" : isVideo ? "video" : "document",
              mime_type: file.type,
              file_size: file.size,
              storage_url: urlData.publicUrl,
              storage_path: storagePath,
              processing_status: "pending" as const,
              is_floorplan_related_doc: isFloorplan,
            },
          ]);
        }

        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, storageUrl: urlData.publicUrl, status: "completed" } : f)),
        );
        toast.success(`${file.name} uploaded`);
      } catch (err) {
        console.error("Upload error:", err);
        setUploadedFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "error" } : f)));
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteFile = async (file: UploadedFile) => {
    try {
      await supabase.storage.from("property-documents").remove([file.storagePath]);
      await supabase.from("space_document").delete().eq("storage_path", file.storagePath);
      setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id));
      toast.success("File deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleGenerateFloorplan = async () => {
    const completedFiles = uploadedFiles.filter((f) => f.status === "completed");
    if (completedFiles.length === 0) {
      toast.error("Upload at least one image first");
      return;
    }

    setIsGeneratingFloorplan(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-floorplan", {
        body: {
          spaceId: id,
          address: space?.address,
          propertyName: space?.name,
          rooms,
          fileUrls: completedFiles.map((f) => f.storageUrl),
        },
      });

      if (error) throw error;
      toast.success("Floor plan generation started!");
      setSpecialMode(null);
      setUploadedFiles([]);
    } catch (err) {
      console.error("Floor plan error:", err);
      toast.error("Failed to generate floor plan");
    } finally {
      setIsGeneratingFloorplan(false);
    }
  };

  const handleZenModeProcess = async () => {
    const completedFiles = uploadedFiles.filter((f) => f.status === "completed");
    if (completedFiles.length === 0) {
      toast.error("Upload at least one file first");
      return;
    }

    // Send to continue API with file context
    const fileContext = `I've uploaded ${completedFiles.length} file(s): ${completedFiles.map((f) => f.fileName).join(", ")}. Please analyze them and extract any property information.`;
    await sendMessage(fileContext);
    setSpecialMode(null);
    setUploadedFiles([]);
  };

  const saveChanges = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("space")
        .update({
          name: editForm.name,
          address: editForm.address,
          description: editForm.description,
          metadata: {
            ...(space?.metadata || {}),
            city: editForm.city,
            state: editForm.state,
            zip_code: editForm.zip_code,
            bedrooms: editForm.bedrooms ? parseInt(editForm.bedrooms) : null,
            bathrooms: editForm.bathrooms ? parseFloat(editForm.bathrooms) : null,
            square_feet: editForm.square_feet ? parseInt(editForm.square_feet) : null,
            price: editForm.price ? parseFloat(editForm.price) : null,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      toast.success("Saved!");
      refetchSpace();
      loadConversation();
    } catch (error) {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || spaceLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-coral" />
      </div>
    );
  }

  if (!space) return null;
  const completedFilesCount = uploadedFiles.filter((f) => f.status === "completed").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{space.name}</h1>
              <p className="text-sm text-muted-foreground">Property onboarding</p>
            </div>
          </div>

          <Button
            onClick={() => navigate(`/property/${id}/live`)}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white gap-2 shadow-lg shadow-violet-500/25"
          >
            <Video className="w-4 h-4" />
            <span className="hidden sm:inline">Go Live</span>
            <Mic className="w-3 h-3 animate-pulse" />
          </Button>
        </div>

        {/* Progress Ring */}
        {progress && (
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${progress.percent * 3.52} 352`}
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">{progress.percent}%</span>
                <span className="text-xs text-muted-foreground">complete</span>
              </div>
            </div>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-muted rounded-full p-1">
            <button
              onClick={() => {
                setMode("ai");
                setSpecialMode(null);
              }}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                mode === "ai"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              AI Guide
            </button>
            <button
              onClick={() => {
                setMode("manual");
                setSpecialMode(null);
              }}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                mode === "manual"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Edit3 className="w-4 h-4 inline mr-2" />
              Summary
            </button>
          </div>
        </div>

        {/* AI Guide Mode */}
        {mode === "ai" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={
                specialMode === "floorplan"
                  ? "image/*,.pdf"
                  : specialMode === "3dscan"
                    ? ".glb"
                    : "image/*,.pdf,video/*"
              }
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Special Mode: Zen or Floor Plan - Completely different UI */}
            {specialMode ? (
              <div
                className={`rounded-3xl border-2 overflow-hidden shadow-xl transition-all ${
                  specialMode === "zen"
                    ? "border-coral/50 bg-gradient-to-br from-coral/5 to-orange-500/5"
                    : specialMode === "3dscan"
                      ? "border-emerald-500/50 bg-gradient-to-br from-emerald-500/5 to-teal-500/5"
                      : "border-violet-500/50 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5"
                }`}
              >
                {/* Header */}
                <div
                  className={`px-6 py-4 border-b ${
                    specialMode === "zen"
                      ? "border-coral/20"
                      : specialMode === "3dscan"
                        ? "border-emerald-500/20"
                        : "border-violet-500/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          specialMode === "zen"
                            ? "bg-coral/20"
                            : specialMode === "3dscan"
                              ? "bg-emerald-500/20"
                              : "bg-violet-500/20"
                        }`}
                      >
                        {specialMode === "zen" ? (
                          <FileUp className="w-5 h-5 text-coral" />
                        ) : specialMode === "3dscan" ? (
                          <Box className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Layers className="w-5 h-5 text-violet-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {specialMode === "zen"
                            ? "Zen Mode"
                            : specialMode === "3dscan"
                              ? "3D Scan Upload"
                              : "Floor Plan Generator"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {specialMode === "zen"
                            ? "Upload files and let AI extract everything"
                            : specialMode === "3dscan"
                              ? "Upload .glb files for 3D viewing"
                              : "Upload images to generate a floor plan"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSpecialMode(null);
                        setUploadedFiles([]);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4 mr-1" /> Exit
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Drop Zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      specialMode === "zen"
                        ? "border-coral/30 hover:border-coral hover:bg-coral/5"
                        : specialMode === "3dscan"
                          ? "border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/5"
                          : "border-violet-500/30 hover:border-violet-500 hover:bg-violet-500/5"
                    }`}
                  >
                    <Upload
                      className={`w-10 h-10 mx-auto mb-3 ${
                        specialMode === "zen"
                          ? "text-coral/50"
                          : specialMode === "3dscan"
                            ? "text-emerald-500/50"
                            : "text-violet-500/50"
                      }`}
                    />
                    <p className="text-foreground font-medium mb-1">
                      {isUploading ? "Uploading..." : "Drop files here or click to browse"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {specialMode === "zen"
                        ? "PDFs, images, videos up to 50MB"
                        : specialMode === "3dscan"
                          ? ".glb 3D files up to 100MB"
                          : "Images or PDFs up to 20MB"}
                    </p>
                  </div>

                  {/* Uploaded Files */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-3 bg-background/50 rounded-xl border border-border"
                        >
                          {specialMode === "3dscan" ? (
                            <Box className="w-5 h-5 flex-shrink-0 text-emerald-500" />
                          ) : (
                            <ImageIcon
                              className={`w-5 h-5 flex-shrink-0 ${specialMode === "zen" ? "text-coral" : "text-violet-500"}`}
                            />
                          )}
                          <span className="text-sm text-foreground truncate flex-1">{file.fileName}</span>
                          {file.status === "uploading" ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : file.status === "completed" ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <button
                                onClick={() => handleDeleteFile(file)}
                                className="p-1 hover:bg-destructive/10 rounded"
                              >
                                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-destructive">Error</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Optional Context - hide for 3D scan */}
                  {specialMode !== "3dscan" && (
                    <Textarea
                      ref={textareaRef}
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder={
                        specialMode === "zen"
                          ? "Optional: Add any context about these files..."
                          : "Optional: Describe the property layout..."
                      }
                      className="mt-4 min-h-[80px] rounded-xl bg-background/50 border-border resize-none"
                      disabled={isSending || isGeneratingFloorplan}
                    />
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={() => {
                      if (specialMode === "3dscan") {
                        // 3D scan uploads go directly to the gallery, just exit
                        setSpecialMode(null);
                        setUploadedFiles([]);
                        toast.success("3D models uploaded! View them in the gallery below.");
                      } else if (specialMode === "floorplan") {
                        handleGenerateFloorplan();
                      } else {
                        handleZenModeProcess();
                      }
                    }}
                    disabled={completedFilesCount === 0 || isUploading || isGeneratingFloorplan || isSending}
                    className={`w-full mt-4 h-12 text-base ${
                      specialMode === "zen"
                        ? "bg-coral hover:bg-coral/90"
                        : specialMode === "3dscan"
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-violet-600 hover:bg-violet-700"
                    }`}
                  >
                    {isGeneratingFloorplan || isSending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Processing...
                      </>
                    ) : specialMode === "floorplan" ? (
                      <>
                        <Layers className="w-5 h-5 mr-2" /> Generate Floor Plan
                      </>
                    ) : specialMode === "3dscan" ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" /> Done Uploading
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" /> Process with AI
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* Normal AI Assistant Mode */
              <div className="rounded-3xl border border-border bg-card shadow-lg">
                {/* Content container */}
                <div>
                  {/* AI Header */}
                  <div className="px-6 py-5 border-b border-border">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-background" />
                        </div>
                        {/* Online indicator */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-card" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">Ms. T</h3>
                        <p className="text-sm text-muted-foreground">Your property assistant</p>
                      </div>
                      {isSending && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span className="text-xs font-medium">Thinking...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Message */}
                  <div className="px-6 py-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentAiMessage}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-lg text-foreground leading-relaxed"
                      >
                        {currentAiMessage || "Hey! Let's get your property set up. What would you like to start with?"}
                      </motion.div>
                    </AnimatePresence>

                    {/* Extracted Data Toast */}
                    <AnimatePresence>
                      {lastExtracted && Object.keys(lastExtracted).length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Got it! Updated {Object.keys(lastExtracted).join(", ")}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Dynamic Suggestions from AI */}
                  {suggestions.length > 0 && (
                    <div className="px-6 pb-4">
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => sendMessage(suggestion)}
                            disabled={isSending}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="px-6 pb-6">
                    <div className="flex gap-2 items-center p-1.5 rounded-2xl bg-muted border border-border">
                      {/* Plus Menu */}
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`rounded-xl transition-all ${showPlusMenu ? "bg-foreground text-background hover:bg-foreground/90" : "hover:bg-background"}`}
                          onClick={() => setShowPlusMenu(!showPlusMenu)}
                        >
                          <Plus className={`w-5 h-5 transition-transform duration-200 ${showPlusMenu ? "rotate-45" : ""}`} />
                        </Button>

                        <AnimatePresence>
                          {showPlusMenu && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute bottom-full left-0 mb-2 bg-card rounded-xl border border-border shadow-xl p-1.5 min-w-[200px] z-10"
                            >
                              <button
                                onClick={() => {
                                  setSpecialMode("zen");
                                  setShowPlusMenu(false);
                                }}
                                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                              >
                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                  <FileUp className="w-4 h-4 text-foreground" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">Zen Mode</p>
                                  <p className="text-xs text-muted-foreground">Bulk upload & process</p>
                                </div>
                              </button>
                              <button
                                onClick={() => {
                                  setSpecialMode("floorplan");
                                  setShowPlusMenu(false);
                                }}
                                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                              >
                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                  <Layers className="w-4 h-4 text-foreground" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">Floor Plan</p>
                                  <p className="text-xs text-muted-foreground">Generate from images</p>
                                </div>
                              </button>
                              <button
                                onClick={() => {
                                  setSpecialMode("3dscan");
                                  setShowPlusMenu(false);
                                }}
                                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                              >
                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                  <Box className="w-4 h-4 text-foreground" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">3D Scan</p>
                                  <p className="text-xs text-muted-foreground">Upload .glb models</p>
                                </div>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Text Input */}
                      <Input
                        ref={inputRef}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Type your answer..."
                        className="flex-1 h-10 rounded-xl bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                        disabled={isSending}
                      />

                      <Button
                        onClick={() => sendMessage()}
                        disabled={!userInput.trim() || isSending}
                        className="h-10 w-10 rounded-xl"
                        variant="coral"
                      >
                        {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* What's Done / What's Left */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <h4 className="font-semibold text-foreground">Completed</h4>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {(progress?.completedItems.length || 0) + (floorPlanUrl ? 1 : 0)}
                  </span>
                </div>
                <div className="space-y-2">
                  {progress?.completedItems.map((item) => (
                    <div key={item.key} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="text-foreground font-medium truncate max-w-[120px]">
                        {item.value || "✓"}
                      </span>
                    </div>
                  ))}
                  {floorPlanUrl && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Layers className="w-3 h-3 text-violet-500" />
                        Floor Plan
                      </span>
                      <span className="text-green-500 font-medium">✓</span>
                    </div>
                  )}
                  {progress?.completedItems.length === 0 && !floorPlanUrl && (
                    <p className="text-sm text-muted-foreground italic">Nothing yet - let's get started!</p>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Circle className="w-5 h-5 text-muted-foreground" />
                  <h4 className="font-semibold text-foreground">Remaining</h4>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {(progress?.remainingItems.length || 0) + (floorPlanUrl ? 0 : 1)}+
                  </span>
                </div>
                <div className="space-y-2">
                  {progress?.remainingItems.slice(0, 5).map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        setUserInput(`My ${item.label.toLowerCase()} is `);
                        inputRef.current?.focus();
                      }}
                      className="w-full flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <span className="text-muted-foreground group-hover:text-foreground">{item.label}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-coral" />
                    </button>
                  ))}
                  {!floorPlanUrl && (
                    <button
                      onClick={() => setSpecialMode("floorplan")}
                      className="w-full flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <span className="text-muted-foreground group-hover:text-foreground flex items-center gap-2">
                        <Layers className="w-3 h-3 text-violet-500" />
                        Floor Plan
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-violet-500" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Live Session CTA */}
            <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-2xl border border-violet-500/20 p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg">
                  <Video className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">Prefer to show, not type?</h4>
                  <p className="text-sm text-muted-foreground">
                    Start a live video session and walk through your property with AI
                  </p>
                </div>
                <Button
                  onClick={() => navigate(`/property/${id}/live`)}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white"
                >
                  Start Live <Mic className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* 3D Models Gallery in AI Mode */}
            <Model3DGallery spaceId={id!} showExperimentalBadge />

            {/* Floor Plan Display in AI Mode */}
            {floorPlanUrl && (
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                  <Layers className="w-5 h-5 text-violet-500" />
                  <span className="font-semibold text-foreground">Floor Plan</span>
                  <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                </div>
                <div className="p-6">
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <img
                      src={floorPlanUrl}
                      alt="Property floor plan"
                      className="w-full h-auto max-h-[300px] object-contain bg-secondary"
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Manual Edit Mode */}
        {mode === "manual" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {[
              { id: "basic", icon: Home, label: "Basic Info", fields: ["name", "address"] },
              { id: "location", icon: MapPin, label: "Location", fields: ["city", "state", "zip_code"] },
              { id: "details", icon: Users, label: "Details", fields: ["bedrooms", "bathrooms", "square_feet"] },
              { id: "pricing", icon: DollarSign, label: "Pricing", fields: ["price"] },
            ].map((section) => (
              <div key={section.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <section.icon className="w-5 h-5 text-coral" />
                    <span className="font-semibold text-foreground">{section.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {section.fields.every((f) => editForm[f as keyof typeof editForm]) && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    <ChevronRight
                      className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === section.id ? "rotate-90" : ""}`}
                    />
                  </div>
                </button>

                <AnimatePresence>
                  {expandedSection === section.id && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-2 space-y-4">
                        {section.id === "basic" && (
                          <>
                            <div>
                              <label className="text-sm text-muted-foreground mb-1.5 block">Property Name</label>
                              <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                                placeholder="Sunny Beach House"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground mb-1.5 block">Address</label>
                              <Input
                                value={editForm.address}
                                onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                                placeholder="123 Main Street"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground mb-1.5 block">Description</label>
                              <Textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                                placeholder="Describe your property..."
                                className="min-h-[100px]"
                              />
                            </div>
                          </>
                        )}
                        {section.id === "location" && (
                          <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                              <label className="text-sm text-muted-foreground mb-1.5 block">City</label>
                              <Input
                                value={editForm.city}
                                onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}
                                placeholder="San Francisco"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground mb-1.5 block">State</label>
                              <Input
                                value={editForm.state}
                                onChange={(e) => setEditForm((p) => ({ ...p, state: e.target.value }))}
                                placeholder="CA"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground mb-1.5 block">ZIP Code</label>
                              <Input
                                value={editForm.zip_code}
                                onChange={(e) => setEditForm((p) => ({ ...p, zip_code: e.target.value }))}
                                placeholder="94102"
                              />
                            </div>
                          </div>
                        )}
                        {section.id === "details" && (
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="text-sm text-muted-foreground mb-1.5 block">Bedrooms</label>
                              <Input
                                type="number"
                                value={editForm.bedrooms}
                                onChange={(e) => setEditForm((p) => ({ ...p, bedrooms: e.target.value }))}
                                placeholder="3"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground mb-1.5 block">Bathrooms</label>
                              <Input
                                type="number"
                                step="0.5"
                                value={editForm.bathrooms}
                                onChange={(e) => setEditForm((p) => ({ ...p, bathrooms: e.target.value }))}
                                placeholder="2"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground mb-1.5 block">Sq. Feet</label>
                              <Input
                                type="number"
                                value={editForm.square_feet}
                                onChange={(e) => setEditForm((p) => ({ ...p, square_feet: e.target.value }))}
                                placeholder="1500"
                              />
                            </div>
                          </div>
                        )}
                        {section.id === "pricing" && (
                          <div>
                            <label className="text-sm text-muted-foreground mb-1.5 block">Price per Night ($)</label>
                            <Input
                              type="number"
                              value={editForm.price}
                              onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))}
                              placeholder="150"
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            <div className="flex justify-end">
              <Button onClick={saveChanges} disabled={isSaving} variant="coral" className="gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            </div>

            {/* Photos Section */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === "photos" ? null : "photos")}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-coral" />
                  <span className="font-semibold text-foreground">Photos</span>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === "photos" ? "rotate-90" : ""}`}
                />
              </button>
              <AnimatePresence>
                {expandedSection === "photos" && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6">
                      <PropertyImageGallery spaceId={id!} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Amenities Section */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === "amenities" ? null : "amenities")}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-coral" />
                  <span className="font-semibold text-foreground">Amenities</span>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === "amenities" ? "rotate-90" : ""}`}
                />
              </button>
              <AnimatePresence>
                {expandedSection === "amenities" && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6">
                      <AmenitiesChecklist spaceId={id!} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3D Scans Section */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === "3dscans" ? null : "3dscans")}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Box className="w-5 h-5 text-emerald-500" />
                  <span className="font-semibold text-foreground">3D Scans</span>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === "3dscans" ? "rotate-90" : ""}`}
                />
              </button>
              <AnimatePresence>
                {expandedSection === "3dscans" && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6">
                      <Model3DGallery spaceId={id!} showExperimentalBadge />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Floor Plan Section */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === "floorplan" ? null : "floorplan")}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-5 h-5 text-violet-500" />
                  <span className="font-semibold text-foreground">Floor Plan</span>
                </div>
                <div className="flex items-center gap-2">
                  {floorPlanUrl ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Remaining</span>
                  )}
                  <ChevronRight
                    className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === "floorplan" ? "rotate-90" : ""}`}
                  />
                </div>
              </button>
              <AnimatePresence>
                {expandedSection === "floorplan" && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6">
                      {floorPlanUrl ? (
                        <div className="space-y-4">
                          <div className="relative rounded-xl overflow-hidden border border-border group">
                            <img
                              src={floorPlanUrl}
                              alt="Property floor plan"
                              className="w-full h-auto max-h-[400px] object-contain bg-secondary"
                            />
                          </div>
                          <p className="text-sm text-muted-foreground text-center">
                            Floor plan generated successfully
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 flex flex-col items-center justify-center gap-4 text-center">
                          <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center">
                            <Layers className="w-8 h-8 text-violet-500/50" />
                          </div>
                          <div>
                            <p className="text-muted-foreground font-medium">No floor plan yet</p>
                            <p className="text-sm text-muted-foreground/70 mt-1">
                              Use the Floor Plan generator in AI Guide mode to create one
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setMode("ai");
                              setSpecialMode("floorplan");
                            }}
                            className="mt-2"
                          >
                            <Layers className="w-4 h-4 mr-2" />
                            Generate Floor Plan
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Completion State */}
        {progress?.percent === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20 p-8 text-center"
          >
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">All Done!</h3>
            <p className="text-muted-foreground mb-6">Your property is ready to be published</p>
            <Button onClick={() => navigate(`/property/${id}`)} variant="coral" size="lg">
              View Property <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default PropertyV2;
