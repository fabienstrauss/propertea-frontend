-- Create table for storing 3D model references
CREATE TABLE public.space_3d_model (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES public.space(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  storage_url TEXT NOT NULL,
  storage_path TEXT,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_space_3d_model_space_id ON public.space_3d_model(space_id);

-- Comment on table
COMMENT ON TABLE public.space_3d_model IS 'Stores references to 3D model files (.glb) for spaces';