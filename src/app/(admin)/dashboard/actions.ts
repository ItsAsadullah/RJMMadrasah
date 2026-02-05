'use server';

import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const todayStr = today.toISOString().split('T')[0];

  // 1. Total Students
  const { count: totalStudents, error: studentError } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  if (studentError) console.error("Error fetching students:", studentError);

  // 2. Total Teachers
  const { count: totalTeachers, error: teacherError } = await supabase
    .from('teachers')
    .select('*', { count: 'exact', head: true });

  if (teacherError) console.error("Error fetching teachers:", teacherError);

  // 3. Attendance (Today)
  // We need total active students count (already fetched)
  // And present students count for today
  // Note: Attendance table might store one row per student per day, or subject wise.
  // Based on AttendanceDashboard, it seems 'attendance' table has 'class_id', 'subject_id'.
  // We should count distinct student_id for general attendance (subject_id is null) or just any attendance.
  // Let's assume general attendance is marked with subject_id is null or we just count unique students present today.
  const { data: attendanceData, error: attendanceError } = await supabase
    .from('attendance')
    .select('student_id')
    .eq('date', todayStr)
    .eq('status', 'present');

  if (attendanceError) console.error("Error fetching attendance:", attendanceError);

  // Count unique students present
  const uniquePresentStudents = new Set(attendanceData?.map(a => a.student_id)).size;
  const attendancePercentage = totalStudents ? Math.round((uniquePresentStudents / totalStudents) * 100) : 0;

  // 4. Income (Current Month)
  const { data: incomeData, error: incomeError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('type', 'income')
    .gte('transaction_date', firstDayOfMonth);

  if (incomeError) console.error("Error fetching income:", incomeError);

  const totalIncome = incomeData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

  // 5. Recent Notices
  const { data: notices, error: noticeError } = await supabase
    .from('notices')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  if (noticeError) console.error("Error fetching notices:", noticeError);

  return {
    totalStudents: totalStudents || 0,
    totalTeachers: totalTeachers || 0,
    attendancePercentage,
    totalIncome,
    notices: notices || []
  };
}
