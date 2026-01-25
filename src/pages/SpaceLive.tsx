import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, MicOff, Video, VideoOff, Phone, MessageSquare, ChevronDown, ChevronUp, Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

const BACKEND_URL = import.meta.env.VITE_REALTIME_BACKEND_URL || "http://localhost:3000";
const WS_URL = BACKEND_URL.replace(/^http/, "ws");

const SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

const SpaceLive = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const [logs, setLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [showTranscription, setShowTranscription] = useState(true);
  const [transcripts, setTranscripts] = useState<{ role: 'user' | 'assistant'; text: string; time: string }[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const videoIntervalRef = useRef<number | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const logMessage = useCallback((message: string) => {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${message}`);
    setLogs((prev) => [...prev.slice(-50), `[${time}] ${message}`]);
  }, []);

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const stopAllAudio = useCallback(() => {
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        /* ignore */
      }
    });
    activeSourcesRef.current = [];
    if (audioContextRef.current) {
      nextPlayTimeRef.current = audioContextRef.current.currentTime;
    }
  }, []);

  const playAudioChunk = useCallback(async (base64Data: string) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;

    const binaryStr = window.atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const int16Data = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 32768.0;
    }

    const buffer = audioContextRef.current.createBuffer(1, float32Data.length, OUTPUT_SAMPLE_RATE);
    buffer.getChannelData(0).set(float32Data);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(gainNodeRef.current);

    source.onended = () => {
      const index = activeSourcesRef.current.indexOf(source);
      if (index > -1) {
        activeSourcesRef.current.splice(index, 1);
      }
    };

    activeSourcesRef.current.push(source);

    const currentTime = audioContextRef.current.currentTime;
    if (nextPlayTimeRef.current < currentTime) {
      nextPlayTimeRef.current = currentTime;
    }

    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += buffer.duration;
  }, []);

  const handleServerMessage = useCallback(
    (msg: any) => {
      // Check for Interruption
      if (msg.serverContent?.interrupted) {
        logMessage("System > Interrupted");
        stopAllAudio();
        return;
      }

      // Capture input transcription (user speech)
      if (msg.serverContent?.inputTranscription?.text) {
        const text = msg.serverContent.inputTranscription.text;
        const time = new Date().toLocaleTimeString();
        setTranscripts(prev => {
          if (prev.length > 0 && prev[prev.length - 1].role === 'user') {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              text: updated[updated.length - 1].text + text
            };
            return updated;
          }
          return [...prev, { role: 'user', text, time }];
        });
      }

      // Capture output transcription (assistant speech)
      if (msg.serverContent?.outputTranscription?.text) {
        const text = msg.serverContent.outputTranscription.text;
        const time = new Date().toLocaleTimeString();
        setTranscripts(prev => {
          if (prev.length > 0 && prev[prev.length - 1].role === 'assistant') {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              text: updated[updated.length - 1].text + text
            };
            return updated;
          }
          return [...prev, { role: 'assistant', text, time }];
        });
      }

      // Audio
      if (msg.serverContent?.modelTurn?.parts) {
        msg.serverContent.modelTurn.parts.forEach((part: any) => {
          if (part.inlineData?.mimeType?.startsWith("audio/pcm")) {
            playAudioChunk(part.inlineData.data);
          }
        });
      }

      // Tool Calls - Show toasts for room/amenity updates
      if (msg.toolCall) {
        logMessage("System > Tool Call Received");
        const functionCalls = msg.toolCall.functionCalls;
        const toolResponses: any[] = [];

        functionCalls.forEach((fn: any) => {
          logMessage(`Function Call: ${fn.name}(${JSON.stringify(fn.args)})`);

          // Show toast for add_room
          if (fn.name === "add_room") {
            const roomType = fn.args.room_type || "room";
            const roomEmojis: Record<string, string> = {
              bedroom: "🛏️",
              bathroom: "🚿",
              kitchen: "🍳",
              living_room: "🛋️",
              dining_room: "🍽️",
              garage: "🚗",
              office: "💼",
              laundry: "🧺",
              outdoor: "🌳",
              main_hall: "🏛️",
              stage_area: "🎭",
              backstage: "🎬",
              green_room: "🌿",
              catering_kitchen: "👨‍🍳",
              bar_area: "🍸",
              vip_lounge: "✨",
              coat_check: "🧥",
              av_booth: "🎛️",
              storage: "📦",
              restroom: "🚻",
              bridal_suite: "👰",
              outdoor_area: "🌺",
            };
            const emoji = roomEmojis[roomType] || "🏠";
            toast.success(`${emoji} New Room Added!`, {
              description: `${roomType.replace(/_/g, " ")} is now being documented`,
              duration: 3000,
            });
          }

          // Show toast for update_amenity
          if (fn.name === "update_amenity") {
            const amenityName = fn.args.amenity_name || "Amenity";
            const status = fn.args.status;
            if (status === "provided") {
              toast.success(`✅ ${amenityName}`, {
                description: "Marked as available",
                duration: 2000,
              });
            } else {
              toast(`❌ ${amenityName}`, {
                description: "Marked as not available",
                duration: 2000,
              });
            }
          }

          if (fn.name === "save_observation") {
            const { label, details } = fn.args;
            logMessage(`📝 SAVED: [${label}] ${details}`);
            toast.info(`👁️ Observation Noted`, {
              description: `${label}: ${details?.substring(0, 50)}...`,
              duration: 2500,
            });
            toolResponses.push({
              id: fn.id,
              name: fn.name,
              response: { status: "recorded", message: "Observation stored." },
            });
          } else {
            toolResponses.push({
              id: fn.id,
              name: fn.name,
              response: { result: "success" },
            });
          }
        });

        if (toolResponses.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              toolResponse: { functionResponses: toolResponses },
            })
          );
        }
      }
    },
    [logMessage, stopAllAudio, playAudioChunk]
  );

  const sendAudioChunk = useCallback((buffer: ArrayBuffer) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const base64Audio = arrayBufferToBase64(buffer);
    wsRef.current.send(
      JSON.stringify({
        realtimeInput: {
          mediaChunks: [{ mimeType: "audio/pcm", data: base64Audio }],
        },
      })
    );
  }, []);

  const startVideoLoop = useCallback(() => {
    if (!videoRef.current) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
      canvasRef.current.width = 640;
      canvasRef.current.height = 480;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    videoIntervalRef.current = window.setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !videoRef.current || isVideoOff) return;

      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      const base64Data = canvasRef.current!.toDataURL("image/jpeg", 0.6).split(",")[1];

      wsRef.current.send(
        JSON.stringify({
          realtimeInput: {
            mediaChunks: [{ mimeType: "image/jpeg", data: base64Data }],
          },
        })
      );
    }, 500);
  }, [isVideoOff]);

  const initializeMedia = useCallback(async () => {
    logMessage("Initializing media...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          width: 640,
          height: 480,
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
      audioContextRef.current = audioContext;

      await audioContext.audioWorklet.addModule("/pcm-processor.js");

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");
      workletNodeRef.current = workletNode;

      source.connect(workletNode);
      workletNode.connect(audioContext.destination);

      const gainNode = audioContext.createGain();
      gainNode.gain.value = 2.5;
      gainNode.connect(audioContext.destination);
      gainNodeRef.current = gainNode;

      logMessage("Media initialized successfully");
      return true;
    } catch (err: any) {
      logMessage("Error accessing media: " + err.message);
      return false;
    }
  }, [logMessage]);

  const startSession = useCallback(async () => {
    setConnectionStatus("connecting");
    logMessage("Starting session...");

    const mediaReady = await initializeMedia();
    if (!mediaReady) {
      setConnectionStatus("disconnected");
      return;
    }

    const wsUrl = `${WS_URL}?spaceId=${id}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("connected");
      logMessage("Connected to server.");
      toast.success("🚀 Connected!", {
        description: "AI assistant is ready to help",
        duration: 3000,
      });
      startVideoLoop();

      if (workletNodeRef.current) {
        workletNodeRef.current.port.onmessage = (event) => {
          if (!isMuted) {
            sendAudioChunk(event.data);
          }
        };
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleServerMessage(msg);
      } catch (e) {
        console.error("Error parsing message:", e);
      }
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
      logMessage("Disconnected from server.");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      logMessage("WebSocket error occurred");
    };
  }, [initializeMedia, startVideoLoop, sendAudioChunk, handleServerMessage, logMessage, isMuted]);

  const stopSession = useCallback(() => {
    stopAllAudio();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }

    setConnectionStatus("disconnected");
    logMessage("Session stopped");
  }, [stopAllAudio, logMessage]);

  useEffect(() => {
    startSession();

    return () => {
      stopSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEndCall = () => {
    stopSession();
    navigate(`/property/v2/${id}`);
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
    logMessage(isMuted ? "Microphone unmuted" : "Microphone muted");
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
    }
    setIsVideoOff(!isVideoOff);
    logMessage(isVideoOff ? "Video enabled" : "Video disabled");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col relative overflow-hidden">
      {/* Futuristic background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-indigo-500/5 to-transparent rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/property/v2/${id}`)}
            className="gap-1 sm:gap-2 text-white/80 hover:text-white hover:bg-white/10 text-xs sm:text-sm"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Back to Property</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 border border-white/10">
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse"
                    : connectionStatus === "connecting"
                    ? "bg-amber-400 shadow-lg shadow-amber-400/50 animate-pulse"
                    : "bg-red-400 shadow-lg shadow-red-400/50"
                }`}
              />
              <span className="text-xs sm:text-sm text-white/90 font-medium">
                {connectionStatus === "connected"
                  ? "Live"
                  : connectionStatus === "connecting"
                  ? "Connecting..."
                  : "Offline"}
              </span>
            </div>
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse hidden sm:block" />
          </div>
        </div>
      </header>

      {/* Main Video Area */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-6 relative z-10">
        <div className="relative w-full max-w-5xl aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-black/50 border border-white/10 shadow-2xl shadow-indigo-500/10">
          {/* Glowing border effect */}
          <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-sm -z-10" />
          
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />

          {isVideoOff && (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
              <div className="text-center">
                <VideoOff className="w-12 h-12 sm:w-16 sm:h-16 text-white/30 mx-auto mb-2" />
                <p className="text-white/40 text-sm">Camera Off</p>
              </div>
            </div>
          )}

          {/* Status indicator */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/10">
            <div
              className={`w-2 h-2 rounded-full ${
                connectionStatus === "connected" 
                  ? "bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse" 
                  : "bg-red-400"
              }`}
            />
            <span className="text-white text-xs font-medium">
              {connectionStatus === "connected" ? "AI Connected" : "Connecting..."}
            </span>
          </div>

          {/* Futuristic corner accents */}
          <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-cyan-400/30 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-cyan-400/30 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-purple-400/30 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-purple-400/30 rounded-br-2xl" />
        </div>
      </div>

      {/* Transcripts Panel - Collapsible */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-3 sm:px-6 mb-3 sm:mb-4">
        <button
          onClick={() => setShowTranscription(!showTranscription)}
          className="flex items-center gap-2 text-white/60 hover:text-white/90 text-xs sm:text-sm mb-2 transition-all duration-300 group"
        >
          {showTranscription ? (
            <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 group-hover:text-cyan-400 transition-colors" />
          ) : (
            <Eye className="w-3 h-3 sm:w-4 sm:h-4 group-hover:text-cyan-400 transition-colors" />
          )}
          <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>{showTranscription ? 'Hide' : 'Show'} Transcription</span>
        </button>
        
        {showTranscription && (
          <div className="bg-black/40 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 max-h-32 sm:max-h-48 overflow-y-auto border border-white/10 shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-medium text-white/70">Live Transcription</span>
            </div>
            {transcripts.length === 0 ? (
              <p className="text-white/40 text-xs sm:text-sm italic">Waiting for conversation...</p>
            ) : (
              <div className="space-y-1.5 sm:space-y-2">
                {transcripts.slice(-10).map((t, i) => (
                  <div 
                    key={i} 
                    className={`text-xs sm:text-sm p-2 rounded-lg ${
                      t.role === 'user' 
                        ? 'bg-cyan-500/10 border-l-2 border-cyan-400' 
                        : 'bg-purple-500/10 border-l-2 border-purple-400'
                    }`}
                  >
                    <span className="text-white/40 text-[10px] sm:text-xs mr-2">{t.time}</span>
                    <span className={`font-semibold ${t.role === 'user' ? 'text-cyan-300' : 'text-purple-300'}`}>
                      {t.role === 'user' ? 'You' : 'AI'}:
                    </span>{' '}
                    <span className="text-white/90">{t.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Debug Logs Panel (Collapsible) */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-3 sm:px-6 mb-3 sm:mb-4">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="flex items-center gap-2 text-white/40 hover:text-white/60 text-[10px] sm:text-xs mb-2 transition-colors"
        >
          {showDebug ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          {showDebug ? 'Hide' : 'Show'} Debug Logs
        </button>
        {showDebug && (
          <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 sm:p-4 max-h-24 sm:max-h-32 overflow-y-auto font-mono text-[10px] sm:text-xs text-white/50 border border-white/5">
            {logs.length === 0 ? (
              <p>Waiting for connection...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="py-0.5">
                  {log}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="relative z-10 border-t border-white/10 bg-black/30 backdrop-blur-xl py-4 sm:py-6">
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <Button
            variant="outline"
            size="lg"
            className={`rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0 border-white/20 transition-all duration-300 ${
              isMuted 
                ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30" 
                : "bg-white/10 text-white hover:bg-white/20 hover:border-cyan-400/50"
            }`}
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className={`rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0 border-white/20 transition-all duration-300 ${
              isVideoOff 
                ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30" 
                : "bg-white/10 text-white hover:bg-white/20 hover:border-cyan-400/50"
            }`}
            onClick={toggleVideo}
          >
            {isVideoOff ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
          </Button>

          <Button 
            variant="destructive" 
            size="lg" 
            className="rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105" 
            onClick={handleEndCall}
          >
            <Phone className="w-4 h-4 sm:w-5 sm:h-5 rotate-[135deg]" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SpaceLive;
