"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import TranscriptSheet from "@/components/academic/TranscriptSheet";
import { getBranchAddress } from "@/lib/branchUtils";

// Helper functions (same as in public result page)
const getGradePoint = (marks: number) => {
    if (marks >= 80) return { gp: 5.00, grade: 'A+' };
    if (marks >= 70) return { gp: 4.00, grade: 'A' };
    if (marks >= 60) return { gp: 3.50, grade: 'A-' };
    if (marks >= 50) return { gp: 3.00, grade: 'B' };
    if (marks >= 40) return { gp: 2.00, grade: 'C' };
    if (marks >= 33) return { gp: 1.00, grade: 'D' };
    return { gp: 0.00, grade: 'F' };
};

const calculateGPA = (marksList: any[]) => {
    let totalGP = 0;
    let failCount = 0;
    let totalMarks = 0;
    let subjectCount = 0;

    marksList.forEach(m => {
        const { gp } = getGradePoint(m.marks_obtained || 0);
        if (gp === 0) failCount++;
        totalGP += gp;
        totalMarks += (m.marks_obtained || 0);
        subjectCount++;
    });

    if (subjectCount === 0) return { gpa: "0.00", grade: "N/A", total: 0, status: "Pending" };

    const gpa = failCount > 0 ? 0 : (totalGP / subjectCount);
    let grade = 'F';
    
    if (failCount === 0) {
        if (gpa >= 5) grade = 'A+';
        else if (gpa >= 4) grade = 'A';
        else if (gpa >= 3.5) grade = 'A-';
        else if (gpa >= 3) grade = 'B';
        else if (gpa >= 2) grade = 'C';
        else if (gpa >= 1) grade = 'D';
    }

    return {
        gpa: gpa.toFixed(2),
        grade,
        total: totalMarks,
        status: failCount > 0 ? 'Fail' : 'Pass'
    };
};

export default function TranscriptPreviewModal({ 
    isOpen, 
    onClose, 
    studentDbId, 
    examId 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    studentDbId: string; 
    examId: string 
}) {
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && studentDbId && examId) {
            fetchResultData();
        } else {
            setResultData(null);
            setError(null);
        }
    }, [isOpen, studentDbId, examId]);

    const fetchResultData = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch Student
            const { data: student, error: stdError } = await supabase
                .from("students")
                .select("*")
                .eq("id", studentDbId)
                .single();

            if (stdError || !student) throw new Error("শিক্ষার্থীর তথ্য পাওয়া যায়নি।");

            // 2. Fetch Exam
            const { data: exam, error: exError } = await supabase
                .from("exams")
                .select("*")
                .eq("id", examId)
                .single();

            if (exError || !exam) throw new Error("পরীক্ষার তথ্য পাওয়া যায়নি।");

            // 3. Fetch Branch
            let branch = null;
            if (student.branch_id) {
                const { data: branchData } = await supabase
                    .from("branches")
                    .select("address")
                    .eq("id", student.branch_id)
                    .single();
                branch = branchData;
            }

            // 4. Fetch Marks
            const { data: marks, error: marksError } = await supabase
                .from("exam_marks")
                .select(`
                    marks_obtained,
                    academic_subjects (
                        name,
                        full_marks,
                        code,
                        is_active
                    )
                `)
                .eq("exam_id", examId)
                .eq("student_id", student.student_id);

            if (marksError) throw marksError;
            if (!marks || marks.length === 0) throw new Error("এই পরীক্ষার কোনো ফলাফল এন্ট্রি করা হয়নি।");

            const processedMarks = marks
                .filter((m: any) => m.academic_subjects && m.academic_subjects.is_active !== false)
                .map((m: any) => ({
                    subject_name: m.academic_subjects.name,
                    full_marks: m.academic_subjects.full_marks || 100,
                    marks_obtained: m.marks_obtained,
                    code: m.academic_subjects.code
                }));

            processedMarks.sort((a, b) => (a.code > b.code ? 1 : -1));

            const summary = calculateGPA(processedMarks);

            setResultData({
                student,
                exam,
                branch,
                marks: processedMarks,
                summary
            });

        } catch (err: any) {
            setError(err.message || "ফলাফল লোড করতে সমস্যা হয়েছে।");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (!resultData) return;
        
        const newTitle = `${resultData.exam.title} - ${resultData.student.student_id} - ${resultData.student.name_bn}`;
        const originalTitle = document.title;
        
        document.title = newTitle;
        const titleTags = document.getElementsByTagName('title');
        const originalTitleTags: string[] = [];
        for (let i = 0; i < titleTags.length; i++) {
            originalTitleTags.push(titleTags[i].innerText);
            titleTags[i].innerText = newTitle;
        }

        const metaTags = document.querySelectorAll('meta[property="og:title"], meta[name="title"], meta[name="twitter:title"]');
        const originalMetaTags: {el: Element, val: string|null}[] = [];
        metaTags.forEach(meta => {
            originalMetaTags.push({ el: meta, val: meta.getAttribute('content') });
            meta.setAttribute('content', newTitle);
        });
        
        const dialogContainer = document.querySelector('[role="dialog"]') as HTMLElement;
        if (dialogContainer) dialogContainer.classList.add('print:shadow-none', 'print:bg-transparent');

        setTimeout(() => {
            window.print();
        }, 800);

        const cleanup = () => {
            document.title = originalTitle;
            for (let i = 0; i < titleTags.length; i++) {
                if (originalTitleTags[i]) titleTags[i].innerText = originalTitleTags[i];
            }
            originalMetaTags.forEach(m => {
                if (m.val !== null) m.el.setAttribute('content', m.val);
            });
            window.removeEventListener('afterprint', cleanup);
            window.removeEventListener('focus', cleanup);
        };
        
        window.addEventListener('afterprint', cleanup);
        window.addEventListener('focus', cleanup);
        setTimeout(cleanup, 20000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto p-0 border-none bg-transparent shadow-none print:max-h-none print:w-full print:m-0 print:p-0">
                <div className="bg-white rounded-xl overflow-hidden print:rounded-none">
                    <div className="bg-gray-50 border-b p-4 flex justify-between items-center sticky top-0 z-10 print:hidden">
                        <div>
                            <DialogTitle className="text-lg font-bold text-gray-800">
                                মার্কশিট প্রিভিউ
                            </DialogTitle>
                            <DialogDescription className="text-sm text-gray-500">
                                {resultData?.exam?.title}
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handlePrint} disabled={!resultData} className="bg-green-600 hover:bg-green-700">
                                <Printer className="w-4 h-4 mr-2" /> প্রিন্ট / সেভ
                            </Button>
                            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-red-50 text-red-500">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="p-4 md:p-8 flex justify-center bg-gray-100 print:bg-white print:p-0 min-h-[500px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center text-green-600 h-full w-full py-20">
                                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                                <p className="font-bold">মার্কশিট তৈরি হচ্ছে...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center text-red-500 h-full w-full py-20">
                                <p className="font-bold mb-4">{error}</p>
                            </div>
                        ) : resultData ? (
                            <div className="print:w-full print:flex print:justify-center">
                                <TranscriptSheet
                                    student={{
                                        id: resultData.student.student_id,
                                        nameBn: resultData.student.name_bn,
                                        fatherNameBn: resultData.student.father_name_bn,
                                        motherNameBn: resultData.student.mother_name_bn,
                                        className: resultData.student.class_name,
                                        rollNo: (resultData.student.roll_number ?? resultData.student.roll_no) || '-'
                                    }}
                                    exam={{
                                        title: resultData.exam.title,
                                        academicYear: resultData.exam.academic_year?.toString()
                                    }}
                                    branch={{
                                        address: getBranchAddress(resultData.student.branch_id, resultData.branch)
                                    }}
                                    marks={resultData.marks.map((m: any) => {
                                        const mk = m.marks_obtained ? parseInt(m.marks_obtained) : 0;
                                        const gi = m.marks_obtained !== null && m.marks_obtained !== undefined ? getGradePoint(mk) : { gp: 0, grade: 'AB' };
                                        return {
                                            subjectName: m.subject_name,
                                            fullMarks: m.full_marks || 100,
                                            marksObtained: m.marks_obtained,
                                            grade: gi.grade,
                                            gp: gi.gp
                                        };
                                    })}
                                    summary={{
                                        totalMarks: resultData.summary.total,
                                        totalFullMarks: resultData.marks.reduce((acc: number, curr: any) => acc + (curr.full_marks || 100), 0),
                                        gpa: resultData.summary.gpa,
                                        grade: resultData.summary.grade
                                    }}
                                />
                            </div>
                        ) : null}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
