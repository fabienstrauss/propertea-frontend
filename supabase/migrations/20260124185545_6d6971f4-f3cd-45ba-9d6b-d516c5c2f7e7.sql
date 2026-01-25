-- Add image_url column to space_amenity for verification images
ALTER TABLE public.space_amenity
ADD COLUMN image_url text,
ADD COLUMN image_path text;