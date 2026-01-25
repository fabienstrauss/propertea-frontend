import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, SlidersHorizontal, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ExplorePropertyCard from '@/components/ExplorePropertyCard';

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: spaces, isLoading } = useQuery({
    queryKey: ['public-spaces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('space')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredSpaces = spaces?.filter(space =>
    space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    space.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Map spaces to property interface for ExplorePropertyCard
  const propertiesForDisplay = filteredSpaces?.map(space => ({
    id: space.id,
    name: space.name,
    address: space.address,
    description: space.description,
    status: space.status,
    created_at: space.created_at,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Search Bar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border mt-16">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search spaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-full border-2 focus:border-coral"
              />
            </div>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-2">
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {['All', 'Properties', 'Event Halls', 'Venues', 'Warehouses', 'Offices', 'Studios'].map((category) => (
              <Button
                key={category}
                variant={category === 'All' ? 'default' : 'outline'}
                className="rounded-full whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Spaces Grid */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Explore Spaces</h1>
            <p className="text-muted-foreground">
              {propertiesForDisplay?.length || 0} spaces available
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <MapPin className="w-4 h-4" />
            Show map
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-secondary rounded-xl mb-3" />
                <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
                <div className="h-3 bg-secondary rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : propertiesForDisplay?.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No spaces found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {propertiesForDisplay?.map((property, index) => (
              <ExplorePropertyCard key={property.id} property={property} index={index} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Explore;