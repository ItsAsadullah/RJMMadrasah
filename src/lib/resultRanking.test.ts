import { assignResultRanks, compareResults } from './resultRanking';

const result = (student_id: string, total: number, gpa = 4.63, status = 'Pass') => ({
    student_id,
    summary: { total, gpa, status },
});

describe('Exam merit ranking', () => {
    it('preserves separate ranks and GPA-first ordering in the current method', () => {
        const ranked = assignResultRanks([
            result('first', 546), result('second', 546), result('higher-gpa', 480, 5),
        ], 'sequential');
        expect(ranked.map(student => student.rank)).toEqual([2, 3, 1]);
    });

    it('gives equal totals the same rank regardless of GPA and skips occupied places', () => {
        const ranked = assignResultRanks([
            result('lower', 480, 5), result('first', 546), result('second', 546, 4.5),
            result('third', 480, 3.5), result('last', 342, 2.92),
        ], 'excel');
        expect(ranked.map(student => student.rank)).toEqual([3, 1, 1, 3, 5]);
        expect([...ranked].sort((a, b) => compareResults(a, b, 'excel')).map(student => student.rank))
            .toEqual([1, 1, 3, 3, 5]);
    });

    it.each(['sequential', 'excel'] as const)('excludes failed and pending students from %s ranks', mode => {
        const ranked = assignResultRanks([
            result('failed', 600, 0, 'Fail'), result('pending', 0, 0, 'Pending'),
            result('first', 546), result('second', 480),
        ], mode);
        expect(ranked.map(student => student.rank)).toEqual(['-', '-', 1, 2]);
    });

    it('recalculates ranks when the administrator switches methods without mutating results', () => {
        const students = [result('first', 546), result('second', 546), result('third', 480)];
        expect(assignResultRanks(students, 'sequential').map(student => student.rank)).toEqual([1, 2, 3]);
        expect(assignResultRanks(students, 'excel').map(student => student.rank)).toEqual([1, 1, 3]);
        expect(assignResultRanks(students, 'sequential').map(student => student.rank)).toEqual([1, 2, 3]);
        expect(students[0]).not.toHaveProperty('rank');
        expect(assignResultRanks([], 'excel')).toEqual([]);
    });
});
