import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Home, PartyPopper } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Property {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  status: string | null;
  space_type: string;
  created_at: string;
  updated_at?: string;
}

interface PropertyTableProps {
  properties: Property[];
}

const PropertyTable = ({ properties }: PropertyTableProps) => {
  const navigate = useNavigate();

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Type</TableHead>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((property) => {
            const isEventSpace = property.space_type === 'event_space';
            return (
              <TableRow
                key={property.id}
                onClick={() => navigate(`/property/${property.id}`)}
                className="cursor-pointer hover:bg-secondary/50"
              >
                <TableCell>
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
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
                </TableCell>
                <TableCell className="font-medium">{property.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {property.address || '-'}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(property.status)}`}>
                    {property.status || 'draft'}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(property.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </motion.div>
  );
};

export default PropertyTable;
