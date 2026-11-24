'use server';

import { createAdminClient as createClient } from "@/lib/supabase/admin";
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

  const { data: source, error: sourceError } = await supabase.from('academic_classes')
    .select('name,branch_id,department,academic_year').eq('id', classId).single();
  if (sourceError || !source) throw new Error('Source class not found');
  const { data: exam, error: examError } = await supabase.from('exams').select('id')
    .eq('id', examId).eq('branch_id', source.branch_id).eq('academic_year', source.academic_year).single();
  if (examError || !exam) throw new Error('Exam does not belong to this branch and year');
  let studentQuery = supabase.from('students').select('id,student_id,name_en,name_bn,roll_no,class_name')
    .eq('class_name', source.name).eq('branch_id', source.branch_id).eq('academic_year', source.academic_year).eq('status', 'active');
  studentQuery = source.department ? studentQuery.eq('department', source.department) : studentQuery.is('department', null);
  const { data: students, error: studentError } = await studentQuery;
  const { data: subjects, error: subjectError } = await supabase.from('academic_subjects').select('name').eq('class_id', classId).eq('is_active', true);
  if (subjectError) throw subjectError;
  if (!subjects?.length) throw new Error('No active subjects found for this class');

  if (studentError) throw studentError;
  if (!students || students.length === 0) return [];

  // 2. Get Exam Marks
  const { data: marksData, error: marksError } = await supabase
    .from('exam_marks')
    .select(`
      student_id,
      marks_obtained,
      subject_id,
      academic_subjects!inner (name, full_marks, pass_marks, class_id)
    `)
    .eq('exam_id', examId).eq('academic_subjects.class_id', classId);

  if (marksError) throw marksError;

  // Transform data to match expected type (flatten array if needed)
  const marks = marksData?.map((m: any) => ({
    student_id: m.student_id,
    marks_obtained: m.marks_obtained,
    academic_subjects: Array.isArray(m.academic_subjects) ? m.academic_subjects[0] : m.academic_subjects
  })) || [];

  return calculatePromotionLogic(students, marks, passMarksPerSubject, subjects.map(subject => subject.name));
}

export async function promoteStudents(
  students: PromotionStudent[], 
  toClassId: string, 
  academicYear: number,
  fromClassId: string,
  examId: string
) {
  const supabase = await createClient();
  
  const fresh = await getPromotionList(fromClassId, examId);
  const passedStudents = students.filter(student => student.status === 'passed' || student.status === 'manual_passed');
  if (!passedStudents.length) return { success: false, message: 'No students to promote' };
  for (const student of passedStudents) {
    const actual = fresh.find(item => item.id === student.id);
    if (!actual || (student.status === 'passed' && actual.status !== 'passed')) throw new Error('Results changed; reload the list');
    if (student.status === 'manual_passed' && !student.manual_reason?.trim()) throw new Error('Manual promotion requires a reason');
  }
  const { error } = await supabase.rpc('promote_students_atomic', { payload: {
    from_class_id: fromClassId, to_class_id: toClassId, exam_id: examId, academic_year: academicYear,
    total_students: fresh.length, students: passedStudents,
  }});
  if (error) throw error;

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
