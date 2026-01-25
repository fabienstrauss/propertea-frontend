
-- Allow null user_id for legacy imported spaces
ALTER TABLE space ALTER COLUMN user_id DROP NOT NULL;

-- Add RLS policy to allow viewing orphan spaces (spaces without user_id)
CREATE POLICY "Orphan spaces are viewable by authenticated users" 
ON space 
FOR SELECT 
TO authenticated
USING (user_id IS NULL);
