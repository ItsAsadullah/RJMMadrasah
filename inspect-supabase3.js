const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dnukypgmryhngsngnlin.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudWt5cGdtcnlobmdz\r\nbmdubGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzM5MjMsImV4cCI6MjA4NDQwOTkyM30.e3aPHdvQS294sg5XCW5v3OyB-QVcgYdArm0TYw75q6A'.replace(/\s+/g, '');

async function inspect() {
    const resSpec = await fetch(supabaseUrl + '/rest/v1/', { headers: { apikey: supabaseKey }});
    const spec = await resSpec.json();
    console.log("Teacher salaries props:", Object.keys(spec.definitions?.teacher_salaries?.properties || {}));
    console.log("Student waivers props:", Object.keys(spec.definitions?.student_waivers?.properties || {}));
    console.log(Object.keys(spec.definitions || {}).filter(k => k.includes('salaries') || k.includes('waivers') || k.includes('student')));
}
inspect();
