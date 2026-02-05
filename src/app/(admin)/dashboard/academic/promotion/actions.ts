'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { calculatePromotionLogic, PromotionStudent } from "./utils";

export async function getBranches() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('branches').select('*').eq('is_active', true).order('name');
  if (error) throw error;
  return data;
}

export async function getClasses(branchId?: string, academicYear?: number) {
  const supabase = await createClient();
  let query = supabase.from('academic_classes').select('*').eq('is_active', true);
  if (branchId) {
    query = query.eq('branch_id', branchId);
  }
  if (academicYear) {
    query = query.eq('academic_year', academicYear);
  }
  const { data, error } = await query.order('name');
  if (error) throw error;
  return data;
}

export async function getExams(academicYear: number, branchId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from('exams')
    .select('*')
    .eq('academic_year', academicYear);

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }
    
  const { data, error } = await query.order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
}

export async function getPromotionList(
  classId: string, 
  examId: string, 
  passMarksPerSubject: number = 33, 
  minGpa: number = 1.00
) {
  const supabase = await createClient();

  // 1. Get Students
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id, student_id, name_en, name_bn, roll_no, class_name')
    .eq('class_name', (await supabase.from('academic_classes').select('name').eq('id', classId).single()).data?.name)
    .eq('status', 'active');

  if (studentError) throw studentError;
  if (!students || students.length === 0) return [];

  // 2. Get Exam Marks
  const { data: marks, error: marksError } = await supabase
    .from('exam_marks')
    .select(`
      student_id,
      marks_obtained,
      subject_id,
      academic_subjects (name, full_marks, pass_marks)
    `)
    .eq('exam_id', examId);

  if (marksError) throw marksError;

  return calculatePromotionLogic(students, marks, passMarksPerSubject);
}

export async function promoteStudents(
  students: PromotionStudent[], 
  toClassId: string, 
  academicYear: number,
  fromClassId: string,
  examId: string
) {
  const supabase = await createClient();
  
  // Get target class name
  const { data: targetClass } = await supabase.from('academic_classes').select('name').eq('id', toClassId).single();
  if (!targetClass) throw new Error("Target class not found");

  // Include manually passed students
  const passedStudents = students.filter(s => 
    (s.status === 'passed' || s.status === 'manual_passed') && s.new_roll
  );
  
  if (passedStudents.length === 0) return { success: false, message: "No students to promote" };

  // Log entry creation first
  const { data: logEntry, error: logError } = await supabase.from('promotion_logs').insert({
    academic_year: academicYear,
    from_class_id: fromClassId,
    to_class_id: toClassId,
    exam_id: examId,
    total_students: students.length,
    promoted_count: passedStudents.length,
    failed_count: students.length - passedStudents.length,
    data: JSON.stringify(passedStudents.map(s => ({ 
      id: s.student_id, 
      name_bn: s.name_bn || s.name_en, // Store name
      old_roll: s.roll_no, 
      new_roll: s.new_roll, 
      marks: s.total_marks,
      is_manual: s.is_manual,
      manual_reason: s.manual_reason
    })))
  }).select().single();

  if (logError) throw logError;

  // Batch Update
  const updates = passedStudents.map(s => ({
    id: s.id, // match by uuid
    class_name: targetClass.name,
    roll_no: String(s.new_roll),
    academic_year: academicYear,
  }));

  const { error: updateError } = await supabase.from('students').upsert(updates, { onConflict: 'id' });

  if (updateError) throw updateError;

  revalidatePath('/dashboard/students');
  return { success: true, message: `Successfully promoted ${passedStudents.length} students` };
}

export async function getPromotionLogs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('promotion_logs')
    .select(`
      *,
      from_class:academic_classes!from_class_id(
        name,
        branch:branches(name, address, phone)
      ),
      to_class:academic_classes!to_class_id(name),
      exam:exams(title)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
