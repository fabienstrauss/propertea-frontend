import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Property {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  status: string | null;
  created_at: string;
  images?: string[];
  price?: number | null;
}

interface ExplorePropertyCardProps {
  property: Property;
  index: number;
}

// Fallback placeholder image
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop';

// Mock data for Airbnb-style display (only for non-price data)
const getMockData = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  return {
    rating: (4 + (hash % 10) / 10).toFixed(2),
    reviews: 10 + (hash % 200),
    beds: 1 + (hash % 5),
    baths: 1 + (hash % 3),
    guests: 2 + (hash % 8),
    superhost: hash % 3 === 0,
  };
};

const ExplorePropertyCard = ({ property, index }: ExplorePropertyCardProps) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const mock = getMockData(property.id);

  // Use real images if available, otherwise fallback to placeholder
  const images = property.images && property.images.length > 0 
    ? property.images 
    : [PLACEHOLDER_IMAGE];

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Use real price from metadata or show nothing if not available
  const displayPrice = property.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group cursor-pointer"
      onClick={() => navigate(`/explore/${property.id}`)}
    >
      {/* Image Container */}
      <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
        <img
          src={images[currentImageIndex]}
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Navigation Arrows - only show if multiple images */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}
        
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isLiked ? 'fill-coral text-coral' : 'text-foreground'
            }`}
          />
        </button>

        {/* Superhost Badge */}
        {mock.superhost && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm text-xs font-medium">
            Superhost
          </div>
        )}

        {/* Image Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {images.slice(0, 5).map((_, dotIndex) => (
              <div
                key={dotIndex}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  dotIndex === currentImageIndex ? 'bg-background' : 'bg-background/50'
                }`}
              />
            ))}
            {images.length > 5 && (
              <div className="w-1.5 h-1.5 rounded-full bg-background/50" />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-foreground truncate">
            {property.address || property.name}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="w-4 h-4 fill-foreground" />
            <span className="text-sm">{mock.rating}</span>
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm truncate">
          {mock.beds} bed{mock.beds > 1 ? 's' : ''} · {mock.baths} bath{mock.baths > 1 ? 's' : ''}
        </p>
        
        <p className="text-muted-foreground text-sm">
          {mock.guests} guests
        </p>
        
        {displayPrice !== null && displayPrice !== undefined && (
          <p className="text-foreground">
            <span className="font-semibold">${displayPrice}</span>
            <span className="text-muted-foreground"> night</span>
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default ExplorePropertyCard;
