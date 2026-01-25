import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Star } from 'lucide-react';
import { useState } from 'react';

interface Property {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  status: string | null;
  created_at: string;
  primaryImage?: string | null;
}

interface ExplorePropertyCardProps {
  property: Property;
  index: number;
}

// Fallback placeholder image
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop';

// Mock data for Airbnb-style display (only for non-image data)
const getMockData = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  return {
    rating: (4 + (hash % 10) / 10).toFixed(2),
    reviews: 10 + (hash % 200),
    price: 80 + (hash % 400),
    beds: 1 + (hash % 5),
    baths: 1 + (hash % 3),
    guests: 2 + (hash % 8),
    superhost: hash % 3 === 0,
  };
};

const ExplorePropertyCard = ({ property, index }: ExplorePropertyCardProps) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const mock = getMockData(property.id);

  // Use real primary image if available, otherwise fallback to placeholder
  const imageUrl = property.primaryImage || PLACEHOLDER_IMAGE;

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
          src={imageUrl}
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
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
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
          {[0, 1, 2, 3, 4].map((dot) => (
            <div
              key={dot}
              className={`w-1.5 h-1.5 rounded-full ${
                dot === 0 ? 'bg-background' : 'bg-background/50'
              }`}
            />
          ))}
        </div>
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
        
        <p className="text-foreground">
          <span className="font-semibold">${mock.price}</span>
          <span className="text-muted-foreground"> night</span>
        </p>
      </div>
    </motion.div>
  );
};

export default ExplorePropertyCard;
