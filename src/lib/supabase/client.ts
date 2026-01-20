import { createClient } from '@supabase/supabase-js'

// আমরা .env ফাইল থেকে URL এবং Key ডেকে আনছি
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Supabase কানেকশন তৈরি হচ্ছে
export const supabase = createClient(supabaseUrl, supabaseKey)