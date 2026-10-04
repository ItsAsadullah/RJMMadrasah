export type RankType = 'sequential' | 'excel';

interface RankableResult {
    student_id: string;
    summary: { status: string; gpa: number; total: number };
}

export function compareResults(a: RankableResult, b: RankableResult, rankType: RankType): number {
    if (rankType === 'excel') {
        const aPassed = a.summary.status === 'Pass';
        const bPassed = b.summary.status === 'Pass';
        if (aPassed !== bPassed) return aPassed ? -1 : 1;
        return b.summary.total - a.summary.total;
    }

    // Preserve the existing GPA-first merit calculation.
    if (a.summary.status === 'Fail' && b.summary.status !== 'Fail') return 1;
    if (b.summary.status === 'Fail' && a.summary.status !== 'Fail') return -1;
    return b.summary.gpa - a.summary.gpa || b.summary.total - a.summary.total;
}

export function assignResultRanks<T extends RankableResult>(results: T[], rankType: RankType): (T & { rank: number | '-' })[] {
    const sorted = [...results].sort((a, b) => compareResults(a, b, rankType));
    const ranks = new Map<string, number | '-'>();
    let passedCount = 0;
    let previousTotal: number | undefined;
    let previousRank = 0;

    for (const result of sorted) {
        if (result.summary.status !== 'Pass') {
            ranks.set(result.student_id, '-');
            continue;
        }

        passedCount++;
        const rank = rankType === 'excel' && result.summary.total === previousTotal
            ? previousRank
            : passedCount;
        ranks.set(result.student_id, rank);
        previousTotal = result.summary.total;
        previousRank = rank;
    }

    return results.map(result => ({ ...result, rank: ranks.get(result.student_id) ?? '-' }));
}
