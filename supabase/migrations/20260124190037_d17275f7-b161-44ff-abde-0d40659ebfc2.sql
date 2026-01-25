-- Drop the old status check constraint and add one that includes draft and published
ALTER TABLE public.space DROP CONSTRAINT IF EXISTS space_status_check;

-- Add new constraint allowing draft and published
ALTER TABLE public.space ADD CONSTRAINT space_status_check 
CHECK (status IN ('active', 'pending', 'completed', 'draft', 'published'));