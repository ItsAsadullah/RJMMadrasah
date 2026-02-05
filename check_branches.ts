import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dnukypgmryhngsngnlin.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudWt5cGdtcnlobmdzbmdubGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzM5MjMsImV4cCI6MjA4NDQwOTkyM30.e3aPHdvQS294sg5XCW5v3OyB-QVcgYdArm0TYw75q6A';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBranches() {
  console.log("Checking branches table...");
  const { data, error } = await supabase.from('branches').select('*');
  
  if (error) {
    console.error("Error fetching branches:", error);
  } else {
    console.log("Branches found:", data);
  }
}

checkBranches();
