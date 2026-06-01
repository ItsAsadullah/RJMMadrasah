import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function test() {
  console.log("Testing student_waivers...");
  const { data: wvData, error: wvErr } = await supabase.from("student_waivers")
    .select("*, fee_types(name_bn), students(name_bn, class_name)")
    .limit(1);
  console.log(wvErr ? "Error: " + wvErr.message : "Success");

  console.log("Testing teacher_salaries inner join...");
  const { data: tsData, error: tsErr } = await supabase.from("teacher_salaries")
    .select("id, teachers!inner(branch_id)")
    .limit(1);
  console.log(tsErr ? "Error: " + tsErr.message : "Success");

  console.log("Testing teacher_salaries without inner...");
  const { data: tsData2, error: tsErr2 } = await supabase.from("teacher_salaries")
    .select("id, teachers(branch_id)")
    .limit(1);
  console.log(tsErr2 ? "Error: " + tsErr2.message : "Success");
}

test();
