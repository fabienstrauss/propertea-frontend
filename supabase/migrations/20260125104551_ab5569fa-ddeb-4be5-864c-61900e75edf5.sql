-- Add RLS policy to allow public access to floor plan documents for published spaces
CREATE POLICY "Published space documents are viewable by all" 
ON public.space_document 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM space 
  WHERE space.id = space_document.space_id 
  AND space.status = 'published'
));