"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Printer, Loader2, AlertCircle, ArrowLeft, Calendar, User, FileText, GraduationCap, MapPin } from "lucide-react";
import Image from "next/image";
import TranscriptSheet from "@/components/academic/TranscriptSheet";

// --- বাংলা কনভার্সন হেল্পার ---
const toBengaliNumber = (num: string | number) => {
  if (!num && num !== 0) return "";
  const english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'PM', 'AM', '.'];
  const bengali = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯', 'পিএম', 'এএম', '.'];
  
  let str = String(num);
  english.forEach((char, index) => {
    str = str.replace(new RegExp(char === '.' ? '\\.' : char, 'g'), bengali[index]);
  });
  return str;
};

// --- গ্রেডিং সিস্টেম হেল্পার ---
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

export default function ResultPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [classList, setClassList] = useState<any[]>([]);
  
  // Search Inputs
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Branches Initially
  useEffect(() => {
    async function fetchBranches() {
      const { data } = await supabase.from("branches").select("id, name").order("name");
      if (data) setBranches(data);
    }
    fetchBranches();
  }, []);

  // 2. Fetch Exams and Classes when Branch or Year changes
  useEffect(() => {
    async function fetchDependentData() {
      if (!selectedBranch || !selectedYear) {
          setExams([]);
          setClassList([]);
          return;
      }

      // Fetch Exams for branch and year
      const { data: exData } = await supabase
        .from("exams")
        .select("id, title")
        .eq("is_active", true)
        .eq("branch_id", selectedBranch)
        .eq("academic_year", parseInt(selectedYear))
        .order("created_at", { ascending: false });
        
      if (exData) setExams(exData);

      // Fetch Classes for branch and year
      const { data: clsData } = await supabase
        .from("academic_classes")
        .select("name")
        .eq("is_active", true)
        .eq("branch_id", selectedBranch)
        .eq("academic_year", parseInt(selectedYear));
        
      if (clsData) {
        const uniqueClasses = Array.from(new Set(clsData.map(c => c.name))).map(name => ({ name }));
        setClassList(uniqueClasses);
      }
      
      // Reset exam and class when changing branch/year
      setSelectedExam("");
      setSelectedClass("");
    }
    fetchDependentData();
  }, [selectedBranch, selectedYear]);

  const handleSearch = async () => {
    if (!selectedExam || !selectedYear || !selectedClass || !studentId) {
      setError("অনুগ্রহ করে সব তথ্য সঠিকভাবে পূরণ করুন।");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // ১. স্টুডেন্ট চেক করা
      const { data: student, error: stdError } = await supabase
        .from("students")
        .select("*")
        .eq("student_id", studentId.trim())
        .maybeSingle();

      if (stdError || !student) {
        throw new Error("শিক্ষার্থী খুঁজে পাওয়া যায়নি। আইডি সঠিক কিনা যাচাই করুন।");
      }

      // ২. ক্লাস ও বছর ভ্যালিডেশন
      if (student.class_name !== selectedClass) {
        throw new Error(`এই শিক্ষার্থী '${selectedClass}' শ্রেণির নয়। (নিবন্ধিত শ্রেণি: ${student.class_name})`);
      }
      
      // Branch fetch
      let branch = null;
      if (student.branch_id) {
        const { data: branchData } = await supabase
          .from("branches")
          .select("id, name, address")
          .eq("id", student.branch_id)
          .maybeSingle();
        branch = branchData;
      }

      // Marks fetch
      const { data: marks, error: marksError } = await supabase
        .from("exam_marks")
        .select(`
            marks_obtained,
            subject_id,
            academic_subjects (
                id,
                name,
                full_marks,
                code,
                is_active
            )
        `)
        .eq("exam_id", selectedExam)
        .eq("student_id", student.student_id);

      if (marksError) throw marksError;

      if (!marks || marks.length === 0) {
        throw new Error("এই পরীক্ষার ফলাফল এখনো প্রকাশিত হয়নি বা শিক্ষার্থী অনুপস্থিত ছিল।");
      }

      // Filter out removed/inactive subjects
      const processedMarks = marks
        .filter((m: any) => m.academic_subjects && m.academic_subjects.name && m.academic_subjects.is_active !== false)
        .map((m: any) => ({
          subject_name: m.academic_subjects?.name,
          full_marks: m.academic_subjects?.full_marks || 100,
          marks_obtained: m.marks_obtained,
          code: m.academic_subjects?.code
        }));

      processedMarks.sort((a, b) => (a.code > b.code ? 1 : -1));

      if (processedMarks.length === 0) {
        throw new Error("এই পরীক্ষার ফলাফল এখনো প্রকাশিত হয়নি বা শিক্ষার্থী অনুপস্থিত ছিল।");
      }

      const summary = calculateGPA(processedMarks);
      const examInfo = exams.find(e => e.id === selectedExam);

      setResult({
        student,
        branch,
        exam: examInfo,
        marks: processedMarks,
        summary
      });

    } catch (err: any) {
      setError(err.message || "ফলাফল খুঁজতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 py-10 px-4 font-[Kalpurush] flex flex-col items-center justify-center print:bg-white print:p-0">
      
      {/* --- Search Section (Visible only when no result) --- */}
      {!result && (
        <div className="w-full max-w-3xl animate-in fade-in zoom-in duration-500">
            {/* Header / Branding - Logo Removed as per request */}
            <div className="text-center mb-8 space-y-2">
                <h1 className="text-3xl font-bold text-green-900">ফলাফল অনুসন্ধান</h1>
                <p className="text-gray-600">রহিমা জান্নাত মহিলা মাদ্রাসা</p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
                <div className="bg-green-700/5 p-6 border-b border-green-100">
                    <h2 className="text-lg font-semibold text-green-800 flex items-center justify-center gap-2">
                        <Search className="w-5 h-5" />
                        শিক্ষার্থীর তথ্য প্রদান করুন
                    </h2>
                </div>
                
                <div className="p-8 space-y-6">
                    {/* ০. শাখা নির্বাচন */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <label className="md:col-span-4 text-sm font-semibold text-gray-700 flex items-center gap-2 md:justify-end">
                            <MapPin className="w-4 h-4 text-green-600" /> শাখা :
                        </label>
                        <div className="md:col-span-8">
                            <Select onValueChange={setSelectedBranch} value={selectedBranch}>
                                <SelectTrigger className="h-12 border-gray-200 bg-white focus:ring-2 focus:ring-green-500 rounded-lg text-base w-full">
                                    <SelectValue placeholder="-- শাখা নির্বাচন করুন --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((b) => (
                                        <SelectItem key={b.id} value={b.id} className="cursor-pointer py-2">
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* ১. পরীক্ষার বছর */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <label className="md:col-span-4 text-sm font-semibold text-gray-700 flex items-center gap-2 md:justify-end">
                            <Calendar className="w-4 h-4 text-green-600" /> পরীক্ষার বছর :
                        </label>
                        <div className="md:col-span-8">
                            <Select onValueChange={setSelectedYear} value={selectedYear}>
                                <SelectTrigger className="h-12 border-gray-200 bg-white focus:ring-2 focus:ring-green-500 rounded-lg text-base w-full">
                                    <SelectValue placeholder="বছর" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2026" className="cursor-pointer py-2">২০২৬</SelectItem>
                                    <SelectItem value="2025" className="cursor-pointer py-2">২০২৫</SelectItem>
                                    <SelectItem value="2024" className="cursor-pointer py-2">২০২৪</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* ২. পরীক্ষার নাম */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <label className="md:col-span-4 text-sm font-semibold text-gray-700 flex items-center gap-2 md:justify-end">
                            <FileText className="w-4 h-4 text-green-600" /> পরীক্ষার নাম :
                        </label>
                        <div className="md:col-span-8">
                            <Select onValueChange={setSelectedExam} value={selectedExam} disabled={!selectedBranch}>
                                <SelectTrigger className="h-12 border-gray-200 bg-white focus:ring-2 focus:ring-green-500 rounded-lg text-base w-full disabled:opacity-50">
                                    <SelectValue placeholder={selectedBranch ? "-- পরীক্ষা নির্বাচন করুন --" : "প্রথমে শাখা নির্বাচন করুন"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {exams.length === 0 && selectedBranch && (
                                        <div className="p-2 text-sm text-gray-500 text-center">কোনো পরীক্ষা পাওয়া যায়নি</div>
                                    )}
                                    {exams.map((ex) => (
                                        <SelectItem key={ex.id} value={ex.id} className="cursor-pointer py-3">
                                            {ex.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* ৩. শ্রেণি */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <label className="md:col-span-4 text-sm font-semibold text-gray-700 flex items-center gap-2 md:justify-end">
                            <GraduationCap className="w-4 h-4 text-green-600" /> শ্রেণি :
                        </label>
                        <div className="md:col-span-8">
                            <Select onValueChange={setSelectedClass} value={selectedClass} disabled={!selectedBranch}>
                                <SelectTrigger className="h-12 border-gray-200 bg-white focus:ring-2 focus:ring-green-500 rounded-lg text-base w-full disabled:opacity-50">
                                    <SelectValue placeholder={selectedBranch ? "-- শ্রেণি নির্বাচন করুন --" : "প্রথমে শাখা নির্বাচন করুন"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classList.length === 0 && selectedBranch && (
                                        <div className="p-2 text-sm text-gray-500 text-center">কোনো শ্রেণি পাওয়া যায়নি</div>
                                    )}
                                    {classList.map((cls, idx) => (
                                        <SelectItem key={idx} value={cls.name} className="cursor-pointer py-2">
                                            {cls.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* ৪. আইডি নম্বর */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <label className="md:col-span-4 text-sm font-semibold text-gray-700 flex items-center gap-2 md:justify-end">
                            <User className="w-4 h-4 text-green-600" /> স্টুডেন্ট আইডি নম্বর :
                        </label>
                        <div className="md:col-span-8">
                            <Input 
                                type="text" 
                                placeholder="উদাহরণ: 2026001" 
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                className="h-12 border-gray-200 bg-white focus:ring-2 focus:ring-green-500 rounded-lg text-base font-mono tracking-wide w-full"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-4 hidden md:block"></div>
                        <div className="md:col-span-8">
                            <Button 
                                onClick={handleSearch} 
                                disabled={loading} 
                                className="w-full bg-gradient-to-r from-green-700 to-green-600 hover:from-green-800 hover:to-green-700 text-white font-bold h-12 text-lg rounded-xl shadow-lg hover:shadow-green-500/30 transition-all active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="animate-spin mr-2"/> : <Search className="mr-2 w-5 h-5"/>} 
                                ফলাফল দেখুন
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-start gap-3 mt-4 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500"/> 
                            <span className="font-medium">{error}</span>
                        </div>
                    )}
                </div>
                
                {/* Footer Note */}
                <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t border-gray-100">
                    &copy; {new Date().getFullYear()} Rahima Jannat Mohila Madrasa. All rights reserved.
                </div>
            </div>
        </div>
      )}

      {/* --- Result View Section --- */}
      {result && (
        <div className="w-full flex flex-col items-center">
            
            {/* Sticky Action Bar (Hidden in Print) */}
            <div className="sticky top-4 z-50 flex items-center gap-3 bg-white/90 backdrop-blur shadow-lg border border-gray-200 p-2 rounded-full mb-8 print:hidden">
                <Button onClick={handleReset} variant="ghost" className="rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-4">
                    <ArrowLeft className="w-4 h-4 mr-2"/> পুনরায় অনুসন্ধান
                </Button>
                <div className="h-6 w-px bg-gray-300"></div>
                <Button onClick={handlePrint} className="rounded-full bg-green-700 hover:bg-green-800 text-white px-6 shadow-md">
                    <Printer className="w-4 h-4 mr-2"/> প্রিন্ট / সেভ
                </Button>
            </div>

            {/* --- PRINTABLE CONTENT (A4 Size) --- */}
            <div id="public-print-area" className="w-full flex justify-center print:block">
              <TranscriptSheet
              student={{
                id: result.student.student_id,
                nameBn: result.student.name_bn,
                fatherNameBn: result.student.father_name_bn,
                motherNameBn: result.student.mother_name_bn,
                className: result.student.class_name,
                rollNo: (result.student.roll_number ?? result.student.roll_no) || '-'
              }}
              exam={{
                title: result.exam.title,
                academicYear: selectedYear
              }}
              branch={{
                address: result.branch?.address || ""
              }}
              marks={result.marks.map((m: any) => {
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
                totalMarks: result.summary.total,
                totalFullMarks: result.marks.reduce((acc: number, curr: any) => acc + (curr.full_marks || 100), 0),
                gpa: result.summary.gpa,
                grade: result.summary.grade
              }}
            />
            </div>
        </div>
      )}

      {/* Global CSS for Printing */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Tiro+Bangla&display=swap');

        @media print {
            @page {
                size: A4;
                margin: 0; /* Browser margin reset */
            }
            
            html, body {
                height: 100%;
                margin: 0 !important;
                padding: 0 !important;
                background: white;
            }

            body * {
                visibility: hidden; /* Hide everything initially */
            }

            /* Main Printable Container */
            #public-print-area, #public-print-area * {
                visibility: visible; /* Show only printable content */
            }

            #public-print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                z-index: 9999;
            }

            .print\\:hidden {
                display: none !important;
            }
            
            /* Print Color Adjustments */
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
      `}</style>
    </div>
  );
}