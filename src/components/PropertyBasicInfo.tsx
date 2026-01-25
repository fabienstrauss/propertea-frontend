import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, Loader2, Home, MapPin, DollarSign, Users } from 'lucide-react';

interface PropertyBasicInfoProps {
  spaceId: string;
  initialData: {
    name: string;
    address: string | null;
    description: string | null;
    metadata: Record<string, unknown> | null;
  };
}

interface PropertyMetadata {
  base_price?: number;
  max_guests?: number;
  country?: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

// Country-specific address formats
const COUNTRIES = [
  { code: 'US', name: 'United States', format: ['street', 'city', 'state', 'postal_code'] },
  { code: 'UK', name: 'United Kingdom', format: ['street', 'city', 'postal_code'] },
  { code: 'DE', name: 'Germany', format: ['street', 'postal_code', 'city'] },
  { code: 'FR', name: 'France', format: ['street', 'postal_code', 'city'] },
  { code: 'ES', name: 'Spain', format: ['street', 'postal_code', 'city', 'state'] },
  { code: 'IT', name: 'Italy', format: ['street', 'postal_code', 'city', 'state'] },
  { code: 'NL', name: 'Netherlands', format: ['street', 'postal_code', 'city'] },
  { code: 'BE', name: 'Belgium', format: ['street', 'postal_code', 'city'] },
  { code: 'AT', name: 'Austria', format: ['street', 'postal_code', 'city'] },
  { code: 'CH', name: 'Switzerland', format: ['street', 'postal_code', 'city'] },
  { code: 'PT', name: 'Portugal', format: ['street', 'postal_code', 'city'] },
  { code: 'AU', name: 'Australia', format: ['street', 'city', 'state', 'postal_code'] },
  { code: 'CA', name: 'Canada', format: ['street', 'city', 'state', 'postal_code'] },
  { code: 'OTHER', name: 'Other', format: ['street', 'city', 'state', 'postal_code'] },
];

const FIELD_LABELS: Record<string, Record<string, string>> = {
  US: { street: 'Street Address', city: 'City', state: 'State', postal_code: 'ZIP Code' },
  UK: { street: 'Street Address', city: 'City/Town', postal_code: 'Postcode' },
  DE: { street: 'Straße', city: 'Stadt', postal_code: 'PLZ' },
  FR: { street: 'Adresse', city: 'Ville', postal_code: 'Code postal' },
  ES: { street: 'Dirección', city: 'Ciudad', state: 'Provincia', postal_code: 'Código postal' },
  IT: { street: 'Indirizzo', city: 'Città', state: 'Provincia', postal_code: 'CAP' },
  NL: { street: 'Straat', city: 'Plaats', postal_code: 'Postcode' },
  BE: { street: 'Rue', city: 'Ville', postal_code: 'Code postal' },
  AT: { street: 'Straße', city: 'Stadt', postal_code: 'PLZ' },
  CH: { street: 'Strasse', city: 'Ort', postal_code: 'PLZ' },
  PT: { street: 'Morada', city: 'Cidade', postal_code: 'Código postal' },
  AU: { street: 'Street Address', city: 'Suburb', state: 'State', postal_code: 'Postcode' },
  CA: { street: 'Street Address', city: 'City', state: 'Province', postal_code: 'Postal Code' },
  OTHER: { street: 'Street Address', city: 'City', state: 'State/Province', postal_code: 'Postal Code' },
};

const PropertyBasicInfo = ({ spaceId, initialData }: PropertyBasicInfoProps) => {
  const queryClient = useQueryClient();
  const metadata = (initialData.metadata || {}) as PropertyMetadata;

  // Parse existing address into components if possible
  const parseAddress = () => {
    const address = initialData.address || '';
    // Simple parsing - try to extract parts
    const parts = address.split(',').map(p => p.trim());
    return {
      street: metadata.street || parts[0] || '',
      city: metadata.city || parts[1] || '',
      state: metadata.state || parts[2] || '',
      postal_code: metadata.postal_code || parts[3] || '',
    };
  };

  const parsedAddress = parseAddress();

  const [formData, setFormData] = useState({
    name: initialData.name || '',
    country: metadata.country || 'US',
    street: parsedAddress.street,
    city: parsedAddress.city,
    state: parsedAddress.state,
    postal_code: parsedAddress.postal_code,
    description: initialData.description || '',
    base_price: metadata.base_price?.toString() || '',
    max_guests: metadata.max_guests?.toString() || '',
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const currentMetadata = (initialData.metadata || {}) as PropertyMetadata;
    const currentParsed = parseAddress();
    const initial = {
      name: initialData.name || '',
      country: currentMetadata.country || 'US',
      street: currentParsed.street,
      city: currentParsed.city,
      state: currentParsed.state,
      postal_code: currentParsed.postal_code,
      description: initialData.description || '',
      base_price: currentMetadata.base_price?.toString() || '',
      max_guests: currentMetadata.max_guests?.toString() || '',
    };
    
    const changed = JSON.stringify(formData) !== JSON.stringify(initial);
    setHasChanges(changed);
  }, [formData, initialData]);

  // Build full address string based on country format
  const buildAddressString = () => {
    const country = COUNTRIES.find(c => c.code === formData.country) || COUNTRIES[0];
    const parts = country.format.map(field => formData[field as keyof typeof formData]).filter(Boolean);
    const countryName = country.code !== 'OTHER' ? country.name : '';
    return [...parts, countryName].filter(Boolean).join(', ');
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const fullAddress = buildAddressString();
      
      const updatedMetadata = {
        ...(initialData.metadata || {}),
        base_price: formData.base_price ? parseFloat(formData.base_price) : undefined,
        max_guests: formData.max_guests ? parseInt(formData.max_guests) : undefined,
        country: formData.country,
        street: formData.street || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        postal_code: formData.postal_code || undefined,
      };

      // Clean undefined values
      Object.keys(updatedMetadata).forEach(key => {
        if (updatedMetadata[key as keyof typeof updatedMetadata] === undefined) {
          delete updatedMetadata[key as keyof typeof updatedMetadata];
        }
      });

      const { error } = await supabase
        .from('space')
        .update({
          name: formData.name.trim(),
          address: fullAddress || null,
          description: formData.description.trim() || null,
          metadata: updatedMetadata,
        })
        .eq('id', spaceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space', spaceId] });
      toast.success('Property information saved');
      setHasChanges(false);
    },
    onError: (error) => {
      console.error('Error updating property:', error);
      toast.error('Failed to save changes');
    },
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedCountry = COUNTRIES.find(c => c.code === formData.country) || COUNTRIES[0];
  const fieldLabels = FIELD_LABELS[formData.country] || FIELD_LABELS['OTHER'];

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="w-5 h-5" />
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Property Name */}
          <div className="md:col-span-2">
            <Label htmlFor="name" className="flex items-center gap-2 mb-2">
              <Home className="w-4 h-4" />
              Property Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter property name"
              maxLength={100}
            />
          </div>

          {/* Country Selection */}
          <div className="md:col-span-2">
            <Label className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" />
              Country
            </Label>
            <Select value={formData.country} onValueChange={(value) => handleChange('country', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(country => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Address Fields Based on Country */}
          {selectedCountry.format.map((field) => (
            <div key={field} className={field === 'street' ? 'md:col-span-2' : ''}>
              <Label htmlFor={field} className="mb-2 block">
                {fieldLabels[field] || field}
              </Label>
              <Input
                id={field}
                value={formData[field as keyof typeof formData] || ''}
                onChange={(e) => handleChange(field, e.target.value)}
                placeholder={fieldLabels[field] || field}
                maxLength={field === 'street' ? 255 : 100}
              />
            </div>
          ))}

          {/* Base Price */}
          <div>
            <Label htmlFor="base_price" className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4" />
              Base Price (per night)
            </Label>
            <Input
              id="base_price"
              type="number"
              min="0"
              step="0.01"
              value={formData.base_price}
              onChange={(e) => handleChange('base_price', e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Max Guests */}
          <div>
            <Label htmlFor="max_guests" className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" />
              Maximum Guests
            </Label>
            <Input
              id="max_guests"
              type="number"
              min="1"
              max="50"
              value={formData.max_guests}
              onChange={(e) => handleChange('max_guests', e.target.value)}
              placeholder="1"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <Label htmlFor="description" className="mb-2 block">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe your property..."
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.description.length}/2000 characters
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={!hasChanges || !formData.name.trim() || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyBasicInfo;
