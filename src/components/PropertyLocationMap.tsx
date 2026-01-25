import { MapPin } from 'lucide-react';

interface PropertyLocationMapProps {
  address: string;
  propertyName: string;
}

const PropertyLocationMap = ({ address, propertyName }: PropertyLocationMapProps) => {
  if (!address) {
    return (
      <div className="rounded-xl overflow-hidden border border-border h-[300px] w-full flex items-center justify-center bg-muted/50">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <MapPin className="w-8 h-8" />
          <p>No address provided</p>
        </div>
      </div>
    );
  }

  // Use Google Maps embed with the address
  const encodedAddress = encodeURIComponent(address);
  const mapSrc = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;

  return (
    <div className="rounded-xl overflow-hidden border border-border h-[300px] w-full">
      <iframe
        title={`Map showing location of ${propertyName}`}
        src={mapSrc}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
};

export default PropertyLocationMap;