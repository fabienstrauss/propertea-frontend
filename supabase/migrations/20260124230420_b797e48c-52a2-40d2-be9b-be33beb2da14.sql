-- Disable RLS and drop all policies for contact
ALTER TABLE public.contact DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contact;
DROP POLICY IF EXISTS "Users can insert their own contacts" ON public.contact;
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contact;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contact;

-- Disable RLS and drop all policies for observation
ALTER TABLE public.observation DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view observations" ON public.observation;
DROP POLICY IF EXISTS "Users can insert observations to their spaces" ON public.observation;
DROP POLICY IF EXISTS "Users can update observations of their spaces" ON public.observation;
DROP POLICY IF EXISTS "Users can delete observations of their spaces" ON public.observation;

-- Disable RLS and drop all policies for profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Disable RLS and drop all policies for room
ALTER TABLE public.room DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view rooms" ON public.room;
DROP POLICY IF EXISTS "Users can insert rooms to their spaces" ON public.room;
DROP POLICY IF EXISTS "Users can update rooms of their spaces" ON public.room;
DROP POLICY IF EXISTS "Users can delete rooms of their spaces" ON public.room;

-- Disable RLS and drop all policies for space
ALTER TABLE public.space DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view all spaces" ON public.space;
DROP POLICY IF EXISTS "Users can insert their own spaces" ON public.space;
DROP POLICY IF EXISTS "Users can update their own spaces" ON public.space;
DROP POLICY IF EXISTS "Users can delete their own spaces" ON public.space;

-- Disable RLS and drop all policies for space_amenity
ALTER TABLE public.space_amenity DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view space amenities" ON public.space_amenity;
DROP POLICY IF EXISTS "Users can insert amenities to their spaces" ON public.space_amenity;
DROP POLICY IF EXISTS "Users can update amenities of their spaces" ON public.space_amenity;
DROP POLICY IF EXISTS "Users can delete amenities of their spaces" ON public.space_amenity;

-- Disable RLS and drop all policies for space_document
ALTER TABLE public.space_document DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view space documents" ON public.space_document;
DROP POLICY IF EXISTS "Users can insert documents to their spaces" ON public.space_document;
DROP POLICY IF EXISTS "Users can update documents of their spaces" ON public.space_document;
DROP POLICY IF EXISTS "Users can delete documents of their spaces" ON public.space_document;

-- Disable RLS and drop all policies for space_image
ALTER TABLE public.space_image DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view space images" ON public.space_image;
DROP POLICY IF EXISTS "Users can insert images to their spaces" ON public.space_image;
DROP POLICY IF EXISTS "Users can update images of their spaces" ON public.space_image;
DROP POLICY IF EXISTS "Users can delete images of their spaces" ON public.space_image;