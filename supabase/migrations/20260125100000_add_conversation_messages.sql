-- Create conversation_message table to store user and assistant messages from realtime sessions
CREATE TABLE IF NOT EXISTS public.conversation_message (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id uuid NOT NULL REFERENCES public.space(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL,
    metadata jsonb DEFAULT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create index for efficient queries by space_id
CREATE INDEX idx_conversation_message_space_id ON public.conversation_message(space_id);

-- Create index for ordering by creation time
CREATE INDEX idx_conversation_message_created_at ON public.conversation_message(created_at);

-- Disable RLS for this table
ALTER TABLE public.conversation_message DISABLE ROW LEVEL SECURITY;
