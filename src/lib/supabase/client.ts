import { createClient } from '@supabase/supabase-js'

// আমরা .env ফাইল থেকে URL এবং Key ডেকে আনছি
// বিল্ড টাইমে এরর এড়ানোর জন্য ফলব্যাক ভ্যালু ব্যবহার করা হয়েছে
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'example-key'

// Supabase কানেকশন তৈরি হচ্ছে
export const supabase = createClient(supabaseUrl, supabaseKey)