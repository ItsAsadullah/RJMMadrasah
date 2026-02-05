
export type PromotionStudent = {
  id: string; // student uuid
  student_id: string; // text id
  name_en: string;
  name_bn?: string; // Added name_bn
  roll_no: string;
  total_marks: number;
  gpa: number;
  status: 'passed' | 'failed' | 'manual_passed'; // Added manual_passed
  failed_subjects: string[];
  subject_marks: Record<string, number>; // subject_name -> marks
  new_roll?: number;
  prev_class_name?: string;
  is_manual?: boolean; // New flag
  manual_reason?: string; // New field
};

// Pure function for calculation
export function calculatePromotionLogic(
  students: { id: string, student_id: string, name_en: string, name_bn?: string, roll_no: string, class_name: string }[],
  marks: { student_id: string, marks_obtained: number, academic_subjects: { name: string, pass_marks: number } }[],
  passMarksPerSubject: number = 33
): PromotionStudent[] {
  const studentMap: Record<string, PromotionStudent> = {};

  // Initialize students
  students.forEach(s => {
    studentMap[s.student_id] = {
      id: s.id,
      student_id: s.student_id,
      name_en: s.name_en || 'Unknown',
      name_bn: s.name_bn || '', // Initialize name_bn
      roll_no: s.roll_no || '',
      total_marks: 0,
      gpa: 0,
      status: 'passed',
      failed_subjects: [],
      subject_marks: {},
      prev_class_name: s.class_name
    };
  });

  // Calculate marks
  marks?.forEach((m: any) => {
    const sId = m.student_id;
    if (studentMap[sId]) {
      const subjectName = m.academic_subjects?.name || 'Unknown';
      const mark = m.marks_obtained || 0;
      const subjectPassMark = m.academic_subjects?.pass_marks || passMarksPerSubject;
      
      studentMap[sId].subject_marks[subjectName] = mark;
      studentMap[sId].total_marks += mark;

      if (mark < subjectPassMark) {
        studentMap[sId].status = 'failed';
        studentMap[sId].failed_subjects.push(subjectName);
      }
    }
  });

  // Convert to array
  let processedList = Object.values(studentMap);

  // Tie-breaking priority: English > Bengali > Math > Science > Technology
  const getSubjectMark = (s: PromotionStudent, subjectPart: string) => {
    const key = Object.keys(s.subject_marks).find(k => k.toLowerCase().includes(subjectPart.toLowerCase()));
    return key ? s.subject_marks[key] : 0;
  };

  processedList.sort((a, b) => {
    // 1. Status: Passed first
    if (a.status !== b.status) {
      if (a.status === 'passed') return -1;
      if (b.status === 'passed') return 1;
      // if one is manual_passed and other is failed?
      // manual_passed should be treated as passed for sorting? 
      // For now, let's keep failed at bottom.
    }

    // 2. Total Marks (Descending)
    if (b.total_marks !== a.total_marks) {
      return b.total_marks - a.total_marks;
    }

    // 3. Tie-breaking
    const priorityChecks = [
      ['English', 'ইংরেজি'],
      ['Bengali', 'Bangla', 'বাংলা'],
      ['Math', 'Mathematics', 'গণিত'],
      ['Science', 'বিজ্ঞান'],
      ['Technology', 'ICT']
    ];

    for (const pGroup of priorityChecks) {
      let markA = 0;
      let markB = 0;
      for (const key of pGroup) {
         markA = Math.max(markA, getSubjectMark(a, key));
         markB = Math.max(markB, getSubjectMark(b, key));
      }
      if (markB !== markA) return markB - markA;
    }
    
    return 0;
  });

  // Assign New Roll to Passed Students
  let currentRoll = 1;
  processedList.forEach(s => {
    if (s.status === 'passed') {
      s.new_roll = currentRoll++;
    }
  });

  return processedList;
}
