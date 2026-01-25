-- Fix security warning: Set search_path for the function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix contact insert policy to require authentication
DROP POLICY IF EXISTS "Anyone can insert contacts" ON public.contact;
CREATE POLICY "Authenticated users can insert contacts" ON public.contact FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Add missing columns to space_image
ALTER TABLE public.space_image ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Add missing columns to space_3d_model
ALTER TABLE public.space_3d_model ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE public.space_3d_model ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.space_3d_model ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add additional amenity status values
ALTER TYPE public.amenity_status ADD VALUE IF NOT EXISTS 'provided';
ALTER TYPE public.amenity_status ADD VALUE IF NOT EXISTS 'not_provided';
ALTER TYPE public.amenity_status ADD VALUE IF NOT EXISTS 'unknown';

-- Add 'active' to space_status
ALTER TYPE public.space_status ADD VALUE IF NOT EXISTS 'active';