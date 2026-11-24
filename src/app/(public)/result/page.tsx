"use client";
import { calculateGPA, subjectGrade } from "@/lib/grading";

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
        .eq("status", "published")
        .eq("is_active", true)
        .eq("branch_id", selectedBranch)
        .eq("academic_year", parseInt(selectedYear))
        .order("created_at", { ascending: false });
        
      if (exData) setExams(exData);

      // Fetch Classes for branch and year
      const { data: clsData } = await supabase
        .from("academic_classes")
        .select("id, name, department, departments(name)")
        .eq("is_active", true)
        .eq("branch_id", selectedBranch)
        .eq("academic_year", parseInt(selectedYear));
        
      if (clsData) {
        const formatted = clsData.map((c: any) => {
          const dept = (c.departments?.name || c.department || "").trim();
          return {
            id: c.id,
            name: c.name,
            label: `${c.name?.trim()}${dept ? ` (${dept})` : ""}`,
          };
        });
        setClassList(formatted);
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
      const chosenCls = classList.find((c: any) => c.id === selectedClass || c.name === selectedClass);
      const response = await fetch("/api/public/result", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExam,
          studentId,
          classId: chosenCls?.id,
          className: chosenCls?.name || selectedClass,
          branchId: selectedBranch,
          year: selectedYear,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const processedMarks = data.marks.sort((a: any, b: any) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true }));
      setResult({ ...data, marks: processedMarks, summary: calculateGPA(processedMarks) });

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
    if (result) {
      const newTitle = `${result.exam.title} - ${result.student.student_id} - ${result.student.name_bn}`;
      const originalTitle = document.title;
      
      // 1. Change document property
      document.title = newTitle;
      
      // 2. Change all <title> elements
      const titleTags = document.getElementsByTagName('title');
      const originalTitleTags: string[] = [];
      for (let i = 0; i < titleTags.length; i++) {
          originalTitleTags.push(titleTags[i].innerText);
          titleTags[i].innerText = newTitle;
      }

      // 3. Change all meta title elements (og:title, etc)
      const metaTags = document.querySelectorAll('meta[property="og:title"], meta[name="title"], meta[name="twitter:title"]');
      const originalMetaTags: {el: Element, val: string|null}[] = [];
      metaTags.forEach(meta => {
          originalMetaTags.push({ el: meta, val: meta.getAttribute('content') });
          meta.setAttribute('content', newTitle);
      });
      
      // Wait longer (800ms) for mobile OS webview to sync metadata
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
      setTimeout(cleanup, 20000); // 20s absolute fallback
    } else {
      window.print();
    }
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
                                    {classList.map((cls: any, idx: number) => (
                                        <SelectItem key={cls.id || idx} value={cls.id || cls.name} className="cursor-pointer py-2">
                                            {cls.label || cls.name}
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
            <div id="public-print-area" className="w-full max-w-full overflow-x-auto pb-10 print:block">
              <div className="min-w-max mx-auto px-4 sm:px-0 flex justify-center">
                <TranscriptSheet
                  student={{
                    id: result.student.student_id,
                    nameBn: result.student.name_bn,
                    fatherNameBn: result.student.father_name_bn,
                    motherNameBn: result.student.mother_name_bn,
                    className: result.student.class_name,
                    rollNo: (result.student.roll_number ?? result.student.roll_no) || '-',
                    originBadge: result.student.origin_badge || null,
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
                    const gi = m.marks_obtained !== null && m.marks_obtained !== undefined ? subjectGrade({ marks_obtained: mk, full_marks: m.full_marks, pass_marks: m.pass_marks }) : { gp: 0, grade: 'AB' };
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