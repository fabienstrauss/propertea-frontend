-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Add user_id to properties table for ownership
ALTER TABLE public.properties ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing public policies on properties
DROP POLICY IF EXISTS "Allow public insert access to properties" ON public.properties;
DROP POLICY IF EXISTS "Allow public read access to properties" ON public.properties;
DROP POLICY IF EXISTS "Allow public update access to properties" ON public.properties;

-- Create user-scoped policies for properties
CREATE POLICY "Users can view their own properties"
ON public.properties FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties"
ON public.properties FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties"
ON public.properties FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties"
ON public.properties FOR DELETE
USING (auth.uid() = user_id);

-- Update documents policies to be user-scoped through property ownership
DROP POLICY IF EXISTS "Allow public insert access to documents" ON public.documents;
DROP POLICY IF EXISTS "Allow public read access to documents" ON public.documents;
DROP POLICY IF EXISTS "Allow public update access to documents" ON public.documents;

CREATE POLICY "Users can view documents of their properties"
ON public.documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = documents.property_id 
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert documents to their properties"
ON public.documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = documents.property_id 
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update documents of their properties"
ON public.documents FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = documents.property_id 
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete documents of their properties"
ON public.documents FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = documents.property_id 
    AND properties.user_id = auth.uid()
  )
);

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();