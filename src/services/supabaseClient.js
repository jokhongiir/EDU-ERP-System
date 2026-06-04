import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://gurmyvqbkrpyvfnunepu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1cm15dnFia3JweXZmbnVuZXB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjAzNjUsImV4cCI6MjA5MTczNjM2NX0.-OZAjhZq4Y053AediVuK8iG5YNapUsa--xRkghkmKyk';


export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});