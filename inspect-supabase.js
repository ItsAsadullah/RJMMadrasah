const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dnukypgmryhngsngnlin.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudWt5cGdtcnlobmdz\r\nbmdubGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzM5MjMsImV4cCI6MjA4NDQwOTkyM30.e3aPHdvQS294sg5XCW5v3OyB-QVcgYdArm0TYw75q6A'.replace(/\s+/g, '');

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("Checking columns of student_waivers...");
    let { data: colsW, error: errW } = await supabase.from('student_waivers').select('*').limit(1);
    console.log(errW ? errW : Object.keys(colsW[0] || {}));

    console.log("Checking columns of teacher_salaries...");
    let { data: colsT, error: errT } = await supabase.from('teacher_salaries').select('*').limit(1);
    console.log(errT ? errT : Object.keys(colsT[0] || {}));

    let { error: err2 } = await supabase.from('student_waivers').select('*, fee_types(id)').limit(1);
    console.log("Join student_waivers -> fee_types:", err2 ? err2.message : "OK");

    let { error: err3 } = await supabase.from('student_waivers').select('*, students(id)').limit(1);
    console.log("Join student_waivers -> students:", err3 ? err3.message : "OK");

    let { error: err4 } = await supabase.from('student_waivers').select('*, students!inner(id)').limit(1);
    console.log("Join student_waivers -> students!inner:", err4 ? err4.message : "OK");

    let { error: err5 } = await supabase.from('student_waivers').select('*, students:student_id(id)').limit(1);
    console.log("Join student_waivers -> students:student_id:", err5 ? err5.message : "OK");
}

inspect();
