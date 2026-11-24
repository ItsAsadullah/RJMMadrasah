export type SubjectMark = { marks_obtained: number | null; full_marks: number; pass_marks?: number | null };

export function subjectGrade(mark: SubjectMark) {
  if (mark.marks_obtained == null || !Number.isFinite(mark.marks_obtained) ||
      !Number.isFinite(mark.full_marks) || mark.full_marks <= 0 ||
      mark.marks_obtained < 0 || mark.marks_obtained > mark.full_marks) {
    return { gp: 0, grade: 'N/A', pending: true };
  }
  const percent = mark.marks_obtained * 100 / mark.full_marks;
  const passed = mark.marks_obtained >= (mark.pass_marks ?? mark.full_marks * 0.33);
  if (!passed) return { gp: 0, grade: 'F', pending: false };
  for (const [threshold, gp, grade] of [[80,5,'A+'],[70,4,'A'],[60,3.5,'A-'],[50,3,'B'],[40,2,'C']] as const) {
    if (percent >= threshold) return { gp, grade, pending: false };
  }
  return { gp: 1, grade: 'D', pending: false };
}

export function calculateGPA(marks: SubjectMark[]) {
  const grades = marks.map(subjectGrade);
  const total = marks.reduce((sum, m) => sum + (Number.isFinite(m.marks_obtained) ? m.marks_obtained! : 0), 0);
  if (!marks.length || grades.some(g => g.pending)) return { gpa: '0.00', grade: 'N/A', total, status: 'Pending' };
  if (grades.some(g => g.gp === 0)) return { gpa: '0.00', grade: 'F', total, status: 'Fail' };
  const gpa = grades.reduce((sum, g) => sum + g.gp, 0) / grades.length;
  const grade = gpa >= 5 ? 'A+' : gpa >= 4 ? 'A' : gpa >= 3.5 ? 'A-' : gpa >= 3 ? 'B' : gpa >= 2 ? 'C' : 'D';
  return { gpa: gpa.toFixed(2), grade, total, status: 'Pass' };
}
