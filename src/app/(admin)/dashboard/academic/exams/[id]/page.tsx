"use client";

import { useState, useEffect, use, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Printer, Save, Calendar, CheckCircle, Edit, Trash2, AlertTriangle, School, RefreshCcw, FileText, Download, Users, FileSpreadsheet } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
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

const getBengaliDay = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    return days[date.getDay()];
};

const formatTimeBangla = (timeStr: string) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(':');
    let hour = parseInt(h);
    const ampm = hour >= 12 ? 'পিএম' : 'এএম';
    hour = hour % 12;
    hour = hour ? hour : 12; 
    return toBengaliNumber(`${hour}:${m} ${ampm}`);
};

const calculateDurationBangla = (start: string, end: string) => {
    if (!start || !end) return "";
    const startDate = new Date(`2000-01-01T${start}`);
    const endDate = new Date(`2000-01-01T${end}`);
    const diff = differenceInMinutes(endDate, startDate);
    
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    
    let result = "";
    if (hours > 0) result += `${hours} ঘণ্টা `;
    if (minutes > 0) result += `${minutes} মিনিট`;
    
    return toBengaliNumber(result.trim());
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

const calculateResultSummary = (studentId: string, subjectList: any[], marksMap: Record<string, Record<string, string>>) => {
    let totalMarks = 0;
    let totalFullMarks = 0;
    let totalGP = 0;
    let failCount = 0;
    let subjectCount = 0;

    subjectList.forEach(sub => {
        totalFullMarks += (sub.full_marks || 100);
        const markStr = marksMap[studentId]?.[sub.id];
        if (markStr) {
            const mark = parseInt(markStr);
            totalMarks += mark;
            const { gp } = getGradePoint(mark);
            if (gp === 0) failCount++;
            totalGP += gp;
            subjectCount++;
        }
    });

    if (subjectCount === 0) return { total: 0, totalFull: totalFullMarks, gpa: 0, grade: 'N/A', status: 'Pending' };

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
        total: totalMarks,
        totalFull: totalFullMarks,
        gpa: parseFloat(gpa.toFixed(2)),
        grade,
        status: failCount > 0 ? 'Fail' : 'Pass'
    };
};

export default function ExamDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [exam, setExam] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Routine Manager State
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [routineData, setRoutineData] = useState<Record<string, { date: string, start: string, end: string, full_marks: number }>>({});
  const [isSavingRoutine, setIsSavingRoutine] = useState(false);

  // --- Result Tabulation State ---
  const [tabulationData, setTabulationData] = useState<Record<string, Record<string, string>>>({});
  const [isSavingTabulation, setIsSavingTabulation] = useState(false);

  // --- Printing State ---
  const [printMode, setPrintMode] = useState<'admit' | 'transcript-single' | 'transcript-all' | 'tabulation'>('admit');
  const [studentForTranscript, setStudentForTranscript] = useState<any>(null);

  useEffect(() => {
    fetchExamDetails();
  }, [id]);

  useEffect(() => {
    if (selectedClass) {
        fetchClassData();
    }
  }, [selectedClass]);

  // --- মেধা তালিকা ক্যালকুলেশন (Memoized) ---
  const resultsWithRank = useMemo(() => {
      if (!students.length || !subjects.length) return [];

      const computed = students.map(std => {
          const summary = calculateResultSummary(std.student_id, subjects, tabulationData);
          return { ...std, summary };
      });

      const sortedForRank = [...computed].sort((a, b) => {
          if (a.summary.status === 'Fail' && b.summary.status !== 'Fail') return 1;
          if (b.summary.status === 'Fail' && a.summary.status !== 'Fail') return -1;
          
          if (b.summary.gpa !== a.summary.gpa) return b.summary.gpa - a.summary.gpa;
          if (b.summary.total !== a.summary.total) return b.summary.total - a.summary.total;
          
          return 0;
      });

      const rankMap = new Map();
      let currentRank = 1;
      sortedForRank.forEach((item) => {
          if (item.summary.status === 'Fail' || item.summary.status === 'Pending') {
              rankMap.set(item.student_id, '-');
          } else {
              rankMap.set(item.student_id, currentRank++);
          }
      });

      return computed.map(item => ({
          ...item,
          rank: rankMap.get(item.student_id)
      }));

  }, [students, subjects, tabulationData]);


  const fetchExamDetails = async () => {
    const { data: ex } = await supabase.from("exams").select("*, branches(name)").eq("id", id).single();
    if (ex) {
        setExam(ex);
        const { data: cls } = await supabase.from("academic_classes").select("id, name").eq("branch_id", ex.branch_id).eq("academic_year", ex.academic_year);
        if (cls) setClasses(cls);
    }
    setLoading(false);
  };

  const fetchClassData = async () => {
    const { data: subs } = await supabase.from("academic_subjects").select("*").eq("class_id", selectedClass).order('code');
    if (subs) setSubjects(subs);

    const className = classes.find(c => c.id === selectedClass)?.name;
    if (className) {
        const { data: stds } = await supabase
            .from("students")
            .select("id, student_id, name_bn, roll_no, father_name_bn, mother_name_bn, photo_url")
            .eq("class_name", className)
            .eq("academic_year", exam.academic_year)
            .order("roll_no", { ascending: true });
        
        if (stds) setStudents(stds);
    }

    fetchRoutines();
    fetchTabulationData();
  };

  const fetchRoutines = async () => {
    const { data: rts } = await supabase.from("exam_routines").select("*, academic_subjects(name)").eq("exam_id", id).eq("class_id", selectedClass).order('exam_date');
    if (rts) {
        setRoutines(rts);
        const initialData: any = {};
        rts.forEach((r: any) => {
            initialData[r.subject_id] = {
                date: r.exam_date,
                start: r.start_time,
                end: r.end_time,
                full_marks: r.full_marks
            };
        });
        setRoutineData(initialData);
    }
  };

  const fetchTabulationData = async () => {
      const { data } = await supabase.from('exam_marks').select('*').eq('exam_id', id);
      if (data) {
          const map: Record<string, Record<string, string>> = {};
          data.forEach((m: any) => {
              if (!map[m.student_id]) map[m.student_id] = {};
              map[m.student_id][m.subject_id] = m.marks_obtained;
          });
          setTabulationData(map);
      }
  };

  const handleTabulationChange = (studentTableId: string, subjectId: string, val: string) => {
      const student = students.find(s => s.id === studentTableId);
      if(!student) return;
      const stdId = student.student_id; 
      setTabulationData(prev => ({
          ...prev,
          [stdId]: { ...prev[stdId], [subjectId]: val }
      }));
  };

  const saveTabulationSheet = async () => {
      setIsSavingTabulation(true);
      const updates: any[] = [];
      Object.keys(tabulationData).forEach(stdId => {
          Object.keys(tabulationData[stdId]).forEach(subId => {
              const mark = tabulationData[stdId][subId];
              if (mark !== "" && mark !== undefined) {
                  updates.push({
                      exam_id: id,
                      subject_id: subId,
                      student_id: stdId,
                      marks_obtained: parseInt(mark)
                  });
              }
          });
      });

      if (updates.length > 0) {
          const { error } = await supabase.from("exam_marks").upsert(updates, { onConflict: 'exam_id, student_id, subject_id' });
          if (error) alert("ত্রুটি: " + error.message);
          else alert("ফলাফল সফলভাবে সেভ হয়েছে!");
      } else {
          alert("সেভ করার মতো কোনো পরিবর্তন পাওয়া যায়নি।");
      }
      setIsSavingTabulation(false);
  };

  const openRoutineModal = () => {
      const newRoutineData = { ...routineData };
      subjects.forEach(sub => {
          if (!newRoutineData[sub.id]) {
              newRoutineData[sub.id] = { date: "", start: "10:00", end: "13:00", full_marks: sub.full_marks || 100 };
          }
      });
      setRoutineData(newRoutineData);
      setIsRoutineModalOpen(true);
  };

  const handleRoutineChange = (subjectId: string, field: string, value: any) => {
      setRoutineData(prev => ({
          ...prev,
          [subjectId]: { ...prev[subjectId], [field]: value }
      }));
  };

  const validateRoutineData = () => {
    for (const subId in routineData) {
        const data = routineData[subId];
        if (data.date) {
            if (data.start >= data.end) {
                const subName = subjects.find(s => s.id === subId)?.name || "অজানা বিষয়";
                alert(`সমস্যা: '${subName}' বিষয়ের শুরুর সময় শেষের সময়ের চেয়ে বেশি বা সমান। অনুগ্রহ করে সময় ঠিক করুন।`);
                return false;
            }
        }
    }
    return true;
  };

  const saveAllRoutines = async () => {
      if (!validateRoutineData()) return;
      setIsSavingRoutine(true);
      const updates = Object.keys(routineData).map(subjectId => {
          const data = routineData[subjectId];
          if (!data.date) return null;
          return {
              exam_id: id,
              class_id: selectedClass,
              subject_id: subjectId,
              exam_date: data.date,
              start_time: data.start,
              end_time: data.end,
              full_marks: data.full_marks
          };
      }).filter(Boolean);

      if (updates.length > 0) {
          const { error } = await supabase.from("exam_routines").upsert(updates, { onConflict: 'exam_id, class_id, subject_id' });
          if (error) alert("সেভ হয়নি: " + error.message);
          else {
              alert("রুটিন সফলভাবে আপডেট হয়েছে!");
              setIsRoutineModalOpen(false);
              fetchRoutines();
          }
      } else {
          alert("কোনো তারিখ সেট করা হয়নি!");
      }
      setIsSavingRoutine(false);
  };

  const deleteRoutineItem = async (routineId: string) => {
      if(!confirm("মুছে ফেলতে চান?")) return;
      await supabase.from("exam_routines").delete().eq("id", routineId);
      fetchRoutines();
  };

  // --- Print Handlers ---
  const handlePrintAdmitCards = () => {
    if (students.length === 0) return alert("প্রিন্ট করার মতো কোনো শিক্ষার্থী নেই!");
    setPrintMode('admit');
    setTimeout(() => window.print(), 200);
  };

  const handlePrintTranscriptSingle = (student: any) => {
    setStudentForTranscript(student);
    setPrintMode('transcript-single');
    setTimeout(() => window.print(), 200);
  };

  const handlePrintTranscriptAll = () => {
      if (students.length === 0) return alert("প্রিন্ট করার মতো কোনো শিক্ষার্থী নেই!");
      setPrintMode('transcript-all');
      setTimeout(() => window.print(), 200);
  };

  const handlePrintTabulation = () => {
      if (students.length === 0) return alert("প্রিন্ট করার মতো কোনো শিক্ষার্থী নেই!");
      setPrintMode('tabulation');
      setTimeout(() => window.print(), 200);
  };

  // --- Render Transcript Component ---
  const TranscriptTemplate = ({ student }: { student: any }) => (
      <div className="transcript-page relative border-4 border-double border-green-900 box-border bg-white" style={{ fontFamily: "'Kalpurush', 'Siyam Rupali', sans-serif" }}>
          {/* Watermark (Logo) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <div className="relative w-96 h-96">
                <Image src="/images/logo.png" alt="Watermark" fill className="object-contain grayscale" priority />
              </div>
          </div>

          <div className="p-8 h-full flex flex-col justify-between">
              <div>
                  {/* Header */}
                  <div className="text-center relative z-10 mb-6">
                      <div className="flex justify-center mb-2 h-8 relative">
                          <Image src="/images/bismillah.svg" alt="Bismillah" fill className="object-contain" priority />
                      </div>
                      <div className="w-full flex justify-center relative h-16 mb-2">
                          <Image src="/images/long_logo.svg" alt="Madrasa Logo" fill className="object-contain" priority />
                      </div>
                      <p className="text-lg font-bold text-gray-700">হলিধানী বাজার, ঝিনাইদহ সদর, ঝিনাইদহ</p>
                      <div className="border-b-2 border-green-800 w-full my-2"></div>
                      <h1 className="text-3xl font-extrabold text-black uppercase tracking-wider mb-1">একাডেমিক ট্রান্সক্রিপ্ট</h1>
                      <h2 className="text-xl font-bold text-green-800">{exam?.title} - {toBengaliNumber(exam?.academic_year || "")}</h2>
                  </div>

                  {/* Student Info Box */}
                  <div className="relative z-10 mb-6 border border-green-800 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm font-semibold bg-green-50 print:bg-green-50 print-color-exact">
                      <div>
                          <p className="mb-2">শিক্ষার্থীর নাম: <span className="font-bold text-base ml-2">{student.name_bn}</span></p>
                          <p className="mb-2">আইডি নম্বর: <span className="font-mono ml-2">{toBengaliNumber(student.student_id)}</span></p>
                          <p>পিতার নাম: <span className="ml-2">{student.father_name_bn}</span></p>
                      </div>
                      <div className="text-right">
                          <p className="mb-2">শ্রেণি: <span className="ml-2">{classes.find(c => c.id === selectedClass)?.name}</span></p>
                          <p className="mb-2">রোল নম্বর: <span className="font-mono font-bold text-base ml-2">{toBengaliNumber(student.roll_no)}</span></p>
                          <p>মাতার নাম: <span className="ml-2">{student.mother_name_bn}</span></p>
                      </div>
                  </div>

                  {/* Result Table */}
                  <div className="relative z-10 mb-6">
                      <table className="w-full border-collapse border border-green-900 text-center text-sm">
                          <thead className="bg-green-800 text-white print:bg-green-800 print:text-white print-color-exact">
                              <tr>
                                  <th className="border border-green-900 p-2 w-12">নং</th>
                                  <th className="border border-green-900 p-2 text-left">বিষয়ের নাম</th>
                                  <th className="border border-green-900 p-2 w-24">পূর্ণমান</th>
                                  <th className="border border-green-900 p-2 w-24">প্রাপ্ত নম্বর</th>
                                  <th className="border border-green-900 p-2 w-20">লেটার গ্রেড</th>
                                  <th className="border border-green-900 p-2 w-20">গ্রেড পয়েন্ট</th>
                              </tr>
                          </thead>
                          <tbody>
                              {subjects.map((sub, idx) => {
                                  const markStr = tabulationData[student.student_id]?.[sub.id];
                                  const mark = markStr ? parseInt(markStr) : 0;
                                  const result = markStr ? getGradePoint(mark) : { gp: 0, grade: 'AB' };
                                  return (
                                      <tr key={sub.id}>
                                          <td className="border border-green-900 p-2">{toBengaliNumber(idx + 1)}</td>
                                          <td className="border border-green-900 p-2 text-left font-semibold">{sub.name}</td>
                                          <td className="border border-green-900 p-2">{toBengaliNumber(sub.full_marks || 100)}</td>
                                          <td className="border border-green-900 p-2 font-bold">{markStr ? toBengaliNumber(mark) : '-'}</td>
                                          <td className="border border-green-900 p-2">{result.grade}</td>
                                          <td className="border border-green-900 p-2">{toBengaliNumber(result.gp.toFixed(2))}</td>
                                      </tr>
                                  );
                              })}
                              {/* Final Summary Row */}
                              {(() => {
                                  const summary = calculateResultSummary(student.student_id, subjects, tabulationData);
                                  return (
                                      <tr className="font-bold bg-gray-100 print:bg-gray-100 print-color-exact">
                                          <td colSpan={2} className="border border-green-900 p-2 text-right pr-4">সর্বমোট:</td>
                                          <td className="border border-green-900 p-2 text-center">{toBengaliNumber(summary.totalFull)}</td>
                                          <td className="border border-green-900 p-2 text-center">{toBengaliNumber(summary.total)}</td>
                                          <td className="border border-green-900 p-2 text-center">{summary.grade}</td>
                                          <td className="border border-green-900 p-2 text-center">{toBengaliNumber(summary.gpa.toFixed(2))}</td>
                                      </tr>
                                  );
                              })()}
                          </tbody>
                      </table>
                  </div>

                  {/* Grading Scale */}
                  <div className="relative z-10 mb-4 flex justify-end">
                      <div className="w-1/3 border border-green-900 text-[10px]">
                          <div className="bg-green-100 p-1 text-center font-bold border-b border-green-900">গ্রেডিং সিস্টেম</div>
                          <div className="grid grid-cols-3 gap-0 text-center">
                              <div className="border-r border-b border-green-900 p-1">৮০-১০০</div><div className="border-r border-b border-green-900 p-1">A+</div><div className="border-b border-green-900 p-1">5.00</div>
                              <div className="border-r border-b border-green-900 p-1">৭০-৭৯</div><div className="border-r border-b border-green-900 p-1">A</div><div className="border-b border-green-900 p-1">4.00</div>
                              <div className="border-r border-b border-green-900 p-1">৬০-৬৯</div><div className="border-r border-b border-green-900 p-1">A-</div><div className="border-b border-green-900 p-1">3.50</div>
                              <div className="border-r border-b border-green-900 p-1">৫০-৫৯</div><div className="border-r border-b border-green-900 p-1">B</div><div className="border-b border-green-900 p-1">3.00</div>
                              <div className="border-r border-b border-green-900 p-1">৪০-৪৯</div><div className="border-r border-b border-green-900 p-1">C</div><div className="border-b border-green-900 p-1">2.00</div>
                              <div className="border-r border-green-900 p-1">৩৩-৩৯</div><div className="border-r border-green-900 p-1">D</div><div className="p-1">1.00</div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Footer Signatures */}
              <div className="relative z-10 flex justify-between items-end pb-2">
                  <div className="text-center">
                      <div className="w-32 border-t border-black border-dashed mb-2"></div>
                      <p className="font-bold text-xs">শ্রেণি শিক্ষকের স্বাক্ষর</p>
                  </div>
                  <div className="text-center">
                      <div className="w-32 border-t border-black border-dashed mb-2"></div>
                      <p className="font-bold text-xs">অধ্যক্ষের স্বাক্ষর</p>
                  </div>
                  <div className="text-center">
                      <div className="w-32 border-t border-black border-dashed mb-2"></div>
                      <p className="font-bold text-xs">অভিভাবকের স্বাক্ষর</p>
                  </div>
              </div>
          </div>
      </div>
  );

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-purple-600"/></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border shadow-sm flex justify-between items-center print:hidden">
         <div>
             <h1 className="text-2xl font-bold text-gray-800">{exam?.title}</h1>
             <p className="text-gray-500">{exam?.branches?.name} | শিক্ষাবর্ষ: {toBengaliNumber(exam?.academic_year || "")}</p>
         </div>
         <div className="flex gap-3">
             <select 
                className="border p-2 rounded-lg bg-gray-50 focus:bg-white min-w-[200px]" 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
             >
                 <option value="">-- ক্লাস নির্বাচন করুন --</option>
                 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
         </div>
      </div>

      {!selectedClass ? (
          <div className="text-center py-20 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed print:hidden">
              <p>অনুগ্রহ করে উপরে থেকে একটি ক্লাস নির্বাচন করুন</p>
          </div>
      ) : (
        <Tabs defaultValue="routine_admit" className="w-full">
            <TabsList className="grid w-full grid-cols-2 print:hidden bg-white border p-1 h-12 rounded-xl mb-4">
                <TabsTrigger value="routine_admit" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 font-bold">রুটিন ও প্রবেশপত্র</TabsTrigger>
                <TabsTrigger value="results" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 font-bold">ফলাফল ও মার্কশিট</TabsTrigger>
            </TabsList>

            {/* ====== TAB 1: ROUTINE & ADMIT ====== */}
            <TabsContent value="routine_admit" className="print:hidden">
                <Tabs defaultValue="routine_setup" className="w-full">
                    <TabsList className="w-full justify-start border-b bg-transparent h-12 rounded-none p-0 mb-4 space-x-6">
                        <TabsTrigger value="routine_setup" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-purple-800 px-4 py-2">রুটিন সেটআপ</TabsTrigger>
                        <TabsTrigger value="admit_card" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-purple-800 px-4 py-2">প্রবেশপত্র</TabsTrigger>
                    </TabsList>

                    <TabsContent value="routine_setup">
                        <div className="bg-white p-6 rounded-xl border shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold flex items-center gap-2 text-gray-700"><Calendar className="w-5 h-5 text-purple-600"/> পরীক্ষার রুটিন</h3>
                                <Button onClick={openRoutineModal} className="bg-purple-600 hover:bg-purple-700 shadow-md">
                                    <Edit className="w-4 h-4 mr-2"/> রুটিন সেটআপ
                                </Button>
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead>বিষয়</TableHead>
                                            <TableHead>তারিখ</TableHead>
                                            <TableHead>সময়</TableHead>
                                            <TableHead>পূর্ণমান</TableHead>
                                            <TableHead className="text-right">অ্যাকশন</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {routines.length === 0 ? (
                                            <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">কোনো রুটিন সেট করা হয়নি</TableCell></TableRow>
                                        ) : (
                                            routines.map(r => (
                                                <TableRow key={r.id}>
                                                    <TableCell className="font-bold text-gray-700">{r.academic_subjects?.name}</TableCell>
                                                    <TableCell>{toBengaliNumber(format(new Date(r.exam_date), 'dd/MM/yyyy'))}</TableCell>
                                                    <TableCell className="font-mono text-xs">{formatTimeBangla(r.start_time)} - {formatTimeBangla(r.end_time)}</TableCell>
                                                    <TableCell>{toBengaliNumber(r.full_marks)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => deleteRoutineItem(r.id)} className="text-red-400 hover:bg-red-50"><Trash2 className="w-4 h-4"/></Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="admit_card">
                        <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
                            <div>
                                <h3 className="font-bold flex items-center gap-2 text-gray-800 mb-1"><FileText className="w-5 h-5 text-green-600"/> প্রবেশপত্র প্রিন্ট</h3>
                                <p className="text-sm text-gray-500">
                                     মোট শিক্ষার্থী: {toBengaliNumber(students.length)} জন | রুটিন সেট করা হয়েছে: {routines.length > 0 ? 'হ্যাঁ' : 'না'}
                                </p>
                            </div>
                            <Button onClick={handlePrintAdmitCards} disabled={students.length === 0 || routines.length === 0} className="bg-green-600 hover:bg-green-700 shadow-md">
                                <Printer className="w-4 h-4 mr-2"/> সব প্রবেশপত্র প্রিন্ট করুন
                            </Button>
                        </div>
                        <div className="mt-4 p-10 text-center text-gray-400 border-2 border-dashed rounded-xl bg-gray-50">
                            <School className="w-12 h-12 mx-auto mb-2 opacity-20"/>
                            <p>প্রিন্ট প্রিভিউ দেখতে উপরের বাটনে ক্লিক করুন</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </TabsContent>

            {/* ====== TAB 2: RESULTS ====== */}
            <TabsContent value="results" className="print:hidden">
                <Tabs defaultValue="entry" className="w-full">
                    <TabsList className="w-full justify-start border-b bg-transparent h-12 rounded-none p-0 mb-4 space-x-6">
                        <TabsTrigger value="entry" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-purple-800 px-4 py-2">নম্বর এন্ট্রি (টেবুলেশন)</TabsTrigger>
                        <TabsTrigger value="view" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-purple-800 px-4 py-2">ফলাফল ও মার্কশিট</TabsTrigger>
                    </TabsList>

                    {/* Sub Tab: Entry */}
                    <TabsContent value="entry">
                        <div className="bg-white p-4 rounded-xl border shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold text-gray-800">নম্বর এন্ট্রি শিট</h2>
                                    <Button size="sm" variant="ghost" onClick={fetchTabulationData} title="রিফ্রেশ">
                                        <RefreshCcw className="w-4 h-4 text-gray-500"/>
                                    </Button>
                                </div>
                                <Button onClick={saveTabulationSheet} disabled={isSavingTabulation} className="bg-green-600 hover:bg-green-700 shadow-md">
                                    {isSavingTabulation ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2 w-4 h-4"/>} ফলাফল সেভ করুন
                                </Button>
                            </div>

                            <div className="overflow-x-auto border rounded-lg shadow-inner max-h-[70vh] relative">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="bg-gray-100 text-gray-700 font-bold border-b sticky top-0 z-20 shadow-sm">
                                        <tr>
                                            <th className="p-2 border border-gray-300 w-16 text-center bg-gray-100 sticky left-0 z-30">রোল</th>
                                            <th className="p-2 border border-gray-300 w-24 text-center bg-gray-100 sticky left-16 z-30">আইডি</th>
                                            <th className="p-2 border border-gray-300 w-48 bg-gray-100 sticky left-40 z-30 shadow-r">নাম</th>
                                            {subjects.map(sub => (
                                                <th key={sub.id} className="p-2 border border-gray-300 min-w-[80px] text-center whitespace-nowrap" title={sub.name}>
                                                    <div className="text-xs">{sub.name}</div>
                                                    <div className="text-[10px] text-gray-500 font-normal">({sub.full_marks})</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.length === 0 ? (
                                            <tr><td colSpan={3 + subjects.length} className="text-center p-10 text-gray-400">কোনো শিক্ষার্থী নেই</td></tr>
                                        ) : (
                                            students.map((student) => (
                                                <tr key={student.id} className="hover:bg-gray-50 group">
                                                    <td className="p-2 border border-gray-300 text-center font-bold bg-white group-hover:bg-gray-50 sticky left-0 z-10">{toBengaliNumber(student.roll_no || '-')}</td>
                                                    <td className="p-2 border border-gray-300 text-center font-mono text-xs bg-white group-hover:bg-gray-50 sticky left-16 z-10">{student.student_id}</td>
                                                    <td className="p-2 border border-gray-300 font-medium truncate bg-white group-hover:bg-gray-50 sticky left-40 z-10 shadow-r" title={student.name_bn}>{student.name_bn}</td>
                                                    {subjects.map(sub => {
                                                        const currentMark = tabulationData[student.student_id]?.[sub.id] || "";
                                                        return (
                                                            <td key={sub.id} className="p-1 border border-gray-300 text-center">
                                                                <input 
                                                                    type="number"
                                                                    className="w-full h-8 text-center text-sm font-bold bg-transparent focus:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-green-500 rounded transition-all"
                                                                    placeholder="-"
                                                                    value={currentMark}
                                                                    onChange={(e) => handleTabulationChange(student.id, sub.id, e.target.value)}
                                                                />
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Sub Tab: View & Print */}
                    <TabsContent value="view">
                        <div className="bg-white p-6 rounded-xl border shadow-sm w-full overflow-x-auto">
                            <div className="flex justify-between items-center mb-4">
                                 <div className="flex items-center gap-2">
                                     <h2 className="text-lg font-bold text-gray-800">সম্পূর্ণ ফলাফল তালিকা (মেধাক্রম অনুযায়ী)</h2>
                                     <Button size="sm" variant="ghost" onClick={fetchTabulationData} title="রিফ্রেশ"><RefreshCcw className="w-4 h-4 text-gray-500"/></Button>
                                 </div>
                                 <div className="flex gap-2">
                                     <Button onClick={handlePrintTabulation} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                                         <FileSpreadsheet className="w-4 h-4 mr-2"/> ফলাফল শিট প্রিন্ট
                                     </Button>
                                     <Button onClick={handlePrintTranscriptAll} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                                         <Users className="w-4 h-4 mr-2"/> সকল মার্কশিট প্রিন্ট
                                     </Button>
                                 </div>
                            </div>
                            
                            <Table className="border rounded-lg">
                                <TableHeader className="bg-gray-100">
                                    <TableRow>
                                        <TableHead className="text-center border font-bold text-black bg-gray-200">রোল</TableHead>
                                        <TableHead className="border font-bold text-black bg-gray-200 w-48">শিক্ষার্থীর নাম</TableHead>
                                        
                                        {/* Subject Columns Headers */}
                                        {subjects.map(sub => (
                                            <TableHead key={sub.id} className="text-center border text-xs font-semibold px-2 min-w-[60px]" title={sub.name}>
                                                {sub.name.substring(0, 10)}{sub.name.length > 10 ? '..' : ''}
                                            </TableHead>
                                        ))}

                                        <TableHead className="text-center border font-bold text-black bg-gray-200">মোট</TableHead>
                                        <TableHead className="text-center border font-bold text-black bg-gray-200">জিপিএ</TableHead>
                                        <TableHead className="text-center border font-bold text-black bg-gray-200">গ্রেড</TableHead>
                                        <TableHead className="text-center border font-bold text-purple-800 bg-purple-100">মেধাস্থান</TableHead>
                                        <TableHead className="text-right border font-bold text-black bg-gray-200">অ্যাকশন</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {resultsWithRank.map((std: any) => (
                                        <TableRow key={std.id} className="hover:bg-gray-50">
                                            <TableCell className="text-center font-bold border">{toBengaliNumber(std.roll_no || '-')}</TableCell>
                                            <TableCell className="font-medium border">{std.name_bn}</TableCell>
                                            
                                            {/* Subject Marks Columns */}
                                            {subjects.map(sub => {
                                                const markStr = tabulationData[std.student_id]?.[sub.id];
                                                return (
                                                    <TableCell key={sub.id} className="text-center border text-xs text-gray-600">
                                                        {markStr ? toBengaliNumber(markStr) : '-'}
                                                    </TableCell>
                                                )
                                            })}

                                            <TableCell className="text-center font-mono border font-semibold">{toBengaliNumber(std.summary.total)}</TableCell>
                                            <TableCell className="text-center font-bold text-blue-600 border">{toBengaliNumber(std.summary.gpa.toFixed(2))}</TableCell>
                                            <TableCell className="text-center border">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${std.summary.status === 'Fail' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                    {std.summary.grade}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-purple-700 bg-purple-50 border">
                                                {toBengaliNumber(std.rank)}
                                            </TableCell>
                                            <TableCell className="text-right border">
                                                <Button size="sm" variant="outline" className="h-7 text-xs border-green-600 text-green-700 hover:bg-green-50" onClick={() => handlePrintTranscriptSingle(std)}>
                                                    মার্কশিট
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </TabsContent>
        </Tabs>
      )}

      {/* Routine Setup Modal */}
      <Dialog open={isRoutineModalOpen} onOpenChange={setIsRoutineModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>পরীক্ষার রুটিন সেটআপ</DialogTitle><DialogDescription>সব বিষয়ের তারিখ ও সময় একসাথে সেট করুন</DialogDescription></DialogHeader>
            <div className="overflow-x-auto border rounded-lg mt-4">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b sticky top-0">
                        <tr>
                            <th className="p-3">বিষয়</th>
                            <th className="p-3 w-40">তারিখ</th>
                            <th className="p-3 w-32">শুরু</th>
                            <th className="p-3 w-32">শেষ</th>
                            <th className="p-3 w-24">পূর্ণমান</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {subjects.map(sub => (
                            <tr key={sub.id} className="hover:bg-gray-50">
                                <td className="p-3 font-medium">{sub.name}</td>
                                <td className="p-3"><Input type="date" value={routineData[sub.id]?.date || ""} onChange={(e) => handleRoutineChange(sub.id, 'date', e.target.value)} className="h-8" /></td>
                                <td className="p-3"><Input type="time" value={routineData[sub.id]?.start || "10:00"} onChange={(e) => handleRoutineChange(sub.id, 'start', e.target.value)} className="h-8" /></td>
                                <td className="p-3"><Input type="time" value={routineData[sub.id]?.end || "13:00"} onChange={(e) => handleRoutineChange(sub.id, 'end', e.target.value)} className="h-8" /></td>
                                <td className="p-3"><Input type="number" value={routineData[sub.id]?.full_marks || sub.full_marks || 100} onChange={(e) => handleRoutineChange(sub.id, 'full_marks', e.target.value)} className="h-8 w-20 text-center" /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsRoutineModalOpen(false)}>বাতিল</Button>
                <Button onClick={saveAllRoutines} disabled={isSavingRoutine} className="bg-green-600 hover:bg-green-700">
                    {isSavingRoutine ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2 w-4 h-4"/>} সব সেভ করুন
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* ---------------- PRINT AREAS ---------------- */}
      
      {/* 1. ADMIT CARD PRINT AREA */}
      {printMode === 'admit' && (
        <div id="printable-admit-area" className="hidden print:block">
            {students.map((student) => (
                <div key={student.id} className="admit-card relative mb-6 print:mb-0 bg-white" style={{ fontFamily: "'Kalpurush', 'Siyam Rupali', sans-serif" }}>
                    <div className="border-4 border-double border-green-800 p-2 h-full rounded-2xl relative">
                        <div className="border border-green-600 p-3 rounded-lg h-full relative flex flex-col justify-end pt-2">
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
                                <School className="w-64 h-64 text-green-900" />
                            </div>
                            <div className="relative z-10 flex-shrink-0">
                                <div className="text-center mb-1">
                                    <div className="flex justify-center mb-1 w-full relative h-6">
                                        <Image src="/images/bismillah.svg" alt="Bismillah" fill className="object-contain" priority />
                                    </div>
                                    <div className="flex flex-col items-center justify-center gap-1 mb-1 w-full">
                                        <div className="w-full flex justify-center relative h-12">
                                            <Image src="/images/long_logo.svg" alt="Madrasa Logo" fill className="object-contain" priority />
                                        </div>
                                        <div className="text-center mt-1">
                                            <p className="text-sm font-bold text-gray-700">হলিধানী বাজার, ঝিনাইদহ সদর, ঝিনাইদহ</p>
                                        </div>
                                    </div>
                                    <div className="border-b-2 border-green-800 w-full my-1"></div>
                                    <h2 className="text-xl font-bold text-black">{exam?.title}</h2>
                                    <div><span className="inline-block px-6 py-0.5 rounded-2xl border-2 border-black font-extrabold text-base bg-green-700 text-white shadow-sm print:bg-green-700 print:text-white print-color-exact">প্রবেশপত্র</span></div>
                                </div>
                                <div className="bg-green-50/50 p-2 rounded-lg border border-green-100 mb-1 text-sm print:bg-green-50">
                                    <div className="flex justify-between items-center mb-1 font-bold text-xs">
                                        <div className="border border-green-700 rounded px-2 py-0.5 bg-white text-green-900 shadow-sm">আইডি: <span className="font-mono">{toBengaliNumber(student.student_id)}</span></div>
                                        <div className="border border-green-700 rounded px-2 py-0.5 bg-white text-green-900 shadow-sm">শ্রেণি: {classes.find(c => c.id === selectedClass)?.name}</div>
                                        <div className="border border-green-700 rounded px-2 py-0.5 bg-white text-green-900 shadow-sm">রোল: <span className="font-mono">{toBengaliNumber(student.roll_no || '---')}</span></div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 pt-1 border-t border-green-200 text-xs font-semibold text-center">
                                        <div><span className="text-gray-600 block text-[10px]">নাম</span><span className="text-gray-900 leading-tight block">{student.name_bn}</span></div>
                                        <div><span className="text-gray-600 block text-[10px]">পিতা</span><span className="text-gray-800 leading-tight block">{student.father_name_bn}</span></div>
                                        <div><span className="text-gray-600 block text-[10px]">মাতা</span><span className="text-gray-800 leading-tight block">{student.mother_name_bn}</span></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <table className="w-full text-[12px] border-collapse border border-green-900">
                                    <thead className="bg-green-100 text-green-900 print:bg-green-100">
                                        <tr>
                                            <th className="border border-green-900 p-0.5 w-[15%] text-center">তারিখ</th>
                                            <th className="border border-green-900 p-0.5 w-[10%] text-center">বার</th>
                                            <th className="border border-green-900 p-0.5 text-left pl-1">বিষয়</th>
                                            <th className="border border-green-900 p-0.5 w-auto text-center">সময়</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {routines.map(r => (
                                            <tr key={r.id}>
                                                <td className="border border-green-900 p-0.5 text-center font-bold">{toBengaliNumber(format(new Date(r.exam_date), 'dd/MM/yy'))}</td>
                                                <td className="border border-green-900 p-0.5 text-center">{getBengaliDay(r.exam_date)}</td>
                                                <td className="border border-green-900 p-0.5 font-bold truncate pl-1">{r.academic_subjects?.name}</td>
                                                <td className="border border-green-900 p-0.5 text-center whitespace-nowrap text-[11px]">{formatTimeBangla(r.start_time)} - {formatTimeBangla(r.end_time)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-between items-end mt-4 px-4 pb-0 flex-shrink-0">
                                <div className="text-center"><div className="w-24 border-t border-black border-dashed mb-1"></div><p className="text-[10px] font-bold">অভিভাবকের স্বাক্ষর</p></div>
                                <div className="text-center"><div className="w-24 border-t border-black border-dashed mb-1"></div><p className="text-[10px] font-bold">মুহ্তামিমের স্বাক্ষর</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* 2. TRANSCRIPT PRINT AREA */}
      {printMode.startsWith('transcript') && (
        <div id="printable-transcript-area" className="hidden print:block font-[Kalpurush]">
             {(printMode === 'transcript-single' && studentForTranscript ? [studentForTranscript] : students).map((student) => (
                 <div key={student.id} className="transcript-container w-full h-screen p-8 box-border" style={{ pageBreakAfter: 'always' }}>
                     <TranscriptTemplate student={student} />
                 </div>
             ))}
        </div>
      )}

      {/* 3. TABULATION SHEET PRINT AREA (NEW) */}
      {printMode === 'tabulation' && (
          <div id="printable-tabulation-area" className="hidden print:block font-[Kalpurush] w-full">
              <div className="p-4">
                  {/* Header */}
                  <div className="text-center mb-6">
                      <div className="flex justify-center mb-2 h-8 relative">
                          <Image src="/images/bismillah.svg" alt="Bismillah" fill className="object-contain" priority />
                      </div>
                      <div className="w-full flex justify-center relative h-16 mb-2">
                          <Image src="/images/long_logo.svg" alt="Madrasa Logo" fill className="object-contain" priority />
                      </div>
                      <p className="text-lg font-bold text-gray-700">হলিধানী বাজার, ঝিনাইদহ সদর, ঝিনাইদহ</p>
                      <div className="border-b-2 border-green-800 w-full my-2"></div>
                      <h2 className="text-2xl font-extrabold text-black mb-1">ফলাফল তালিকা (Tabulation Sheet)</h2>
                      <h3 className="text-lg font-bold text-green-800">
                          {exam?.title} - {toBengaliNumber(exam?.academic_year || "")} | শ্রেণি: {classes.find(c => c.id === selectedClass)?.name}
                      </h3>
                  </div>

                  {/* Table */}
                  <table className="w-full border-collapse border border-black text-[10px] text-center">
                      <thead>
                          <tr className="bg-gray-200 print:bg-gray-200">
                              <th className="border border-black p-1 w-10">রোল</th>
                              <th className="border border-black p-1 w-40 text-left">শিক্ষার্থীর নাম</th>
                              {subjects.map(sub => (
                                  <th key={sub.id} className="border border-black p-1 min-w-[40px]">
                                      {sub.name} <br/> ({toBengaliNumber(sub.full_marks || 100)})
                                  </th>
                              ))}
                              <th className="border border-black p-1 w-12 bg-gray-100">মোট</th>
                              <th className="border border-black p-1 w-10 bg-gray-100">জিপিএ</th>
                              <th className="border border-black p-1 w-10 bg-gray-100">গ্রেড</th>
                              <th className="border border-black p-1 w-10 bg-gray-100">মেধা</th>
                          </tr>
                      </thead>
                      <tbody>
                          {resultsWithRank.map((std: any) => (
                              <tr key={std.id}>
                                  <td className="border border-black p-1 font-bold">{toBengaliNumber(std.roll_no || '-')}</td>
                                  <td className="border border-black p-1 text-left font-medium">{std.name_bn}</td>
                                  {subjects.map(sub => {
                                      const markStr = tabulationData[std.student_id]?.[sub.id];
                                      return (
                                          <td key={sub.id} className="border border-black p-1">
                                              {markStr ? toBengaliNumber(markStr) : '-'}
                                          </td>
                                      )
                                  })}
                                  <td className="border border-black p-1 font-bold">{toBengaliNumber(std.summary.total)}</td>
                                  <td className="border border-black p-1 font-bold">{toBengaliNumber(std.summary.gpa.toFixed(2))}</td>
                                  <td className="border border-black p-1 font-bold">{std.summary.grade}</td>
                                  <td className="border border-black p-1 font-bold">{toBengaliNumber(std.rank)}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>

                  {/* Signatures */}
                  <div className="flex justify-between items-end mt-16 pt-8 px-8">
                      <div className="text-center">
                          <div className="w-40 border-t border-black border-dashed mb-2"></div>
                          <p className="font-bold">শ্রেণি শিক্ষকের স্বাক্ষর</p>
                      </div>
                      <div className="text-center">
                          <div className="w-40 border-t border-black border-dashed mb-2"></div>
                          <p className="font-bold">অধ্যক্ষের স্বাক্ষর</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Print CSS */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Tiro+Bangla&display=swap');

        @media print {
            @page {
                size: ${printMode === 'tabulation' ? 'A4 landscape' : 'A4 portrait'};
                margin: 0.25in;
            }
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                margin: 0;
                padding: 0;
            }
            body * { visibility: hidden; }
            
            #printable-admit-area, #printable-admit-area * { visibility: visible; }
            #printable-transcript-area, #printable-transcript-area * { visibility: visible; }
            #printable-tabulation-area, #printable-tabulation-area * { visibility: visible; }
            
            #printable-admit-area {
                position: absolute; left: 0; top: 0; width: 100%;
            }
            #printable-transcript-area {
                position: absolute; left: 0; top: 0; width: 100%;
            }
            #printable-tabulation-area {
                position: absolute; left: 0; top: 0; width: 100%;
            }

            .admit-card {
                height: 135mm; margin-bottom: 5mm; page-break-inside: avoid;
                border: none !important; display: flex; flex-direction: column;
                font-family: 'Tiro Bangla', 'Kalpurush', sans-serif !important;
            }
            .admit-card:nth-child(2n) { page-break-after: always; margin-bottom: 0; }
            
            /* Transcript CSS Fixes */
            .transcript-container {
                width: 100%;
                /* A4 height - minimal margin calculation handled by @page */
                height: 100vh; 
                padding: 0;
            }
            
            .transcript-page {
                width: 100%;
                height: 98%;
                box-sizing: border-box;
            }

            .print-color-exact { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            aside, nav, header { display: none !important; }
            .print\\:hidden { display: none !important; }
            [role="tablist"] { display: none !important; }
        }
      `}</style>
    </div>
  );
}