
-- Temporarily remove the foreign key constraint to allow importing legacy data with old user_ids
ALTER TABLE space DROP CONSTRAINT IF EXISTS space_user_id_fkey;
