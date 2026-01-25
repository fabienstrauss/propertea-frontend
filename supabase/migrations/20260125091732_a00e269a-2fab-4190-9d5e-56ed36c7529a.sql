-- Rename type column to space_type to match code expectations
ALTER TABLE public.space RENAME COLUMN type TO space_type;

-- Add missing columns to space_document
ALTER TABLE public.space_document ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE public.space_document ADD COLUMN IF NOT EXISTS is_floorplan_related_doc BOOLEAN DEFAULT false;