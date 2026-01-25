import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AmenityStatus = 'provided' | 'not_provided' | 'unknown';

export interface SpaceAmenity {
  id: string;
  space_id: string;
  room_type: string;
  room_number: number;
  name: string;
  status: AmenityStatus;
  required: boolean;
  image_url: string | null;
  image_path: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Room types by space type
export const PROPERTY_ROOM_TYPES = [
  'bedroom',
  'bathroom',
  'kitchen',
  'living_room',
  'dining_room',
  'hall',
  'balcony',
  'garage',
  'laundry',
  'office',
  'storage',
  'patio',
  'garden',
  'basement',
  'attic',
] as const;

export const EVENT_SPACE_ROOM_TYPES = [
  'hall',
  'room',
  'lobby',
  'restroom',
  'kitchen',
  'stage',
  'backstage',
  'storage',
  'outdoor_area',
  'reception',
  'green_room',
  'dressing_room',
] as const;

export type PropertyRoomType = typeof PROPERTY_ROOM_TYPES[number];
export type EventSpaceRoomType = typeof EVENT_SPACE_ROOM_TYPES[number];

// Display names for room types
export const ROOM_TYPE_LABELS: Record<string, string> = {
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  kitchen: 'Kitchen',
  hall: 'Hall',
  balcony: 'Balcony',
  living_room: 'Living Room',
  dining_room: 'Dining Room',
  garage: 'Garage',
  laundry: 'Laundry',
  office: 'Office',
  storage: 'Storage',
  patio: 'Patio',
  garden: 'Garden',
  basement: 'Basement',
  attic: 'Attic',
  room: 'Room',
  lobby: 'Lobby',
  restroom: 'Restroom',
  stage: 'Stage',
  backstage: 'Backstage',
  outdoor_area: 'Outdoor Area',
  reception: 'Reception',
  green_room: 'Green Room',
  dressing_room: 'Dressing Room',
  // Misc categories
  parking: 'Parking',
  pets: 'Pets',
  family: 'Family',
  cleaning: 'Cleaning',
  extras: 'Extras',
  misc: 'Miscellaneous',
};

// Default amenities for each room type (property)
export const ROOM_DEFAULT_AMENITIES: Record<string, { name: string; required: boolean }[]> = {
  bedroom: [
    { name: 'Bed', required: true },
    { name: 'Bed linens', required: true },
    { name: 'Pillows', required: true },
    { name: 'Wardrobe / closet', required: false },
    { name: 'Hangers', required: false },
    { name: 'Blackout curtains', required: false },
    { name: 'Nightstands', required: false },
    { name: 'Reading lamp', required: false },
    { name: 'Air conditioning', required: false },
    { name: 'Heating', required: false },
  ],
  bathroom: [
    { name: 'Shower / Bathtub', required: true },
    { name: 'Hot water', required: true },
    { name: 'Towels', required: true },
    { name: 'Toilet paper', required: true },
    { name: 'Soap', required: true },
    { name: 'Shampoo', required: false },
    { name: 'Hair dryer', required: false },
    { name: 'First aid kit', required: false },
  ],
  kitchen: [
    { name: 'Refrigerator', required: true },
    { name: 'Stove / cooktop', required: true },
    { name: 'Microwave', required: false },
    { name: 'Coffee maker', required: false },
    { name: 'Kettle', required: false },
    { name: 'Pots and pans', required: true },
    { name: 'Dishes and cutlery', required: true },
    { name: 'Glasses and mugs', required: false },
  ],
  living_room: [
    { name: 'Sofa', required: false },
    { name: 'TV', required: false },
    { name: 'Streaming services', required: false },
    { name: 'Air conditioning', required: false },
    { name: 'Heating', required: false },
  ],
  dining_room: [
    { name: 'Dining table', required: false },
    { name: 'Dining chairs', required: false },
  ],
  hall: [
    { name: 'Coat rack', required: false },
    { name: 'Shoe storage', required: false },
  ],
  balcony: [
    { name: 'Outdoor furniture', required: false },
    { name: 'Plants', required: false },
  ],
  garage: [
    { name: 'Parking space', required: false },
    { name: 'EV charger', required: false },
  ],
  laundry: [
    { name: 'Washing machine', required: false },
    { name: 'Dryer', required: false },
    { name: 'Iron', required: false },
    { name: 'Ironing board', required: false },
  ],
  office: [
    { name: 'Desk', required: false },
    { name: 'Office chair', required: false },
    { name: 'Wi-Fi', required: true },
  ],
  storage: [
    { name: 'Shelving', required: false },
  ],
  patio: [
    { name: 'Outdoor furniture', required: false },
    { name: 'BBQ grill', required: false },
  ],
  garden: [
    { name: 'Garden furniture', required: false },
  ],
  basement: [
    { name: 'Storage space', required: false },
  ],
  attic: [
    { name: 'Storage space', required: false },
  ],

  // Default amenities for event-space room types
  room: [
    { name: 'Seating', required: false },
    { name: 'Tables', required: false },
    { name: 'Lighting', required: false },
    { name: 'Power outlets', required: false },
    { name: 'Sound system / speakers', required: false },
    { name: 'Microphone', required: false },
    { name: 'Wi-Fi', required: false },
    { name: 'Heating', required: false },
    { name: 'Air conditioning', required: false },
  ],
  lobby: [
    { name: 'Reception / welcome desk', required: false },
    { name: 'Seating area', required: false },
    { name: 'Coat rack / coat check', required: false },
    { name: 'Signage', required: false },
    { name: 'Wi-Fi', required: false },
  ],
  restroom: [
    { name: 'Toilet', required: true },
    { name: 'Sink', required: true },
    { name: 'Hand soap', required: true },
    { name: 'Toilet paper', required: true },
    { name: 'Hand towels / paper towels', required: true },
    { name: 'Mirror', required: false },
  ],
  stage: [
    { name: 'Stage lighting', required: false },
    { name: 'Sound system / PA', required: false },
    { name: 'Microphones', required: false },
    { name: 'Backdrop', required: false },
    { name: 'Power outlets', required: false },
  ],
  backstage: [
    { name: 'Access control (staff only)', required: false },
    { name: 'Mirrors', required: false },
    { name: 'Clothing rack / hangers', required: false },
    { name: 'Power outlets', required: false },
    { name: 'Seating', required: false },
  ],
  outdoor_area: [
    { name: 'Outdoor seating', required: false },
    { name: 'Outdoor lighting', required: false },
    { name: 'Weather cover / shade', required: false },
    { name: 'Power outlets', required: false },
  ],
  reception: [
    { name: 'Check-in table', required: false },
    { name: 'Queue / stanchions', required: false },
    { name: 'Signage', required: false },
    { name: 'Wi-Fi', required: false },
  ],
  green_room: [
    { name: 'Seating', required: false },
    { name: 'Mirror', required: false },
    { name: 'Water', required: false },
    { name: 'Power outlets', required: false },
  ],
  dressing_room: [
    { name: 'Full-length mirror', required: false },
    { name: 'Vanity lighting', required: false },
    { name: 'Clothing rack / hangers', required: false },
    { name: 'Changing area', required: false },
    { name: 'Power outlets', required: false },
  ],
};

// Miscellaneous amenities (not tied to specific rooms)
export const MISC_AMENITIES = {
  parking: [
    { name: 'Free parking on premises', required: false },
    { name: 'Free street parking', required: false },
    { name: 'EV charger', required: false },
  ],
  pets: [
    { name: 'Pets allowed', required: false },
    { name: 'Pet bowls', required: false },
    { name: 'Fenced yard', required: false },
  ],
  family: [
    { name: 'Crib', required: false },
    { name: 'High chair', required: false },
    { name: 'Baby monitor', required: false },
    { name: 'Outlet covers', required: false },
    { name: 'Stair gates', required: false },
  ],
  cleaning: [
    { name: 'Cleaning supplies', required: false },
    { name: 'Vacuum cleaner', required: false },
    { name: 'Mop', required: false },
    { name: 'Luggage drop-off allowed', required: false },
  ],
  extras: [
    { name: 'Welcome snacks', required: false },
    { name: 'Coffee and tea', required: false },
    { name: 'Slippers', required: false },
    { name: 'Bathrobes', required: false },
  ],
  misc: [
    { name: 'Long-term stays allowed', required: false },
    { name: 'Smoking allowed', required: false },
    { name: 'Events allowed', required: false },
    { name: 'Smoke alarm', required: true },
    { name: 'Carbon monoxide alarm', required: true },
    { name: 'Fire extinguisher', required: true },
  ],
};

export const MISC_CATEGORY_LABELS: Record<string, string> = {
  parking: 'Parking & Transport',
  pets: 'Pets',
  family: 'Family-Friendly',
  cleaning: 'Cleaning & Services',
  extras: 'Extras & Comfort',
  misc: 'Safety & Policies',
};

// Helper function to get room types by space type
export const getRoomTypesBySpaceType = (spaceType: string): readonly string[] => {
  return spaceType === 'event_space' ? EVENT_SPACE_ROOM_TYPES : PROPERTY_ROOM_TYPES;
};

export const useSpaceAmenities = (spaceId: string) => {
  const queryClient = useQueryClient();

  const { data: amenities = [], isLoading, refetch } = useQuery({
    queryKey: ['space-amenities', spaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('space_amenity')
        .select('*')
        .eq('space_id', spaceId)
        .order('room_type', { ascending: true })
        .order('room_number', { ascending: true });

      if (error) throw error;
      return data as SpaceAmenity[];
    },
    enabled: !!spaceId,
  });

  // Get next room number for a given room type
  const getNextRoomNumber = (roomType: string): number => {
    const existingRooms = amenities.filter(a => a.room_type === roomType);
    if (existingRooms.length === 0) return 1;
    const roomNumbers = [...new Set(existingRooms.map(a => a.room_number))];
    return Math.max(...roomNumbers) + 1;
  };

  // Add a complete room with multiple amenities
  const addRoomMutation = useMutation({
    mutationFn: async ({ 
      roomType, 
      amenities: roomAmenities,
    }: { 
      roomType: string; 
      amenities: { name: string; required: boolean }[];
    }) => {
      const roomNumber = getNextRoomNumber(roomType);
      
      const records = roomAmenities.map(a => ({
        space_id: spaceId,
        room_type: roomType,
        room_number: roomNumber,
        name: a.name,
        required: a.required,
        status: 'unknown' as AmenityStatus,
      }));

      const { data, error } = await supabase
        .from('space_amenity')
        .insert(records)
        .select();

      if (error) throw error;
      return { roomNumber, data };
    },
    onSuccess: ({ roomNumber }, { roomType }) => {
      queryClient.invalidateQueries({ queryKey: ['space-amenities', spaceId] });
      toast.success(`${ROOM_TYPE_LABELS[roomType] || roomType} #${roomNumber} added`);
    },
    onError: (error: Error) => {
      console.error('Error adding room:', error);
      toast.error('Failed to add room');
    },
  });

  // Delete an entire room (all amenities with same room_type + room_number)
  const deleteRoomMutation = useMutation({
    mutationFn: async ({ roomType, roomNumber }: { roomType: string; roomNumber: number }) => {
      // Get all amenities for this room to delete their images
      const roomAmenities = amenities.filter(
        a => a.room_type === roomType && a.room_number === roomNumber
      );
      
      // Delete images from storage
      const imagePaths = roomAmenities
        .filter(a => a.image_path)
        .map(a => a.image_path!);
      
      if (imagePaths.length > 0) {
        await supabase.storage
          .from('property-documents')
          .remove(imagePaths);
      }
      
      const { error } = await supabase
        .from('space_amenity')
        .delete()
        .eq('space_id', spaceId)
        .eq('room_type', roomType)
        .eq('room_number', roomNumber);

      if (error) throw error;
    },
    onSuccess: (_, { roomType, roomNumber }) => {
      queryClient.invalidateQueries({ queryKey: ['space-amenities', spaceId] });
      toast.success(`${ROOM_TYPE_LABELS[roomType] || roomType} #${roomNumber} removed`);
    },
    onError: () => {
      toast.error('Failed to remove room');
    },
  });

  // Add a single amenity (for misc section or adding to existing room)
  const addAmenityMutation = useMutation({
    mutationFn: async ({ 
      roomType, 
      roomNumber,
      name, 
      required = false 
    }: { 
      roomType: string;
      roomNumber: number;
      name: string; 
      required?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('space_amenity')
        .insert({
          space_id: spaceId,
          room_type: roomType,
          room_number: roomNumber,
          name,
          required,
          status: 'unknown',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-amenities', spaceId] });
    },
    onError: (error: Error) => {
      console.error('Error adding amenity:', error);
      toast.error('Failed to add amenity');
    },
  });

  // Delete a single amenity
  const deleteAmenityMutation = useMutation({
    mutationFn: async (amenityId: string) => {
      const amenity = amenities.find(a => a.id === amenityId);
      
      if (amenity?.image_path) {
        await supabase.storage
          .from('property-documents')
          .remove([amenity.image_path]);
      }
      
      const { error } = await supabase
        .from('space_amenity')
        .delete()
        .eq('id', amenityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-amenities', spaceId] });
    },
    onError: () => {
      toast.error('Failed to remove amenity');
    },
  });

  // Toggle misc amenity (add if doesn't exist, remove if exists)
  const toggleMiscAmenity = async (category: string, amenityName: string, required: boolean) => {
    const existing = amenities.find(
      a => a.room_type === category && a.name === amenityName
    );
    
    if (existing) {
      await deleteAmenityMutation.mutateAsync(existing.id);
    } else {
      await addAmenityMutation.mutateAsync({
        roomType: category,
        roomNumber: 1,
        name: amenityName,
        required,
      });
    }
  };

  const updateAmenityStatus = useMutation({
    mutationFn: async ({ amenityId, status }: { amenityId: string; status: AmenityStatus }) => {
      const { error } = await supabase
        .from('space_amenity')
        .update({ status })
        .eq('id', amenityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-amenities', spaceId] });
    },
    onError: () => {
      toast.error('Failed to update amenity status');
    },
  });

  const uploadAmenityImage = useMutation({
    mutationFn: async ({ amenityId, file }: { amenityId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${spaceId}/amenity-${amenityId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('property-documents')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('space_amenity')
        .update({
          image_url: urlData.publicUrl,
          image_path: fileName,
          status: 'provided',
        })
        .eq('id', amenityId);

      if (updateError) throw updateError;

      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-amenities', spaceId] });
      toast.success('Photo uploaded - amenity verified');
    },
    onError: () => {
      toast.error('Failed to upload photo');
    },
  });

  const removeAmenityImage = useMutation({
    mutationFn: async ({ amenityId, imagePath }: { amenityId: string; imagePath: string }) => {
      const { error: deleteError } = await supabase.storage
        .from('property-documents')
        .remove([imagePath]);

      if (deleteError) throw deleteError;

      const { error: updateError } = await supabase
        .from('space_amenity')
        .update({
          image_url: null,
          image_path: null,
          status: 'unknown',
        })
        .eq('id', amenityId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-amenities', spaceId] });
      toast.success('Photo removed');
    },
    onError: () => {
      toast.error('Failed to remove photo');
    },
  });

  // Get rooms (grouped by room_type + room_number, excluding misc categories)
  const miscCategories = Object.keys(MISC_AMENITIES);
  const rooms = amenities
    .filter(a => !miscCategories.includes(a.room_type))
    .reduce((acc, amenity) => {
      const key = `${amenity.room_type}-${amenity.room_number}`;
      if (!acc[key]) {
        acc[key] = {
          roomType: amenity.room_type,
          roomNumber: amenity.room_number,
          amenities: [],
        };
      }
      acc[key].amenities.push(amenity);
      return acc;
    }, {} as Record<string, { roomType: string; roomNumber: number; amenities: SpaceAmenity[] }>);

  // Get misc amenities (grouped by category)
  const miscAmenities = amenities.filter(a => miscCategories.includes(a.room_type));

  // Calculated values
  const requiredAmenities = amenities.filter(a => a.required);
  const allRequiredProvided = requiredAmenities.every(a => a.status === 'provided');
  const requiredProgress = requiredAmenities.length > 0
    ? (requiredAmenities.filter(a => a.status === 'provided').length / requiredAmenities.length) * 100
    : 100;
  const overallProgress = amenities.length > 0
    ? (amenities.filter(a => a.status === 'provided').length / amenities.length) * 100
    : 0;

  return {
    amenities,
    rooms: Object.values(rooms).sort((a, b) => {
      if (a.roomType !== b.roomType) return a.roomType.localeCompare(b.roomType);
      return a.roomNumber - b.roomNumber;
    }),
    miscAmenities,
    isLoading,
    refetch,
    addRoom: addRoomMutation.mutate,
    deleteRoom: deleteRoomMutation.mutate,
    addAmenity: addAmenityMutation.mutate,
    deleteAmenity: deleteAmenityMutation.mutate,
    toggleMiscAmenity,
    updateAmenityStatus: updateAmenityStatus.mutate,
    uploadAmenityImage: uploadAmenityImage.mutate,
    removeAmenityImage: removeAmenityImage.mutate,
    isUploading: uploadAmenityImage.isPending,
    isAddingRoom: addRoomMutation.isPending,
    getNextRoomNumber,
    requiredAmenities,
    allRequiredProvided,
    requiredProgress,
    overallProgress,
  };
};
