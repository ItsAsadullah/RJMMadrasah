import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  hasSecondaryEnrollment,
  normalizeAcademicText,
  formatOriginDepartmentBadge,
} from '@/lib/secondaryEnrollment';

export async function POST(request: Request) {
  try {
    const { examId, studentId, className, classId, branchId, year } = await request.json();
    if (typeof studentId !== 'string' || !studentId.trim() || studentId.length > 100 || typeof className !== 'string' || className.length > 100 || !Number.isInteger(Number(year))) {
      return NextResponse.json({ error: 'তথ্য সঠিক নয়।' }, { status: 400 });
    }
    const service = createServiceClient();
    const { data: exam } = await service.from('exams').select('id,title,academic_year,branch_id').eq('id', examId).eq('status', 'published').eq('branch_id', branchId).eq('academic_year', Number(year)).single();
    if (!exam) return NextResponse.json({ error: 'প্রকাশিত ফলাফল পাওয়া যায়নি।' }, { status: 404 });
    const { data: student } = await service.from('students').select('*').eq('student_id', studentId.trim()).single();
    if (!student) return NextResponse.json({ error: 'ফলাফল পাওয়া যায়নি।' }, { status: 404 });

    let marksQuery = service.from('exam_marks').select('marks_obtained,academic_subjects!inner(name,full_marks,pass_marks,code,class_id,academic_classes!inner(id,name,branch_id,academic_year))')
      .eq('exam_id', exam.id).eq('student_id', student.student_id)
      .eq('academic_subjects.academic_classes.branch_id', exam.branch_id)
      .eq('academic_subjects.academic_classes.academic_year', exam.academic_year);

    if (typeof classId === 'string' && /^[0-9a-f-]{36}$/i.test(classId)) {
      marksQuery = marksQuery.eq('academic_subjects.class_id', classId);
    } else {
      marksQuery = marksQuery.eq('academic_subjects.academic_classes.name', className);
    }

    const { data: marks, error } = await marksQuery;
    if (error) throw error;
    if (!marks?.length) return NextResponse.json({ error: 'এই শ্রেণি ও পরীক্ষার ফলাফল পাওয়া যায়নি।' }, { status: 404 });
    const { data: branch } = await service.from('branches').select('id,name,address').eq('id', exam.branch_id).single();

    const matchedClassName = (marks[0] as any)?.academic_subjects?.academic_classes?.name || className;
    const isSecondaryClassResult =
      hasSecondaryEnrollment(student) &&
      normalizeAcademicText(student.secondary_class_name) === normalizeAcademicText(matchedClassName);

    const effectiveRoll = isSecondaryClassResult
      ? (student.secondary_roll_number || student.roll_number || student.roll_no || null)
      : (student.academic_year === exam.academic_year ? (student.roll_number ?? student.roll_no) : null);

    return NextResponse.json({
      student: {
        student_id: student.student_id,
        name_bn: student.name_bn,
        father_name_bn: student.father_name_bn,
        mother_name_bn: student.mother_name_bn,
        academic_year: student.academic_year,
        class_name: matchedClassName.trim(),
        roll_no: effectiveRoll,
        roll_number: effectiveRoll,
        origin_badge: isSecondaryClassResult ? formatOriginDepartmentBadge(student) : null,
      },
      exam, branch,
      marks: marks.map((item: any) => ({ marks_obtained: item.marks_obtained, subject_name: item.academic_subjects.name, full_marks: item.academic_subjects.full_marks, pass_marks: item.academic_subjects.pass_marks, code: item.academic_subjects.code })),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'ফলাফল লোড করা যায়নি। পরে চেষ্টা করুন।' }, { status: 500 }); }
}
