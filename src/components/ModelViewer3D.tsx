import { useEffect, useRef } from 'react';
import '@google/model-viewer';
import { Badge } from '@/components/ui/badge';
import { Beaker } from 'lucide-react';

// Extend JSX to include model-viewer
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          'camera-controls'?: boolean;
          'auto-rotate'?: boolean;
          'shadow-intensity'?: string;
          poster?: string;
          loading?: 'auto' | 'lazy' | 'eager';
          ar?: boolean;
          'ar-modes'?: string;
          style?: React.CSSProperties;
        },
        HTMLElement
      >;
    }
  }
}

interface ModelViewer3DProps {
  src: string;
  alt?: string;
  showExperimentalBadge?: boolean;
  className?: string;
  poster?: string;
}

const ModelViewer3D = ({ 
  src, 
  alt = '3D Model', 
  showExperimentalBadge = false,
  className = '',
  poster
}: ModelViewer3DProps) => {
  const viewerRef = useRef<HTMLElement>(null);

  return (
    <div className={`relative w-full ${className}`}>
      {showExperimentalBadge && (
        <Badge 
          variant="secondary" 
          className="absolute top-3 left-3 z-10 bg-violet-500/90 text-white border-0 gap-1.5"
        >
          <Beaker className="w-3 h-3" />
          Experimental
        </Badge>
      )}
      <model-viewer
        ref={viewerRef}
        src={src}
        alt={alt}
        camera-controls
        auto-rotate
        shadow-intensity="1"
        poster={poster}
        loading="lazy"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '300px',
          backgroundColor: 'hsl(var(--muted))',
          borderRadius: 'var(--radius)',
        }}
      />
    </div>
  );
};

export default ModelViewer3D;
