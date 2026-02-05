
import { calculatePromotionLogic } from './utils';

describe('Promotion Logic', () => {
  const students = [
    { id: '1', student_id: 'S001', name_en: 'Alice', roll_no: '1', class_name: 'Five' },
    { id: '2', student_id: 'S002', name_en: 'Bob', roll_no: '2', class_name: 'Five' },
    { id: '3', student_id: 'S003', name_en: 'Charlie', roll_no: '3', class_name: 'Five' },
    { id: '4', student_id: 'S004', name_en: 'David', roll_no: '4', class_name: 'Five' },
  ];

  const subjects = {
    english: { name: 'English', pass_marks: 33 },
    math: { name: 'Math', pass_marks: 33 },
    science: { name: 'Science', pass_marks: 33 },
    bangla: { name: 'Bangla', pass_marks: 33 },
  };

  it('should promote students who passed all subjects', () => {
    const marks = [
      { student_id: 'S001', marks_obtained: 80, academic_subjects: subjects.english },
      { student_id: 'S001', marks_obtained: 90, academic_subjects: subjects.math },
      { student_id: 'S002', marks_obtained: 30, academic_subjects: subjects.english }, // Fail
      { student_id: 'S002', marks_obtained: 90, academic_subjects: subjects.math },
    ];

    const result = calculatePromotionLogic(students, marks);
    
    const alice = result.find(s => s.student_id === 'S001');
    const bob = result.find(s => s.student_id === 'S002');

    expect(alice?.status).toBe('passed');
    expect(bob?.status).toBe('failed');
    expect(bob?.failed_subjects).toContain('English');
  });

  it('should rank students by total marks', () => {
    const marks = [
      // Alice: 150
      { student_id: 'S001', marks_obtained: 70, academic_subjects: subjects.english },
      { student_id: 'S001', marks_obtained: 80, academic_subjects: subjects.math },
      // Charlie: 160
      { student_id: 'S003', marks_obtained: 80, academic_subjects: subjects.english },
      { student_id: 'S003', marks_obtained: 80, academic_subjects: subjects.math },
    ];

    const result = calculatePromotionLogic(students, marks);
    const passed = result.filter(s => s.status === 'passed');
    
    expect(passed[0].student_id).toBe('S003'); // Charlie First
    expect(passed[0].new_roll).toBe(1);
    expect(passed[1].student_id).toBe('S001'); // Alice Second
    expect(passed[1].new_roll).toBe(2);
  });

  it('should apply tie-breaking rules (English > Bangla > Math)', () => {
    // Both have 160 total
    const marks = [
      // Alice: Eng 85, Math 75 = 160
      { student_id: 'S001', marks_obtained: 85, academic_subjects: subjects.english },
      { student_id: 'S001', marks_obtained: 75, academic_subjects: subjects.math },
      // Charlie: Eng 80, Math 80 = 160
      { student_id: 'S003', marks_obtained: 80, academic_subjects: subjects.english },
      { student_id: 'S003', marks_obtained: 80, academic_subjects: subjects.math },
    ];

    const result = calculatePromotionLogic(students, marks);
    const passed = result.filter(s => s.status === 'passed');

    // Alice has higher English, so she should be first
    expect(passed[0].student_id).toBe('S001');
    expect(passed[1].student_id).toBe('S003');
  });
  
  it('should apply tie-breaking rules 2nd level (Same English, Higher Bangla)', () => {
    // Both have 160 total
    const marks = [
      // Alice: Eng 80, Bangla 45, Math 35 = 160
      { student_id: 'S001', marks_obtained: 80, academic_subjects: subjects.english },
      { student_id: 'S001', marks_obtained: 45, academic_subjects: subjects.bangla },
      { student_id: 'S001', marks_obtained: 35, academic_subjects: subjects.math },
      
      // Charlie: Eng 80, Bangla 40, Math 40 = 160
      { student_id: 'S003', marks_obtained: 80, academic_subjects: subjects.english },
      { student_id: 'S003', marks_obtained: 40, academic_subjects: subjects.bangla },
      { student_id: 'S003', marks_obtained: 40, academic_subjects: subjects.math },
    ];

    const result = calculatePromotionLogic(students, marks);
    const passed = result.filter(s => s.status === 'passed');

    // Alice has higher Bangla, so she should be first
    expect(passed[0].student_id).toBe('S001');
    expect(passed[1].student_id).toBe('S003');
  });
});
