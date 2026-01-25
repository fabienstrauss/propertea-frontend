-- Add public SELECT policy for properties (anyone can view all properties)
CREATE POLICY "Anyone can view all properties" 
ON public.properties 
FOR SELECT 
USING (true);