-- Add isFloorplanRelatedDoc column to space_document table
ALTER TABLE public.space_document 
ADD COLUMN is_floorplan_related_doc boolean DEFAULT false;