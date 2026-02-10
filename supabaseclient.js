import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lvvcgvznrlwtjpkpktmo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dmNndnpucmx3dGpwa3BrdG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MTc0NTYsImV4cCI6MjA4NjE5MzQ1Nn0.KEyHQ6lZRXhUNHVIRN6B261S3tj7HpjSKk0eRY0UasE';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
