
-- Drop the existing space_amenity table and recreate with new schema
DROP TABLE IF EXISTS public.space_amenity;

-- Create room type enum-like check constraint
CREATE TABLE public.space_amenity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES public.space(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL,
  room_number INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown',
  required BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  image_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Unique constraint on space_id, room_type, room_number
  CONSTRAINT unique_room_per_space UNIQUE (space_id, room_type, room_number),
  
  -- Status must be one of the allowed values
  CONSTRAINT valid_status CHECK (status IN ('provided', 'not_provided', 'unknown'))
);

-- Enable RLS
ALTER TABLE public.space_amenity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view space amenities"
ON public.space_amenity
FOR SELECT
USING (true);

CREATE POLICY "Users can insert amenities to their spaces"
ON public.space_amenity
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.space
  WHERE space.id = space_amenity.space_id
  AND space.user_id = auth.uid()
));

CREATE POLICY "Users can update amenities of their spaces"
ON public.space_amenity
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.space
  WHERE space.id = space_amenity.space_id
  AND space.user_id = auth.uid()
));

CREATE POLICY "Users can delete amenities of their spaces"
ON public.space_amenity
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.space
  WHERE space.id = space_amenity.space_id
  AND space.user_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_space_amenity_updated_at
BEFORE UPDATE ON public.space_amenity
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
