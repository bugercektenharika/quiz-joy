-- Create a table for storing quiz submissions
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security but allow public access for this quiz
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert submissions (public quiz)
CREATE POLICY "Anyone can submit answers" 
ON public.submissions 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to count submissions (for the counter)
CREATE POLICY "Anyone can count submissions" 
ON public.submissions 
FOR SELECT 
USING (true);

-- Create a simple counter table for fast access
CREATE TABLE public.submission_count (
  id INTEGER PRIMARY KEY DEFAULT 1,
  count INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Initialize the counter
INSERT INTO public.submission_count (id, count) VALUES (1, 0);

-- Allow public read access to the counter
ALTER TABLE public.submission_count ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read count" 
ON public.submission_count 
FOR SELECT 
USING (true);

-- Allow updates to counter (will be done via edge function with service role)
CREATE POLICY "Anyone can update count" 
ON public.submission_count 
FOR UPDATE 
USING (true);