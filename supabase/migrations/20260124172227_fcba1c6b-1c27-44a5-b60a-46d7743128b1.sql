-- =============================================
-- SPACE INSPECTION SCHEMA MIGRATION
-- =============================================

-- 1. Create contact table
CREATE TABLE IF NOT EXISTS public.contact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Create space table (replaces properties, keeps user_id for ownership)
CREATE TABLE IF NOT EXISTS public.space (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contact(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  space_type TEXT NOT NULL DEFAULT 'property',
  address TEXT,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Create room table
CREATE TABLE IF NOT EXISTS public.room (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.space(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_type TEXT,
  floor_number INT,
  area_sqm DECIMAL(10,2),
  capacity INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. Create observation table
CREATE TABLE IF NOT EXISTS public.observation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.space(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.room(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  details TEXT NOT NULL,
  category TEXT,
  severity TEXT CHECK (severity IS NULL OR severity IN ('info', 'minor', 'major', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 5. Create new document table (will replace old documents)
CREATE TABLE IF NOT EXISTS public.space_document (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.space(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.room(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'pdf', 'document', 'other')),
  mime_type TEXT,
  storage_url TEXT NOT NULL,
  storage_path TEXT,
  file_size BIGINT,
  thumbnail_url TEXT,
  processing_status TEXT DEFAULT 'uploaded',
  extracted_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =============================================
-- MIGRATE EXISTING DATA
-- =============================================

-- Migrate properties to space
INSERT INTO public.space (id, user_id, name, address, description, status, created_at, updated_at)
SELECT 
  id,
  user_id,
  name,
  address,
  description,
  CASE 
    WHEN status = 'pending' THEN 'pending'
    WHEN status = 'active' THEN 'active'
    WHEN status = 'completed' THEN 'completed'
    ELSE 'active'
  END,
  created_at,
  updated_at
FROM public.properties
ON CONFLICT (id) DO NOTHING;

-- Migrate documents to space_document
INSERT INTO public.space_document (id, space_id, file_name, file_type, storage_url, storage_path, file_size, processing_status, extracted_data, created_at)
SELECT 
  id,
  property_id,
  file_name,
  CASE 
    WHEN file_type LIKE 'image/%' THEN 'image'
    WHEN file_type LIKE 'video/%' THEN 'video'
    WHEN file_type = 'application/pdf' THEN 'pdf'
    WHEN file_type LIKE 'application/%' THEN 'document'
    ELSE 'other'
  END,
  storage_path,
  storage_path,
  file_size,
  processing_status,
  extracted_data,
  created_at
FROM public.documents
WHERE property_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- DROP OLD TABLES
-- =============================================

DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_space_user ON public.space(user_id);
CREATE INDEX IF NOT EXISTS idx_space_contact ON public.space(contact_id);
CREATE INDEX IF NOT EXISTS idx_space_type ON public.space(space_type);
CREATE INDEX IF NOT EXISTS idx_space_status ON public.space(status);
CREATE INDEX IF NOT EXISTS idx_room_space ON public.room(space_id);
CREATE INDEX IF NOT EXISTS idx_observation_space ON public.observation(space_id);
CREATE INDEX IF NOT EXISTS idx_observation_room ON public.observation(room_id);
CREATE INDEX IF NOT EXISTS idx_space_document_space ON public.space_document(space_id);
CREATE INDEX IF NOT EXISTS idx_space_document_room ON public.space_document(room_id);
CREATE INDEX IF NOT EXISTS idx_contact_email ON public.contact(email);
CREATE INDEX IF NOT EXISTS idx_contact_user ON public.contact(user_id);

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================

CREATE TRIGGER contact_updated_at BEFORE UPDATE ON public.contact
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER space_updated_at BEFORE UPDATE ON public.space
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER room_updated_at BEFORE UPDATE ON public.room
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_document ENABLE ROW LEVEL SECURITY;

-- Contact policies (users manage their own contacts)
CREATE POLICY "Users can view their own contacts" ON public.contact FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own contacts" ON public.contact FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contacts" ON public.contact FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contacts" ON public.contact FOR DELETE USING (auth.uid() = user_id);

-- Space policies (users manage their own + public read for explore)
CREATE POLICY "Anyone can view all spaces" ON public.space FOR SELECT USING (true);
CREATE POLICY "Users can insert their own spaces" ON public.space FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own spaces" ON public.space FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own spaces" ON public.space FOR DELETE USING (auth.uid() = user_id);

-- Room policies (inherit from space ownership)
CREATE POLICY "Anyone can view rooms" ON public.room FOR SELECT USING (true);
CREATE POLICY "Users can insert rooms to their spaces" ON public.room FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.space WHERE id = space_id AND user_id = auth.uid()));
CREATE POLICY "Users can update rooms of their spaces" ON public.room FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.space WHERE id = space_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete rooms of their spaces" ON public.room FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.space WHERE id = space_id AND user_id = auth.uid()));

-- Observation policies (inherit from space ownership)
CREATE POLICY "Anyone can view observations" ON public.observation FOR SELECT USING (true);
CREATE POLICY "Users can insert observations to their spaces" ON public.observation FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.space WHERE id = space_id AND user_id = auth.uid()));
CREATE POLICY "Users can update observations of their spaces" ON public.observation FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.space WHERE id = space_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete observations of their spaces" ON public.observation FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.space WHERE id = space_id AND user_id = auth.uid()));

-- Document policies (inherit from space ownership)
CREATE POLICY "Anyone can view space documents" ON public.space_document FOR SELECT USING (true);
CREATE POLICY "Users can insert documents to their spaces" ON public.space_document FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.space WHERE id = space_id AND user_id = auth.uid()));
CREATE POLICY "Users can update documents of their spaces" ON public.space_document FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.space WHERE id = space_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete documents of their spaces" ON public.space_document FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.space WHERE id = space_id AND user_id = auth.uid()));