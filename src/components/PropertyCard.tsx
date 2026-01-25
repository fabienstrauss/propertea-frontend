import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Building2, MapPin, Calendar, ArrowRight, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Property {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  status: string | null;
  space_type: string;
  created_at: string;
}

interface PropertyCardProps {
  property: Property;
  index: number;
}

const PropertyCard = ({ property, index }: PropertyCardProps) => {
  const navigate = useNavigate();
  const isEventSpace = property.space_type === 'event_space';

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-secondary text-muted-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      onClick={() => navigate(`/property/${property.id}`)}
      className={cn(
        "group bg-card rounded-2xl border p-6 cursor-pointer transition-all duration-300 relative overflow-hidden",
        isEventSpace 
          ? "border-purple-200 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-100" 
          : "border-border hover:border-coral/30 hover:shadow-airbnb-hover"
      )}
    >
      {/* Decorative accent for event spaces */}
      {isEventSpace && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-100 to-transparent rounded-bl-[100px] -z-0" />
      )}

      {/* Type Badge - Top Right */}
      <div className={cn(
        "absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 z-10",
        isEventSpace 
          ? "bg-purple-100 text-purple-700" 
          : "bg-coral-light text-coral"
      )}>
        {isEventSpace ? (
          <>
            <PartyPopper className="w-3 h-3" />
            Event Space
          </>
        ) : (
          <>
            <Home className="w-3 h-3" />
            Property
          </>
        )}
      </div>

      {/* Icon */}
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors relative z-10",
        isEventSpace 
          ? "bg-purple-100 group-hover:bg-purple-200" 
          : "bg-secondary group-hover:bg-coral-light"
      )}>
        {isEventSpace ? (
          <Building2 className="w-7 h-7 text-purple-600" />
        ) : (
          <Home className="w-7 h-7 text-muted-foreground group-hover:text-coral transition-colors" />
        )}
      </div>

      {/* Content */}
      <div className="mb-4 relative z-10">
        <div className="flex items-start gap-2 mb-2 pr-20">
          <h3 className={cn(
            "text-lg font-semibold transition-colors",
            isEventSpace 
              ? "text-foreground group-hover:text-purple-700" 
              : "text-foreground group-hover:text-coral"
          )}>
            {property.name}
          </h3>
        </div>
        
        {property.address && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{property.address}</span>
          </div>
        )}
        
        {property.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {property.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(property.created_at).toLocaleDateString()}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(property.status)}`}>
            {property.status || 'draft'}
          </span>
        </div>
        
        <div className={cn(
          "flex items-center gap-1 text-sm opacity-0 group-hover:opacity-100 transition-opacity",
          isEventSpace ? "text-purple-600" : "text-coral"
        )}>
          <span>View</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyCard;
