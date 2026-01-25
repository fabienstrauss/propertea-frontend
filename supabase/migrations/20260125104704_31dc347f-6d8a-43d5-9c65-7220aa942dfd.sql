-- Drop all RLS policies from all tables

-- contact policies
DROP POLICY IF EXISTS "Authenticated users can insert contacts" ON public.contact;
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contact;

-- observation policies
DROP POLICY IF EXISTS "Users can manage observations of their spaces" ON public.observation;

-- profiles policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- room policies
DROP POLICY IF EXISTS "Users can manage rooms of their spaces" ON public.room;

-- space policies
DROP POLICY IF EXISTS "Orphan spaces are viewable by authenticated users" ON public.space;
DROP POLICY IF EXISTS "Published spaces are viewable by all" ON public.space;
DROP POLICY IF EXISTS "Users can delete their own spaces" ON public.space;
DROP POLICY IF EXISTS "Users can insert their own spaces" ON public.space;
DROP POLICY IF EXISTS "Users can update their own spaces" ON public.space;
DROP POLICY IF EXISTS "Users can view their own spaces" ON public.space;

-- space_3d_model policies
DROP POLICY IF EXISTS "Published space 3d models are viewable by all" ON public.space_3d_model;
DROP POLICY IF EXISTS "Users can manage 3d models of their spaces" ON public.space_3d_model;

-- space_amenity policies
DROP POLICY IF EXISTS "Published space amenities are viewable by all" ON public.space_amenity;
DROP POLICY IF EXISTS "Users can manage amenities of their spaces" ON public.space_amenity;

-- space_document policies
DROP POLICY IF EXISTS "Users can manage documents of their spaces" ON public.space_document;
DROP POLICY IF EXISTS "Published space documents are viewable by all" ON public.space_document;

-- space_image policies
DROP POLICY IF EXISTS "Published space images are viewable by all" ON public.space_image;
DROP POLICY IF EXISTS "Users can manage images of their spaces" ON public.space_image;

-- Disable RLS on all tables
ALTER TABLE public.contact DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_message DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.observation DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.room DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.space DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_3d_model DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_amenity DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_document DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_image DISABLE ROW LEVEL SECURITY;