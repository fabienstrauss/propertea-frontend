-- Create storage bucket for property documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-documents', 'property-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for property-documents bucket
CREATE POLICY "Allow authenticated uploads to property-documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'property-documents');

CREATE POLICY "Allow public read from property-documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-documents');

CREATE POLICY "Allow authenticated delete from property-documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'property-documents');

CREATE POLICY "Allow authenticated update to property-documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'property-documents');