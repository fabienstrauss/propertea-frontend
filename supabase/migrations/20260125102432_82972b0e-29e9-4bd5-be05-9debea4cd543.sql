-- Add RLS policy to allow public viewing of amenities for published spaces
CREATE POLICY "Published space amenities are viewable by all"
  ON public.space_amenity
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM space
      WHERE space.id = space_amenity.space_id
      AND space.status = 'published'::space_status
    )
  );