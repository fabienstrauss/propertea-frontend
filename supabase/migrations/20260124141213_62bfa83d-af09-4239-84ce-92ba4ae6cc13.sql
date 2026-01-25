-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table (linked to properties)
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  processing_status TEXT DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'processing', 'completed', 'error')),
  extracted_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- For now, allow public access (before auth is added)
CREATE POLICY "Allow public read access to properties"
  ON public.properties FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to properties"
  ON public.properties FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to properties"
  ON public.properties FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read access to documents"
  ON public.documents FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to documents"
  ON public.documents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to documents"
  ON public.documents FOR UPDATE
  USING (true);

-- Create storage bucket for property documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-documents', 'property-documents', true);

-- Storage policies for public access
CREATE POLICY "Allow public uploads to property-documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'property-documents');

CREATE POLICY "Allow public read from property-documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-documents');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();