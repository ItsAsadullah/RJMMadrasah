import { calculateGPA, subjectGrade } from './grading';
it('normalizes a 50-mark paper', () => {
  expect(calculateGPA([{ marks_obtained: 40, full_marks: 50 }])).toMatchObject({ gpa: '5.00', grade: 'A+', status: 'Pass' });
});
it('honors a subject-specific pass mark', () => {
  expect(subjectGrade({ marks_obtained: 35, full_marks: 50, pass_marks: 40 }).grade).toBe('F');
});
it('does not publish a grade for missing or invalid marks', () => {
  for (const marks_obtained of [null, NaN, -1, 101]) {
    expect(calculateGPA([{ marks_obtained, full_marks: 100 }]).status).toBe('Pending');
  }
  expect(calculateGPA([]).status).toBe('Pending');
});
