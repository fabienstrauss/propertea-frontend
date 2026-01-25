-- Create enums
CREATE TYPE public.space_type AS ENUM ('property', 'event_space');
CREATE TYPE public.space_status AS ENUM ('draft', 'processing', 'ready', 'published');
CREATE TYPE public.amenity_status AS ENUM ('pending', 'verified', 'missing', 'not_applicable');
CREATE TYPE public.processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE public.observation_severity AS ENUM ('info', 'warning', 'critical');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create space table
CREATE TABLE public.space (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  description TEXT,
  type public.space_type NOT NULL DEFAULT 'property',
  status public.space_status NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room table
CREATE TABLE public.room (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES public.space(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_type TEXT,
  room_number INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create space_document table
CREATE TABLE public.space_document (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES public.space(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  storage_url TEXT,
  processing_status public.processing_status NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create space_image table
CREATE TABLE public.space_image (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES public.space(id) ON DELETE CASCADE,
  storage_url TEXT NOT NULL,
  file_name TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create space_amenity table
CREATE TABLE public.space_amenity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES public.space(id) ON DELETE CASCADE,
  room_type TEXT,
  room_number INTEGER DEFAULT 1,
  name TEXT NOT NULL,
  required BOOLEAN DEFAULT false,
  status public.amenity_status NOT NULL DEFAULT 'pending',
  image_url TEXT,
  image_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create space_3d_model table
CREATE TABLE public.space_3d_model (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES public.space(id) ON DELETE CASCADE,
  storage_url TEXT NOT NULL,
  file_name TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create observation table
CREATE TABLE public.observation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES public.space(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  severity public.observation_severity NOT NULL DEFAULT 'info',
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact table
CREATE TABLE public.contact (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_document ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_image ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_amenity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_3d_model ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for space
CREATE POLICY "Users can view their own spaces" ON public.space FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own spaces" ON public.space FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own spaces" ON public.space FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own spaces" ON public.space FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Published spaces are viewable by all" ON public.space FOR SELECT USING (status = 'published');

-- RLS policies for room (through space ownership)
CREATE POLICY "Users can manage rooms of their spaces" ON public.room FOR ALL USING (
  EXISTS (SELECT 1 FROM public.space WHERE space.id = room.space_id AND space.user_id = auth.uid())
);

-- RLS policies for space_document
CREATE POLICY "Users can manage documents of their spaces" ON public.space_document FOR ALL USING (
  EXISTS (SELECT 1 FROM public.space WHERE space.id = space_document.space_id AND space.user_id = auth.uid())
);

-- RLS policies for space_image
CREATE POLICY "Users can manage images of their spaces" ON public.space_image FOR ALL USING (
  EXISTS (SELECT 1 FROM public.space WHERE space.id = space_image.space_id AND space.user_id = auth.uid())
);
CREATE POLICY "Published space images are viewable by all" ON public.space_image FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.space WHERE space.id = space_image.space_id AND space.status = 'published')
);

-- RLS policies for space_amenity
CREATE POLICY "Users can manage amenities of their spaces" ON public.space_amenity FOR ALL USING (
  EXISTS (SELECT 1 FROM public.space WHERE space.id = space_amenity.space_id AND space.user_id = auth.uid())
);

-- RLS policies for space_3d_model
CREATE POLICY "Users can manage 3d models of their spaces" ON public.space_3d_model FOR ALL USING (
  EXISTS (SELECT 1 FROM public.space WHERE space.id = space_3d_model.space_id AND space.user_id = auth.uid())
);
CREATE POLICY "Published space 3d models are viewable by all" ON public.space_3d_model FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.space WHERE space.id = space_3d_model.space_id AND space.status = 'published')
);

-- RLS policies for observation
CREATE POLICY "Users can manage observations of their spaces" ON public.observation FOR ALL USING (
  EXISTS (SELECT 1 FROM public.space WHERE space.id = observation.space_id AND space.user_id = auth.uid())
);

-- RLS policies for contact
CREATE POLICY "Anyone can insert contacts" ON public.contact FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own contacts" ON public.contact FOR SELECT USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_space_updated_at BEFORE UPDATE ON public.space FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_room_updated_at BEFORE UPDATE ON public.room FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_space_document_updated_at BEFORE UPDATE ON public.space_document FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_space_image_updated_at BEFORE UPDATE ON public.space_image FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_space_amenity_updated_at BEFORE UPDATE ON public.space_amenity FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_space_3d_model_updated_at BEFORE UPDATE ON public.space_3d_model FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_observation_updated_at BEFORE UPDATE ON public.observation FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for space files
INSERT INTO storage.buckets (id, name, public) VALUES ('space-files', 'space-files', true);

-- Storage policies
CREATE POLICY "Users can upload space files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'space-files' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can view space files" ON storage.objects FOR SELECT USING (bucket_id = 'space-files');
CREATE POLICY "Users can delete their space files" ON storage.objects FOR DELETE USING (bucket_id = 'space-files' AND auth.uid() IS NOT NULL);