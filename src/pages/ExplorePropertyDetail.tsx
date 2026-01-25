import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Heart, Share, Star, MapPin, 
  Shield, Minus, Plus, Check,
  Wifi, Car, Snowflake, Tv, UtensilsCrossed, Waves,
  BedDouble, Bath, DoorOpen, Flame, Wind, Coffee,
  Utensils, Refrigerator, WashingMachine, Dumbbell,
  Trees, Mountain, Umbrella, Baby, PawPrint, Cigarette,
  Lock, Bell, FireExtinguisher, Stethoscope, ShieldCheck,
  Lamp, Moon, Shirt, Droplets, SprayCan, ShowerHead,
  Package, CookingPot, GlassWater, Trash2, Sofa, Laptop,
  Grid3X3, ThermometerSun, Dog, Fence, ChefHat, Cookie, 
  Footprints, Gift, Clock, PartyPopper, KeyRound, 
  MonitorSmartphone, PlugZap, Sparkles, Armchair,
  type LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import PropertyLocationMap from '@/components/PropertyLocationMap';
import FloorPlanDisplay from '@/components/FloorPlanDisplay';
import Model3DGallery from '@/components/Model3DGallery';

// Icon mapping for amenities - expanded with all amenity IDs
const AMENITY_ICONS: Record<string, LucideIcon> = {
  // Bedroom
  bed: BedDouble,
  bed_linens: BedDouble,
  pillows_blankets: BedDouble,
  wardrobe: DoorOpen,
  hangers: Shirt,
  blackout_curtains: Moon,
  nightstands: Lamp,
  reading_lamp: Lamp,
  heating: Flame,
  ac_bedroom: Snowflake,
  
  // Bathroom
  shower: ShowerHead,
  hot_water: Droplets,
  towels: Bath,
  toilet_paper: Package,
  soap: SprayCan,
  shampoo: SprayCan,
  conditioner: SprayCan,
  body_wash: SprayCan,
  hair_dryer: Wind,
  first_aid: Stethoscope,
  
  // Kitchen
  refrigerator: Refrigerator,
  stove: Flame,
  microwave: Utensils,
  coffee_maker: Coffee,
  kettle: Coffee,
  cooking_basics: ChefHat,
  pots_pans: CookingPot,
  dishes_cutlery: UtensilsCrossed,
  glasses_mugs: GlassWater,
  trash_bags: Trash2,
  
  // Living
  sofa: Sofa,
  tv: Tv,
  streaming: MonitorSmartphone,
  heating_living: Flame,
  ac_living: Snowflake,
  
  // Laundry
  washing_machine: WashingMachine,
  dryer: Wind,
  drying_rack: Grid3X3,
  laundry_detergent: SprayCan,
  iron: Shirt,
  ironing_board: Shirt,
  
  // Technology
  wifi: Wifi,
  workspace: Laptop,
  desk: DoorOpen,
  smart_tv: MonitorSmartphone,
  usb_chargers: PlugZap,
  
  // Safety
  smoke_alarm: Bell,
  co_alarm: ShieldCheck,
  fire_extinguisher: FireExtinguisher,
  heating_main: ThermometerSun,
  first_aid_safety: Stethoscope,
  security_cameras: Lock,
  smart_lock: KeyRound,
  
  // Entrance
  self_checkin: KeyRound,
  lockbox: Lock,
  private_entrance: DoorOpen,
  wheelchair_access: Armchair,
  
  // Outdoor
  balcony: Mountain,
  outdoor_furniture: Armchair,
  bbq: Flame,
  garden: Trees,
  
  // Recreation
  pool: Waves,
  hot_tub: Waves,
  gym: Dumbbell,
  yoga_mat: Sparkles,
  
  // Parking
  free_parking: Car,
  street_parking: Car,
  parking: Car,
  ev_charger: PlugZap,
  
  // Pets
  pets_allowed: PawPrint,
  pet_bowls: Dog,
  fenced_yard: Fence,
  pet_friendly: PawPrint,
  
  // Family
  crib: Baby,
  high_chair: Armchair,
  baby_monitor: Baby,
  outlet_covers: PlugZap,
  stair_gates: Lock,
  
  // Cleaning
  cleaning_supplies: SprayCan,
  vacuum: Sparkles,
  mop: Sparkles,
  luggage_dropoff: Package,
  
  // Extras
  welcome_snacks: Cookie,
  coffee_tea: Coffee,
  slippers: Footprints,
  bathrobes: Gift,
  
  // Misc
  long_term: Clock,
  smoking: Cigarette,
  smoking_allowed: Cigarette,
  events: PartyPopper,
  beach_access: Umbrella,
  air_conditioning: Snowflake,
  kitchen: UtensilsCrossed,
};

// Helper to capitalize category names
const formatCategoryName = (category: string): string => {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Mock data generator for non-image data
const getMockPropertyDetails = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const hostNames = ['Sarah', 'Michael', 'Emma', 'James', 'Olivia', 'William'];

  return {
    rating: (4 + (hash % 10) / 10).toFixed(2),
    reviews: 10 + (hash % 200),
    price: 80 + (hash % 400),
    cleaningFee: 30 + (hash % 50),
    serviceFee: 20 + (hash % 40),
    beds: 1 + (hash % 5),
    baths: 1 + (hash % 3),
    maxGuests: 2 + (hash % 8),
    bedrooms: 1 + (hash % 4),
    type: ['Entire home', 'Private room', 'Shared room', 'Unique stay'][hash % 4],
    superhost: hash % 3 === 0,
    hostName: hostNames[hash % hostNames.length],
    hostingSince: 2018 + (hash % 6),
    responseRate: 95 + (hash % 5),
    description: `Welcome to this beautiful space! This stunning location offers everything you need for a comfortable and memorable stay. The interior features modern amenities combined with cozy touches that make you feel right at home.

Enjoy the spacious living areas, fully equipped kitchen, and comfortable bedrooms. The space is located in a prime location with easy access to local attractions, restaurants, and public transportation.

Perfect for families, couples, or groups of friends looking for a relaxing getaway or a convenient base for exploring the area.`,
    houseRules: [
      'Check-in: 3:00 PM - 10:00 PM',
      'Checkout: 11:00 AM',
      'No smoking',
      'No pets',
      'No parties or events',
    ],
  };
};

// Placeholder images for when no real images exist
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1200&h=800&fit=crop',
];

const ExplorePropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [checkInDate, setCheckInDate] = useState<Date | undefined>();
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>();
  const [guests, setGuests] = useState(1);

  const { data: space, isLoading, error } = useQuery({
    queryKey: ['public-space', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('space')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch real images for this space
  const { data: images = [] } = useQuery({
    queryKey: ['space-images', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('space_image')
        .select('*')
        .eq('space_id', id)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch amenities for this space (exclude those explicitly marked as not provided)
  const { data: amenities = [] } = useQuery({
    queryKey: ['space-amenities-public', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('space_amenity')
        .select('*')
        .eq('space_id', id)
        .neq('status', 'not_provided')
        .order('room_type', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch rooms for this space (to get bedroom/bathroom counts)
  const { data: rooms = [] } = useQuery({
    queryKey: ['space-rooms-public', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room')
        .select('*')
        .eq('space_id', id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch 3D models for this space
  const { data: models3D = [] } = useQuery({
    queryKey: ['space-3d-models-public', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('space_3d_model')
        .select('*')
        .eq('space_id', id)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch floor plan document for this space
  const { data: floorPlanDoc } = useQuery({
    queryKey: ['space-floorplan-public', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('space_document')
        .select('*')
        .eq('space_id', id)
        .eq('is_floorplan_related_doc', true)
        .eq('processing_status', 'completed')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral" />
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Space not found</p>
        <Button onClick={() => navigate('/explore')}>Back to Explore</Button>
      </div>
    );
  }

  const mock = getMockPropertyDetails(space.id);
  
  // Extract real values from metadata, falling back to mock
  const metadata = (space.metadata || {}) as {
    base_price?: number;
    max_guests?: number;
  };
  
  // Get bedroom count from rooms query
  const bedroomCount = rooms.filter(r => r.room_type === 'bedroom').length || mock.bedrooms;
  const bathroomCount = rooms.filter(r => r.room_type === 'bathroom').length || mock.baths;
  const bedCount = rooms.filter(r => r.room_type === 'bedroom').length || mock.beds; // Approximate
  
  const propertyDetails = {
    price: metadata.base_price || mock.price,
    maxGuests: metadata.max_guests || mock.maxGuests,
    bedrooms: bedroomCount,
    beds: bedCount,
    bathrooms: bathroomCount,
  };
  
  // Use real images if available, otherwise fall back to placeholders
  const displayImages = images.length > 0 
    ? images.map(img => img.storage_url)
    : PLACEHOLDER_IMAGES;
  
  const nights = checkInDate && checkOutDate 
    ? differenceInDays(checkOutDate, checkInDate) 
    : 0;
  const subtotal = propertyDetails.price * nights;
  const total = subtotal + (nights > 0 ? mock.cleaningFee + mock.serviceFee : 0);

  const getAmenityIcon = (amenityId: string) => {
    const IconComponent = AMENITY_ICONS[amenityId] || Check;
    return IconComponent;
  };

  // Group amenities by room_type
  const groupedAmenities = amenities.reduce((acc, amenity) => {
    const roomType = amenity.room_type || 'other';
    if (!acc[roomType]) acc[roomType] = [];
    acc[roomType].push(amenity);
    return acc;
  }, {} as Record<string, typeof amenities>);
  
  // Show map only if address exists
  const hasAddress = !!space.address;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate('/explore')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2">
              <Share className="w-4 h-4" />
              Share
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2"
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-coral text-coral' : ''}`} />
              Save
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
            {space.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-foreground" />
              <span className="font-medium">{mock.rating}</span>
              <span className="text-muted-foreground">({mock.reviews} reviews)</span>
            </div>
            {mock.superhost && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="font-medium">Superhost</span>
              </>
            )}
            <span className="text-muted-foreground">·</span>
            <div className="flex items-center gap-1 text-muted-foreground underline">
              <MapPin className="w-4 h-4" />
              {space.address || 'Location available upon booking'}
            </div>
          </div>
        </motion.div>

        {/* Image Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 grid-rows-2 gap-2 rounded-xl overflow-hidden mb-8 h-[400px]"
        >
          <div className="col-span-2 row-span-2">
            <img
              src={displayImages[0]}
              alt={space.name}
              className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer"
            />
          </div>
          {displayImages.slice(1, 5).map((img, i) => (
            <div key={i} className="col-span-1 row-span-1">
              <img
                src={img}
                alt={`${space.name} ${i + 2}`}
                className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer"
              />
            </div>
          ))}
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Space Info */}
            <div>
              <div className="mb-4">
                <p className="text-muted-foreground">
                  {propertyDetails.maxGuests} guests · {propertyDetails.bedrooms} bedroom{propertyDetails.bedrooms > 1 ? 's' : ''} · {propertyDetails.beds} bed{propertyDetails.beds > 1 ? 's' : ''} · {propertyDetails.bathrooms} bath{propertyDetails.bathrooms > 1 ? 's' : ''}
                </p>
              </div>
              
              <Separator className="my-6" />

              {/* Highlights */}
              {mock.superhost && (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Shield className="w-6 h-6 text-coral flex-shrink-0" />
                    <div>
                      <p className="font-medium">{mock.hostName} is a Superhost</p>
                      <p className="text-sm text-muted-foreground">
                        Superhosts are experienced, highly rated hosts who are committed to providing great stays.
                      </p>
                    </div>
                  </div>
                  <Separator className="my-6" />
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-4">About this place</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {space.description || mock.description}
                </p>
              </div>

              <Separator className="my-6" />

              {/* Amenities */}
              <div>
                <h3 className="text-lg font-semibold mb-4">What this place offers</h3>
                {amenities.length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(groupedAmenities).map(([roomType, roomAmenities]) => (
                      <div key={roomType}>
                        <h4 className="text-base font-semibold mb-3">{formatCategoryName(roomType)}</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {roomAmenities.map((amenity) => {
                            const IconComponent = getAmenityIcon(amenity.room_type);
                            return (
                              <div key={amenity.id} className="flex items-center gap-3">
                                <IconComponent className="w-5 h-5 text-muted-foreground" />
                                <span>{amenity.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No amenities information available yet.</p>
                )}
              </div>

            {/* 3D Scan Section - Always show if models exist */}
            <Separator className="my-6" />
            <div>
              <h3 className="text-lg font-semibold mb-4">3D Virtual Tour</h3>
              <Model3DGallery spaceId={id || ''} readOnly />
            </div>

              {/* Floor Plan Section */}
              <Separator className="my-6" />
              <div>
                <h3 className="text-lg font-semibold mb-4">Floor Plan</h3>
                <FloorPlanDisplay spaceId={id || ''} floorPlanUrl={floorPlanDoc?.storage_url} />
              </div>

              {/* Location Map */}
              {hasAddress && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Where you'll be</h3>
                    <PropertyLocationMap
                      address={space.address!}
                      propertyName={space.name}
                    />
                    <p className="text-muted-foreground mt-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location available upon booking
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-24 border border-border rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-baseline justify-between mb-6">
                <div>
                  <span className="text-2xl font-semibold">${propertyDetails.price}</span>
                  <span className="text-muted-foreground"> night</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-foreground" />
                  <span className="font-medium">{mock.rating}</span>
                  <span className="text-muted-foreground">({mock.reviews})</span>
                </div>
              </div>

              {/* Date Picker */}
              <div className="border border-border rounded-lg mb-4">
                <div className="grid grid-cols-2 divide-x divide-border">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="p-3 text-left hover:bg-muted/50 transition-colors">
                        <p className="text-xs font-medium uppercase">Check-in</p>
                        <p className={cn("text-sm", !checkInDate && "text-muted-foreground")}>
                          {checkInDate ? format(checkInDate, 'MMM d, yyyy') : 'Add date'}
                        </p>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={checkInDate}
                        onSelect={setCheckInDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="p-3 text-left hover:bg-muted/50 transition-colors">
                        <p className="text-xs font-medium uppercase">Checkout</p>
                        <p className={cn("text-sm", !checkOutDate && "text-muted-foreground")}>
                          {checkOutDate ? format(checkOutDate, 'MMM d, yyyy') : 'Add date'}
                        </p>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={checkOutDate}
                        onSelect={setCheckOutDate}
                        disabled={(date) => date < (checkInDate || new Date())}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="border-t border-border p-3">
                  <p className="text-xs font-medium uppercase mb-2">Guests</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{guests} guest{guests > 1 ? 's' : ''}</span>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        disabled={guests <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{guests}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setGuests(Math.min(propertyDetails.maxGuests, guests + 1))}
                        disabled={guests >= propertyDetails.maxGuests}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum {propertyDetails.maxGuests} guests
                  </p>
                </div>
              </div>

              <Button className="w-full h-12 text-base mb-4" disabled={!checkInDate || !checkOutDate}>
                {checkInDate && checkOutDate ? 'Reserve' : 'Select dates to book'}
              </Button>

              {nights > 0 && (
                <>
                  <p className="text-center text-sm text-muted-foreground mb-4">
                    You won't be charged yet
                  </p>

                  {/* Price Breakdown */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="underline">${propertyDetails.price} x {nights} night{nights > 1 ? 's' : ''}</span>
                      <span>${subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="underline">Cleaning fee</span>
                      <span>${mock.cleaningFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="underline">Service fee</span>
                      <span>${mock.serviceFee}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${total}</span>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExplorePropertyDetail;