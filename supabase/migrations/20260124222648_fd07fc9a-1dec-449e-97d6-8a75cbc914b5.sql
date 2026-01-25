-- Allow multiple amenities per room by removing the overly strict room uniqueness constraint
-- and replacing it with a uniqueness constraint per amenity within a room.

ALTER TABLE public.space_amenity
  DROP CONSTRAINT IF EXISTS unique_room_per_space;

ALTER TABLE public.space_amenity
  ADD CONSTRAINT unique_room_amenity_per_space
  UNIQUE (space_id, room_type, room_number, name);

-- Helpful index for common lookups
CREATE INDEX IF NOT EXISTS idx_space_amenity_space_room
  ON public.space_amenity (space_id, room_type, room_number);