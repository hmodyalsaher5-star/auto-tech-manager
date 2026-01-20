import { createClient } from '@supabase/supabase-js'

// 1. ضع رابط المشروع هنا (الذي نسخته من Project URL)
const supabaseUrl = 'https://zpgtwhxraaszoplsznvd.supabase.co'

// 2. ضع مفتاح anon public هنا (الذي نسخته من API Keys)
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwZ3R3aHhyYWFzem9wbHN6bnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MDUxNDksImV4cCI6MjA4NDQ4MTE0OX0.7J-OibWCeCc2rCuwaFDsa8b2HQ7hgoSu3HULZMQ4eSQ'

export const supabase = createClient(supabaseUrl, supabaseKey)