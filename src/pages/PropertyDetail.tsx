import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import DashboardHeader from '@/components/DashboardHeader';
import PropertyUploadSection from '@/components/PropertyUploadSection';
import AmenitiesChecklist from '@/components/AmenitiesChecklist';
import PropertyImageGallery from '@/components/PropertyImageGallery';
import PublishButton from '@/components/PublishButton';
import PropertyBasicInfo from '@/components/PropertyBasicInfo';
import { useSpaceAmenities } from '@/hooks/useSpaceAmenities';

interface Space {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  status: string | null;
  space_type: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [canPublish, setCanPublish] = useState(false);
  
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const { data: space, isLoading, refetch } = useQuery({
    queryKey: ['space', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('space')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching space:', error);
        throw error;
      }
      
      if (!data) {
        navigate('/dashboard');
        return null;
      }
      
      return data as Space;
    },
    enabled: !!user && !!id,
  });

  const { requiredAmenities } = useSpaceAmenities(id || '');

  const handleRequiredStatusChange = useCallback((allRequiredProvided: boolean) => {
    setCanPublish(allRequiredProvided);
  }, []);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-secondary text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string | null) => {
    if (status === 'published') return 'Published';
    if (status === 'draft') return 'Draft';
    return status || 'draft';
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  if (!space) {
    return null;
  }

  const missingRequiredCount = requiredAmenities.filter(a => a.status !== 'provided').length;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="-ml-2"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Properties
          </Button>

          {/* Publish Button */}
          <PublishButton
            spaceId={space.id}
            currentStatus={space.status}
            canPublish={canPublish}
            missingRequiredCount={missingRequiredCount}
          />
        </div>

        {/* Basic Information Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <PropertyBasicInfo
            spaceId={space.id}
            initialData={{
              name: space.name,
              address: space.address,
              description: space.description,
              metadata: space.metadata,
            }}
          />
        </motion.div>

        {/* Image Gallery */}
        <PropertyImageGallery spaceId={space.id} />

        {/* Upload Section */}
        <div className="mt-8">
          <PropertyUploadSection 
            propertyId={space.id} 
            propertyName={space.name}
            address={space.address || undefined}
          />
        </div>

        {/* Amenities Checklist */}
        <div className="mt-10">
          <AmenitiesChecklist 
            spaceId={space.id} 
            onRequiredStatusChange={handleRequiredStatusChange}
          />
        </div>
      </main>
    </div>
  );
};

export default PropertyDetail;
