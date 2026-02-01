"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Printer, Loader2, AlertCircle, ArrowLeft, Calendar, User, FileText, GraduationCap } from "lucide-react";
import Image from "next/image";

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
  const [exams, setExams] = useState<any[]>([]);
  const [classList, setClassList] = useState<any[]>([]);
  
  // Search Inputs
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      // Fetch Exams
      const { data: exData } = await supabase
        .from("exams")
        .select("id, title, academic_year")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (exData) setExams(exData);

      // Fetch Classes (Unique Names)
      const { data: clsData } = await supabase
        .from("academic_classes")
        .select("name")
        .eq("is_active", true);
        
      if (clsData) {
        // Remove duplicates if any
        const uniqueClasses = Array.from(new Set(clsData.map(c => c.name)))
          .map(name => ({ name }));
        setClassList(uniqueClasses);
      }
    };
    fetchData();
  }, []);

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
      
      // ৩. রেজাল্ট/মার্কস ফেচ করা
      const { data: marks, error: marksError } = await supabase
        .from("exam_marks")
        .select(`
            marks_obtained,
            subject_id,
            academic_subjects (
                id,
                name,
                full_marks,
                code
            )
        `)
        .eq("exam_id", selectedExam)
        .eq("student_id", student.student_id);

      if (marksError) throw marksError;

      if (!marks || marks.length === 0) {
        throw new Error("এই পরীক্ষার ফলাফল এখনো প্রকাশিত হয়নি বা শিক্ষার্থী অনুপস্থিত ছিল।");
      }

      // ৪. ডাটা প্রসেসিং
      const processedMarks = marks.map((m: any) => ({
        subject_name: m.academic_subjects?.name,
        full_marks: m.academic_subjects?.full_marks || 100,
        marks_obtained: m.marks_obtained,
        code: m.academic_subjects?.code
      }));

      processedMarks.sort((a, b) => (a.code > b.code ? 1 : -1));

      const summary = calculateGPA(processedMarks);
      const examInfo = exams.find(e => e.id === selectedExam);

      setResult({
        student,
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
                    {/* ১. পরীক্ষার নাম */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <label className="md:col-span-4 text-sm font-semibold text-gray-700 flex items-center gap-2 md:justify-end">
                            <FileText className="w-4 h-4 text-green-600" /> পরীক্ষার নাম :
                        </label>
                        <div className="md:col-span-8">
                            <Select onValueChange={setSelectedExam} value={selectedExam}>
                                <SelectTrigger className="h-12 border-gray-200 bg-white focus:ring-2 focus:ring-green-500 rounded-lg text-base w-full">
                                    <SelectValue placeholder="-- পরীক্ষা নির্বাচন করুন --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {exams.map((ex) => (
                                        <SelectItem key={ex.id} value={ex.id} className="cursor-pointer py-3">
                                            {ex.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* ২. পরীক্ষার বছর */}
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

                    {/* ৩. শ্রেণি */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <label className="md:col-span-4 text-sm font-semibold text-gray-700 flex items-center gap-2 md:justify-end">
                            <GraduationCap className="w-4 h-4 text-green-600" /> শ্রেণি :
                        </label>
                        <div className="md:col-span-8">
                            <Select onValueChange={setSelectedClass} value={selectedClass}>
                                <SelectTrigger className="h-12 border-gray-200 bg-white focus:ring-2 focus:ring-green-500 rounded-lg text-base w-full">
                                    <SelectValue placeholder="-- শ্রেণি --" />
                                </SelectTrigger>
                                <SelectContent>
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
            <div id="printable-content" className="bg-white mx-auto print:mx-0 relative shadow-2xl print:shadow-none w-full max-w-[210mm] print:max-w-none min-h-[297mm] print:min-h-0" style={{ fontFamily: "'Kalpurush', 'Siyam Rupali', sans-serif" }}>
                
                {/* Main Border Frame */}
                <div className="w-full h-full p-4 sm:p-8 print:p-0 flex flex-col justify-between">
                    
                    {/* Decorative Outer Border */}
                    <div className="absolute inset-0 border-[3px] border-double border-green-800 m-2 pointer-events-none hidden print:block z-50 rounded-sm print:m-[0.4in]"></div>
                    <div className="absolute inset-0 border border-green-600 m-3 pointer-events-none hidden print:block z-50 rounded-sm print:m-[calc(0.4in+4px)]"></div>
                    
                    {/* Corner Decorations (Islamic Style) */}
                    <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-green-700 hidden print:block z-50 print:top-[0.45in] print:left-[0.45in]"></div>
                    <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-green-700 hidden print:block z-50 print:top-[0.45in] print:right-[0.45in]"></div>
                    <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-green-700 hidden print:block z-50 print:bottom-[0.45in] print:left-[0.45in]"></div>
                    <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-green-700 hidden print:block z-50 print:bottom-[0.45in] print:right-[0.45in]"></div>

                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none z-0">
                        <div className="relative w-[500px] h-[500px]">
                            <Image src="/images/logo.png" alt="Watermark" fill className="object-contain grayscale" />
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-col h-full justify-between print:p-[0.6in]">
                        {/* Top Section */}
                        <div>
                             {/* Header */}
                            <div className="text-center mb-6 pt-2 print:pt-0">
                                <div className="flex justify-center mb-0 h-8 relative print:h-8 print:mb-0">
                                    {/* Using standard img for reliable print rendering */}
                                    <img src="/images/bismillah.svg" alt="Bismillah" className="h-full w-auto object-contain" />
                                </div>
                                {/* Full Logo Section */}
                                <div className="w-full flex justify-center mb-0 mt-1 print:mt-0 print:mb-0">
                                    {/* Using standard img to prevent breaking in print */}
                                    <img 
                                        src="/images/long_logo.svg" 
                                        alt="Madrasa Logo" 
                                        className="h-28 w-auto object-contain print:h-24 print:max-w-[90%]" 
                                    />
                                </div>
                                <p className="text-sm font-medium text-gray-600 print:text-gray-800 -mt-2 print:-mt-2">হলিধানী বাজার, ঝিনাইদহ সদর, ঝিনাইদহ</p>
                                
                                <div className="w-full border-b-[3px] border-double border-green-800 my-2 print:border-green-900"></div>
                                
                                <div className="inline-block bg-green-800 px-8 py-1.5 rounded-full mt-2 mb-1 print-color-exact">
                                    <h2 className="text-xl font-bold text-white uppercase tracking-widest leading-none font-[Kalpurush]">একাডেমিক ট্রান্সক্রিপ্ট</h2>
                                </div>
                                <h3 className="text-lg font-bold text-green-700 print:text-green-800 mt-2">
                                    {result.exam.title} - {toBengaliNumber(selectedYear)}
                                </h3>
                            </div>

                            {/* Student Info Grid */}
                            <div className="mb-4 border border-green-800 rounded-none p-0 overflow-hidden bg-green-50/30 print:bg-transparent">
                                <div className="grid grid-cols-2 text-sm">
                                    <div className="p-2 border-b border-r border-green-800/30 flex gap-2">
                                        <span className="font-semibold text-green-800 min-w-[80px]">আইডি নম্বর:</span>
                                        <span className="font-bold text-black font-mono">{toBengaliNumber(result.student.student_id)}</span>
                                    </div>
                                    <div className="p-2 border-b border-green-800/30 flex gap-2">
                                        <span className="font-semibold text-green-800 min-w-[80px]">শ্রেণি:</span>
                                        <span className="font-bold text-black">{result.student.class_name}</span>
                                    </div>
                                    <div className="p-2 border-b border-r border-green-800/30 flex gap-2">
                                        <span className="font-semibold text-green-800 min-w-[80px]">শিক্ষার্থীর নাম:</span>
                                        <span className="font-bold text-black">{result.student.name_bn}</span>
                                    </div>
                                    <div className="p-2 border-b border-green-800/30 flex gap-2">
                                        <span className="font-semibold text-green-800 min-w-[80px]">রোল নম্বর:</span>
                                        <span className="font-bold text-black font-mono">{toBengaliNumber(result.student.roll_no || '-')}</span>
                                    </div>
                                    <div className="p-2 border-r border-green-800/30 flex gap-2">
                                        <span className="font-semibold text-green-800 min-w-[80px]">পিতার নাম:</span>
                                        <span className="font-bold text-black">{result.student.father_name_bn}</span>
                                    </div>
                                    <div className="p-2 flex gap-2">
                                        <span className="font-semibold text-green-800 min-w-[80px]">মাতার নাম:</span>
                                        <span className="font-bold text-black">{result.student.mother_name_bn}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Marks Table */}
                            <div className="mb-2">
                                <table className="w-full border-collapse border border-green-700 text-center text-sm print:text-xs">
                                    <thead className="bg-green-700 text-white print:bg-green-700 print:text-white print-color-exact">
                                        <tr className="font-bold text-sm">
                                            <th className="border border-green-700 p-2 w-12">নং</th>
                                            <th className="border border-green-700 p-2 text-left pl-3">বিষয়ের নাম</th>
                                            <th className="border border-green-700 p-2 w-20">পূর্ণমান</th>
                                            <th className="border border-green-700 p-2 w-20">প্রাপ্ত নম্বর</th>
                                            <th className="border border-green-700 p-2 w-24">লেটার গ্রেড</th>
                                            <th className="border border-green-700 p-2 w-24">গ্রেড পয়েন্ট</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.marks.map((sub: any, idx: number) => {
                                            const gradeInfo = getGradePoint(sub.marks_obtained);
                                            return (
                                                <tr key={idx} className="hover:bg-green-50 print:hover:bg-transparent">
                                                    <td className="border border-green-700 p-2">{toBengaliNumber(idx + 1)}</td>
                                                    <td className="border border-green-700 p-2 text-left pl-3 font-semibold text-green-900">{sub.subject_name}</td>
                                                    <td className="border border-green-700 p-2">{toBengaliNumber(sub.full_marks)}</td>
                                                    <td className="border border-green-700 p-2 font-bold">{toBengaliNumber(sub.marks_obtained)}</td>
                                                    <td className="border border-green-700 p-2 font-medium">{gradeInfo.grade}</td>
                                                    <td className="border border-green-700 p-2">{toBengaliNumber(gradeInfo.gp.toFixed(2))}</td>
                                                </tr>
                                            );
                                        })}
                                        
                                        {/* Summary Row */}
                                        <tr className="font-bold bg-green-100 print:bg-green-100 print-color-exact">
                                            <td colSpan={2} className="border border-green-700 p-2 text-right pr-4 text-green-900">সর্বমোট:</td>
                                            <td className="border border-green-700 p-2"></td>
                                            <td className="border border-green-700 p-2 text-green-900">{toBengaliNumber(result.summary.total)}</td>
                                            <td className="border border-green-700 p-2 text-green-900">গ্রেড: {result.summary.grade}</td>
                                            <td className="border border-green-700 p-2 text-green-900">জিপিএ: {toBengaliNumber(result.summary.gpa)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Grading Scale Chart - Moved below table */}
                            <div className="flex justify-start mb-4">
                                <div className="border border-green-700 text-[10px] rounded overflow-hidden w-full max-w-[400px]">
                                    <div className="bg-green-700 text-white p-1 text-center font-bold border-b border-green-700 print:bg-green-700 print:text-white print-color-exact">গ্রেডিং সিস্টেম</div>
                                    <div className="grid grid-cols-6 gap-0 text-center bg-white">
                                        {/* Banding Rows */}
                                        <div className="contents bg-green-50 print:bg-green-50 print-color-exact">
                                            <div className="border-r border-b border-green-700 p-0.5">৮০-১০০</div><div className="border-r border-b border-green-700 p-0.5 font-bold">A+</div>
                                        </div>
                                        <div className="contents">
                                            <div className="border-r border-b border-green-700 p-0.5">৭০-৭৯</div><div className="border-r border-b border-green-700 p-0.5 font-bold">A</div>
                                        </div>
                                        <div className="contents bg-green-50 print:bg-green-50 print-color-exact">
                                            <div className="border-r border-b border-green-700 p-0.5">৬০-৬৯</div><div className="border-b border-green-700 p-0.5 font-bold">A-</div>
                                        </div>
                                        
                                        <div className="contents">
                                            <div className="border-r border-green-700 p-0.5">৫০-৫৯</div><div className="border-r border-green-700 p-0.5 font-bold">B</div>
                                        </div>
                                        <div className="contents bg-green-50 print:bg-green-50 print-color-exact">
                                            <div className="border-r border-green-700 p-0.5">৪০-৪৯</div><div className="border-r border-green-700 p-0.5 font-bold">C</div>
                                        </div>
                                        <div className="contents">
                                            <div className="border-r border-green-700 p-0.5">৩৩-৩৯</div><div className="font-bold p-0.5">D</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section: Signatures */}
                        <div className="mt-auto">
                            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-8 sm:gap-0 pb-4 px-4">
                                <div className="text-center">
                                    <div className="w-32 border-t border-black border-dashed mb-1 mx-auto"></div>
                                    <p className="font-bold text-xs text-green-900">শ্রেণি শিক্ষকের স্বাক্ষর</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-32 border-t border-black border-dashed mb-1 mx-auto"></div>
                                    <p className="font-bold text-xs text-green-900">মুহতামিমের স্বাক্ষর</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-32 border-t border-black border-dashed mb-1 mx-auto"></div>
                                    <p className="font-bold text-xs text-green-900">অভিভাবকের স্বাক্ষর</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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
                overflow: hidden; /* Prevent scrollbars */
            }

            body * {
                visibility: hidden; /* Hide everything initially */
            }

            /* Main Printable Container */
            #printable-content, #printable-content * {
                visibility: visible; /* Show only printable content */
            }

            #printable-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 210mm;
                height: 296mm; /* Slightly less than 297mm to prevent spillover */
                padding: 0;
                margin: 0 auto;
                background: white;
                display: flex;
                flex-direction: column;
                z-index: 9999;
                page-break-after: avoid;
                page-break-before: avoid;
                overflow: hidden;
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