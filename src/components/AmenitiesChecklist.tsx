import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, X, AlertTriangle, HelpCircle,
  Bed, Bath, ChefHat, Sofa, Shirt, Wifi,
  DoorOpen, Trees, Car, Baby, Package, Loader2,
  Upload, Trash2, Plus, Building, Home, Sparkles,
  Dog, Wine, ShieldCheck, ChevronDown, ChevronUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { 
  useSpaceAmenities, 
  AmenityStatus, 
  SpaceAmenity,
  getRoomTypesBySpaceType,
  ROOM_TYPE_LABELS,
  ROOM_DEFAULT_AMENITIES,
  MISC_AMENITIES,
  MISC_CATEGORY_LABELS,
} from '@/hooks/useSpaceAmenities';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

// Room type icon mapping
const ROOM_TYPE_ICONS: Record<string, React.ReactNode> = {
  bedroom: <Bed className="w-5 h-5" />,
  bathroom: <Bath className="w-5 h-5" />,
  kitchen: <ChefHat className="w-5 h-5" />,
  hall: <DoorOpen className="w-5 h-5" />,
  balcony: <Trees className="w-5 h-5" />,
  living_room: <Sofa className="w-5 h-5" />,
  dining_room: <Sofa className="w-5 h-5" />,
  garage: <Car className="w-5 h-5" />,
  laundry: <Shirt className="w-5 h-5" />,
  office: <Wifi className="w-5 h-5" />,
  storage: <Package className="w-5 h-5" />,
  patio: <Trees className="w-5 h-5" />,
  garden: <Trees className="w-5 h-5" />,
  basement: <Home className="w-5 h-5" />,
  attic: <Home className="w-5 h-5" />,
  room: <Building className="w-5 h-5" />,
  lobby: <DoorOpen className="w-5 h-5" />,
  restroom: <Bath className="w-5 h-5" />,
  stage: <Building className="w-5 h-5" />,
  backstage: <Building className="w-5 h-5" />,
  outdoor_area: <Trees className="w-5 h-5" />,
  reception: <DoorOpen className="w-5 h-5" />,
  green_room: <Baby className="w-5 h-5" />,
  dressing_room: <Shirt className="w-5 h-5" />,
};

const MISC_CATEGORY_ICONS: Record<string, React.ReactNode> = {
  parking: <Car className="w-5 h-5" />,
  pets: <Dog className="w-5 h-5" />,
  family: <Baby className="w-5 h-5" />,
  cleaning: <Sparkles className="w-5 h-5" />,
  extras: <Wine className="w-5 h-5" />,
  misc: <ShieldCheck className="w-5 h-5" />,
};

const STATUS_CYCLE: AmenityStatus[] = ['unknown', 'provided', 'not_provided'];

interface AmenitiesChecklistProps {
  spaceId: string;
  onRequiredStatusChange?: (allRequiredProvided: boolean) => void;
}

const AmenitiesChecklist = ({ spaceId, onRequiredStatusChange }: AmenitiesChecklistProps) => {
  const [uploadingAmenityId, setUploadingAmenityId] = useState<string | null>(null);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<{ name: string; required: boolean }[]>([]);
  const [customAmenityName, setCustomAmenityName] = useState('');
  const [expandedRooms, setExpandedRooms] = useState<string[]>([]);
  const [expandedMiscCategories, setExpandedMiscCategories] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch space type
  const { data: spaceData } = useQuery({
    queryKey: ['space-type', spaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('space')
        .select('space_type')
        .eq('id', spaceId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!spaceId,
  });

  const spaceType = spaceData?.space_type || 'property';
  const roomTypes = getRoomTypesBySpaceType(spaceType);

  const {
    amenities,
    rooms,
    miscAmenities,
    isLoading,
    addRoom,
    deleteRoom,
    deleteAmenity,
    toggleMiscAmenity,
    updateAmenityStatus,
    uploadAmenityImage,
    removeAmenityImage,
    isUploading,
    isAddingRoom,
    getNextRoomNumber,
    requiredAmenities,
    allRequiredProvided,
    requiredProgress,
    overallProgress,
  } = useSpaceAmenities(spaceId);

  // Notify parent of required status changes
  useEffect(() => {
    onRequiredStatusChange?.(allRequiredProvided);
  }, [allRequiredProvided, onRequiredStatusChange]);

  // When room type is selected, load default amenities
  useEffect(() => {
    if (selectedRoomType && ROOM_DEFAULT_AMENITIES[selectedRoomType]) {
      setSelectedAmenities([...ROOM_DEFAULT_AMENITIES[selectedRoomType]]);
    } else {
      setSelectedAmenities([]);
    }
  }, [selectedRoomType]);

  const toggleAmenitySelection = (name: string, required: boolean) => {
    const exists = selectedAmenities.find(a => a.name === name);
    if (exists) {
      setSelectedAmenities(prev => prev.filter(a => a.name !== name));
    } else {
      setSelectedAmenities(prev => [...prev, { name, required }]);
    }
  };

  const addCustomAmenity = () => {
    if (!customAmenityName.trim()) return;
    if (selectedAmenities.find(a => a.name === customAmenityName.trim())) return;
    setSelectedAmenities(prev => [...prev, { name: customAmenityName.trim(), required: false }]);
    setCustomAmenityName('');
  };

  const handleAddRoom = () => {
    if (!selectedRoomType || selectedAmenities.length === 0) return;
    addRoom({ roomType: selectedRoomType, amenities: selectedAmenities });
    setIsAddRoomOpen(false);
    setSelectedRoomType('');
    setSelectedAmenities([]);
  };

  const cycleStatus = (amenity: SpaceAmenity) => {
    if (amenity.required) {
      setUploadingAmenityId(amenity.id);
      fileInputRef.current?.click();
      return;
    }
    const currentIndex = STATUS_CYCLE.indexOf(amenity.status);
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];
    updateAmenityStatus({ amenityId: amenity.id, status: nextStatus });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingAmenityId) {
      uploadAmenityImage({ amenityId: uploadingAmenityId, file });
    }
    setUploadingAmenityId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (amenity: SpaceAmenity, e: React.MouseEvent) => {
    e.stopPropagation();
    if (amenity.image_path) {
      removeAmenityImage({ amenityId: amenity.id, imagePath: amenity.image_path });
    }
  };

  const toggleRoom = (key: string) => {
    setExpandedRooms(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleMiscCategory = (category: string) => {
    setExpandedMiscCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const isMiscAmenitySelected = (category: string, name: string) => {
    return miscAmenities.some(a => a.room_type === category && a.name === name);
  };

  const missingRequired = requiredAmenities.filter(a => a.status !== 'provided');
  const presentAmenities = amenities.filter(a => a.status === 'provided');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-6"
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display text-foreground">Rooms & Amenities</h2>
          <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Room
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add a Room</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Room Type</Label>
                  <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            {ROOM_TYPE_ICONS[type] || <Package className="w-4 h-4" />}
                            {ROOM_TYPE_LABELS[type] || type}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedRoomType && (
                    <p className="text-xs text-muted-foreground">
                      Will be created as {ROOM_TYPE_LABELS[selectedRoomType]} #{getNextRoomNumber(selectedRoomType)}
                    </p>
                  )}
                </div>

                {selectedRoomType && (
                  <>
                    <div className="space-y-2">
                      <Label>Amenities (select what this room has)</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                        {(ROOM_DEFAULT_AMENITIES[selectedRoomType] || []).map((amenity) => {
                          const isSelected = selectedAmenities.some(a => a.name === amenity.name);
                          return (
                            <div
                              key={amenity.name}
                              onClick={() => toggleAmenitySelection(amenity.name, amenity.required)}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleAmenitySelection(amenity.name, amenity.required)}
                              />
                              <span className="flex-1">{amenity.name}</span>
                              {amenity.required && (
                                <Badge variant="outline" className="text-xs border-coral/50 text-coral">
                                  Required
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Add Custom Amenity</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., Smart TV"
                          value={customAmenityName}
                          onChange={(e) => setCustomAmenityName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addCustomAmenity()}
                        />
                        <Button type="button" variant="outline" onClick={addCustomAmenity}>
                          Add
                        </Button>
                      </div>
                    </div>

                    {selectedAmenities.length > 0 && (
                      <div className="space-y-2">
                        <Label>Selected ({selectedAmenities.length})</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedAmenities.map((a) => (
                            <Badge
                              key={a.name}
                              variant="secondary"
                              className="gap-1 cursor-pointer hover:bg-destructive/10"
                              onClick={() => toggleAmenitySelection(a.name, a.required)}
                            >
                              {a.name}
                              <X className="w-3 h-3" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleAddRoom}
                      className="w-full"
                      disabled={selectedAmenities.length === 0 || isAddingRoom}
                    >
                      {isAddingRoom ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Add {ROOM_TYPE_LABELS[selectedRoomType]} with {selectedAmenities.length} amenities
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-muted-foreground">
          Add rooms with their amenities. Required items need photo verification.
        </p>
      </div>

      {/* Alert Banners */}
      {missingRequired.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-warning/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-warning mb-1">
                {missingRequired.length} Required Item{missingRequired.length !== 1 ? 's' : ''} Need Verification
              </h3>
              <p className="text-sm text-muted-foreground">
                Upload photos to verify these required amenities before publishing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Cards */}
      {amenities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requiredAmenities.length > 0 && (
            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Required Amenities</span>
                  <span className={cn(
                    "text-sm font-bold",
                    requiredProgress === 100 ? "text-primary" : "text-destructive"
                  )}>
                    {requiredAmenities.filter(a => a.status === 'provided').length}/{requiredAmenities.length}
                  </span>
                </div>
                <Progress 
                  value={requiredProgress} 
                  className={cn(
                    "h-2",
                    requiredProgress === 100 ? "[&>div]:bg-primary" : "[&>div]:bg-destructive"
                  )}
                />
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Overall Progress</span>
                <span className="text-sm font-bold text-coral">
                  {presentAmenities.length}/{amenities.length}
                </span>
              </div>
              <Progress value={overallProgress} className="h-2 [&>div]:bg-coral" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {rooms.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-xl">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No rooms added yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Add rooms to your property with their amenities to help guests know what to expect.
          </p>
          <Button onClick={() => setIsAddRoomOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add First Room
          </Button>
        </div>
      )}

      {/* Rooms List */}
      {rooms.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Rooms</h3>
          {rooms.map((room) => {
            const key = `${room.roomType}-${room.roomNumber}`;
            const isExpanded = expandedRooms.includes(key);
            const roomMissingRequired = room.amenities.filter(a => a.required && a.status !== 'provided');
            
            return (
              <Card key={key} className={cn(
                "border-none shadow-sm overflow-hidden",
                roomMissingRequired.length > 0 && "ring-1 ring-warning/30"
              )}>
                <button
                  onClick={() => toggleRoom(key)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-coral/10 text-coral">
                      {ROOM_TYPE_ICONS[room.roomType] || <Package className="w-5 h-5" />}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {ROOM_TYPE_LABELS[room.roomType] || room.roomType} #{room.roomNumber}
                        </span>
                        {roomMissingRequired.length > 0 && (
                          <Badge variant="outline" className="text-xs border-warning/50 text-warning">
                            {roomMissingRequired.length} need verification
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {room.amenities.length} amenities
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRoom({ roomType: room.roomType, roomNumber: room.roomNumber });
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="px-4 pb-4 border-t border-border/50 space-y-2 pt-4">
                        {room.amenities.map((amenity) => (
                          <div
                            key={amenity.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg",
                              amenity.status === 'provided' ? "bg-primary/10" :
                              amenity.status === 'unknown' ? "bg-warning/10" :
                              amenity.required ? "bg-destructive/10" : "bg-muted/50"
                            )}
                          >
                            <button
                              onClick={() => cycleStatus(amenity)}
                              disabled={isUploading && uploadingAmenityId === amenity.id}
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer",
                                amenity.status === 'provided' ? "bg-primary text-primary-foreground" :
                                amenity.status === 'unknown' ? "bg-warning text-warning-foreground" :
                                "bg-destructive text-destructive-foreground"
                              )}
                            >
                              {isUploading && uploadingAmenityId === amenity.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : amenity.status === 'provided' ? (
                                <Check className="w-4 h-4" />
                              ) : amenity.status === 'unknown' ? (
                                <HelpCircle className="w-4 h-4" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </button>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{amenity.name}</span>
                                {amenity.required && (
                                  <Badge variant="outline" className="text-xs border-coral/50 text-coral">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              {amenity.required && amenity.status !== 'provided' && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Upload className="w-3 h-3" />
                                  Click to upload photo
                                </span>
                              )}
                            </div>
                            
                            {amenity.image_url && (
                              <div className="relative group">
                                <img 
                                  src={amenity.image_url} 
                                  alt={amenity.name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                                <button
                                  onClick={(e) => handleRemoveImage(amenity, e)}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteAmenity(amenity.id)}
                              className="shrink-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      )}

      {/* Miscellaneous Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Property Features</h3>
        <p className="text-sm text-muted-foreground">
          Select additional features and policies for your property.
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(MISC_AMENITIES).map(([category, categoryAmenities]) => {
            const isExpanded = expandedMiscCategories.includes(category);
            const selectedCount = miscAmenities.filter(a => a.room_type === category).length;
            
            return (
              <Card key={category} className="border-none shadow-sm">
                <button
                  onClick={() => toggleMiscCategory(category)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                      {MISC_CATEGORY_ICONS[category] || <Package className="w-5 h-5" />}
                    </div>
                    <div className="text-left">
                      <span className="font-medium text-foreground">
                        {MISC_CATEGORY_LABELS[category] || category}
                      </span>
                      {selectedCount > 0 && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({selectedCount} selected)
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="px-4 pb-4 border-t border-border/50 space-y-2 pt-4">
                        {categoryAmenities.map((amenity) => {
                          const isSelected = isMiscAmenitySelected(category, amenity.name);
                          return (
                            <div
                              key={amenity.name}
                              onClick={() => toggleMiscAmenity(category, amenity.name, amenity.required)}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                                isSelected ? "bg-purple-100" : "hover:bg-muted/50"
                              )}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleMiscAmenity(category, amenity.name, amenity.required)}
                              />
                              <span className="flex-1">{amenity.name}</span>
                              {amenity.required && (
                                <Badge variant="outline" className="text-xs border-coral/50 text-coral">
                                  Required
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default AmenitiesChecklist;
