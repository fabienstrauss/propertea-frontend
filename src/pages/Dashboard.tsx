import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, LayoutGrid, List, Search, Loader2, Building2, Home, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PropertyCard from '@/components/PropertyCard';
import PropertyTable from '@/components/PropertyTable';
import DashboardHeader from '@/components/DashboardHeader';
import CreatePropertyModal from '@/components/CreatePropertyModal';

interface Space {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  status: string | null;
  space_type: string;
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'property' | 'event_space'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSpaces();
    }
  }, [user]);

  const fetchSpaces = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('space')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching spaces:', error);
    } else {
      setSpaces(data || []);
    }
    setIsLoading(false);
  };

  const handlePropertyCreated = () => {
    fetchSpaces();
    setIsCreateModalOpen(false);
  };

  const filteredSpaces = spaces.filter(space => {
    const matchesSearch = space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || space.space_type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Map spaces to property interface for existing components
  const propertiesForDisplay = filteredSpaces.map(space => ({
    id: space.id,
    name: space.name,
    address: space.address,
    description: space.description,
    status: space.status,
    space_type: space.space_type,
    created_at: space.created_at,
  }));

  // Count by type for stats
  const propertyCount = spaces.filter(s => s.space_type === 'property').length;
  const eventSpaceCount = spaces.filter(s => s.space_type === 'event_space').length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display text-foreground">Spaces</h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor all your spaces
            </p>
          </div>
          
          <Button
            variant="coral"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Space
          </Button>
        </div>

        {/* Type Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setTypeFilter('all')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              typeFilter === 'all'
                ? 'bg-foreground text-background shadow-sm'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
            }`}
          >
            <Building2 className="w-4 h-4" />
            All Spaces
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
              typeFilter === 'all' ? 'bg-background/20' : 'bg-background'
            }`}>
              {spaces.length}
            </span>
          </button>
          <button
            onClick={() => setTypeFilter('property')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              typeFilter === 'property'
                ? 'bg-coral text-white shadow-sm'
                : 'bg-coral-light text-coral hover:bg-coral/20'
            }`}
          >
            <Home className="w-4 h-4" />
            Properties
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
              typeFilter === 'property' ? 'bg-white/20' : 'bg-coral/10'
            }`}>
              {propertyCount}
            </span>
          </button>
          <button
            onClick={() => setTypeFilter('event_space')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              typeFilter === 'event_space'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            <PartyPopper className="w-4 h-4" />
            Event Spaces
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
              typeFilter === 'event_space' ? 'bg-white/20' : 'bg-purple-200'
            }`}>
              {eventSpaceCount}
            </span>
          </button>
        </div>

        {/* Search and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search spaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 rounded-xl"
            />
          </div>
          
          <div className="flex items-center gap-1 p-1 bg-secondary rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-background shadow-sm text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'table' 
                  ? 'bg-background shadow-sm text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-coral" />
          </div>
        ) : propertiesForDisplay.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchQuery ? 'No spaces found' : 'No spaces yet'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery 
                ? 'Try adjusting your search query'
                : 'Get started by adding your first space. Upload documents or use our AI video call to create listings.'}
            </p>
            {!searchQuery && (
              <Button
                variant="coral"
                onClick={() => setIsCreateModalOpen(true)}
                className="rounded-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Space
              </Button>
            )}
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {propertiesForDisplay.map((property, index) => (
              <PropertyCard
                key={property.id}
                property={property}
                index={index}
              />
            ))}
          </motion.div>
        ) : (
          <PropertyTable properties={propertiesForDisplay} />
        )}
      </main>

      <CreatePropertyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPropertyCreated={handlePropertyCreated}
      />
    </div>
  );
};

export default Dashboard;