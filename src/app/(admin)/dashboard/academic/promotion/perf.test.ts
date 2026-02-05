
import { calculatePromotionLogic } from './utils';

describe('Performance Test', () => {
  it('should process 1000 students in less than 5 seconds', () => {
    const students = [];
    const marks = [];
    const subjects = ['English', 'Bengali', 'Math', 'Science', 'Technology', 'History', 'Geography', 'Religion'];

    // Generate 1000 students
    for (let i = 0; i < 1000; i++) {
      const sId = `S${1000 + i}`;
      students.push({
        id: `uuid-${i}`,
        student_id: sId,
        name_en: `Student ${i}`,
        roll_no: `${i + 1}`,
        class_name: 'Five'
      });

      // Generate marks for each subject
      subjects.forEach(sub => {
        marks.push({
          student_id: sId,
          marks_obtained: Math.floor(Math.random() * 100),
          academic_subjects: { name: sub, pass_marks: 33 }
        });
      });
    }

    const start = performance.now();
    const result = calculatePromotionLogic(students, marks);
    const end = performance.now();
    const duration = end - start;

    console.log(`Processed ${students.length} students with ${marks.length} marks in ${duration.toFixed(2)}ms`);

    expect(result.length).toBe(1000);
    expect(duration).toBeLessThan(5000); // 5 seconds
  });
});
