const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dnukypgmryhngsngnlin.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudWt5cGdtcnlobmdz\r\nbmdubGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzM5MjMsImV4cCI6MjA4NDQwOTkyM30.e3aPHdvQS294sg5XCW5v3OyB-QVcgYdArm0TYw75q6A'.replace(/\s+/g, '');

async function inspect() {
    let res1 = await fetch(supabaseUrl + '/rest/v1/teacher_salaries?select=*&limit=1', {
        headers: { apikey: supabaseKey, Authorization: 'Bearer ' + supabaseKey, Accept: 'text/csv' }
    });
    console.log("teacher_salaries headers:", await res1.text());
}
inspect();
