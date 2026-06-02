
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase.from("teacher_salaries").select("id").limit(1);
  console.log("Data:", data);
  if (error) console.log("Error:", error);
  
  if (data && data.length > 0) {
     const testId = data[0].id;
     console.log("Trying to delete id:", testId);
     const { data: delData, error: delError } = await supabase.from("teacher_salaries").delete().eq("id", testId).select();
     console.log("Delete result data:", delData);
     console.log("Delete result error:", delError);
  }
}
check();
