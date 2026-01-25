-- Drop any existing storage policies
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete access" ON storage.objects;

-- Create fully permissive policies for all storage operations
CREATE POLICY "Allow all SELECT on storage" ON storage.objects
FOR SELECT USING (true);

CREATE POLICY "Allow all INSERT on storage" ON storage.objects
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all UPDATE on storage" ON storage.objects
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow all DELETE on storage" ON storage.objects
FOR DELETE USING (true);