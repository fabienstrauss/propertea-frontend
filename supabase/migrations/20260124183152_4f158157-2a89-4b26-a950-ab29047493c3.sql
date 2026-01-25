-- Create space_image table for property gallery images
CREATE TABLE public.space_image (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES public.space(id) ON DELETE CASCADE,
  storage_url TEXT NOT NULL,
  storage_path TEXT,
  file_name TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on space_image
ALTER TABLE public.space_image ENABLE ROW LEVEL SECURITY;

-- RLS policies for space_image
CREATE POLICY "Anyone can view space images"
ON public.space_image FOR SELECT
USING (true);

CREATE POLICY "Users can insert images to their spaces"
ON public.space_image FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.space
  WHERE space.id = space_image.space_id AND space.user_id = auth.uid()
));

CREATE POLICY "Users can update images of their spaces"
ON public.space_image FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.space
  WHERE space.id = space_image.space_id AND space.user_id = auth.uid()
));

CREATE POLICY "Users can delete images of their spaces"
ON public.space_image FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.space
  WHERE space.id = space_image.space_id AND space.user_id = auth.uid()
));

-- Create space_amenity table to persist amenity checklist data
CREATE TABLE public.space_amenity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES public.space(id) ON DELETE CASCADE,
  amenity_id TEXT NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('provided', 'not_provided', 'unknown')),
  required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(space_id, amenity_id)
);

-- Enable RLS on space_amenity
ALTER TABLE public.space_amenity ENABLE ROW LEVEL SECURITY;

-- RLS policies for space_amenity
CREATE POLICY "Anyone can view space amenities"
ON public.space_amenity FOR SELECT
USING (true);

CREATE POLICY "Users can insert amenities to their spaces"
ON public.space_amenity FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.space
  WHERE space.id = space_amenity.space_id AND space.user_id = auth.uid()
));

CREATE POLICY "Users can update amenities of their spaces"
ON public.space_amenity FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.space
  WHERE space.id = space_amenity.space_id AND space.user_id = auth.uid()
));

CREATE POLICY "Users can delete amenities of their spaces"
ON public.space_amenity FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.space
  WHERE space.id = space_amenity.space_id AND space.user_id = auth.uid()
));

-- Add trigger for updated_at on space_amenity
CREATE TRIGGER update_space_amenity_updated_at
BEFORE UPDATE ON public.space_amenity
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();