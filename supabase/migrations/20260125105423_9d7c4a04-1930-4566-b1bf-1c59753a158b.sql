-- Add unique constraint for space_amenity (space_id, name, room_type, room_number)
ALTER TABLE public.space_amenity 
ADD CONSTRAINT space_amenity_space_name_room_unique 
UNIQUE (space_id, name, room_type, room_number);

-- Add unique constraint for room (space_id, name)
ALTER TABLE public.room 
ADD CONSTRAINT room_space_name_unique 
UNIQUE (space_id, name);