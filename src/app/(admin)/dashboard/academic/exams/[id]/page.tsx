"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
// ফিক্স: CheckCircle ইম্পোর্ট করা হয়েছে
import { Loader2, Printer, Save, Calendar, User, BookOpen, CheckCircle, Search, Edit, Trash2, AlertTriangle, School } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import Image from "next/image";

// --- বাংলা কনভার্সন হেল্পার ---
const toBengaliNumber = (num: string | number) => {
  if (!num && num !== 0) return "";
  const english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'PM', 'AM'];
  const bengali = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯', 'পিএম', 'এএম'];
  
  let str = String(num);
  english.forEach((char, index) => {
    str = str.replace(new RegExp(char, 'g'), bengali[index]);
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

  // Marks State
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [marksData, setMarksData] = useState<Record<string, number>>({});
  const [isSavingMarks, setIsSavingMarks] = useState(false);

  useEffect(() => {
    fetchExamDetails();
  }, [id]);

  useEffect(() => {
    if (selectedClass) {
        fetchClassData();
    }
  }, [selectedClass]);

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
            .order("student_id");
        
        if (stds) setStudents(stds);
    }

    fetchRoutines();
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

  // --- Routine Logic ---
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

  const saveAllRoutines = async () => {
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

  // --- Marks Logic ---
  const handleMarksChange = (studentId: string, value: string) => {
      setMarksData(prev => ({ ...prev, [studentId]: parseInt(value) || 0 }));
  };

  const saveMarks = async () => {
      if (!selectedSubject) return alert("বিষয় সিলেক্ট করুন");
      setIsSavingMarks(true);
      
      const payload = Object.keys(marksData).map(stdId => ({
          exam_id: id,
          subject_id: selectedSubject,
          student_id: students.find(s => s.id === stdId)?.student_id, 
          marks_obtained: marksData[stdId]
      }));

      const { error } = await supabase.from("exam_marks").upsert(payload, { onConflict: 'exam_id, student_id, subject_id' });
      
      if (error) alert("এরর: " + error.message);
      else alert("নম্বর সেভ হয়েছে!");
      
      setIsSavingMarks(false);
  };

  // --- Print Admit Card ---
  const handlePrintAdmitCards = () => {
    if (students.length === 0) return alert("প্রিন্ট করার মতো কোনো শিক্ষার্থী নেই!");
    window.print();
  };

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
        <Tabs defaultValue="routine" className="w-full">
            <TabsList className="grid w-full grid-cols-4 print:hidden bg-white border p-1 h-12 rounded-xl">
                <TabsTrigger value="routine" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">রুটিন</TabsTrigger>
                <TabsTrigger value="admit" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">প্রবেশপত্র</TabsTrigger>
                <TabsTrigger value="marks" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">নম্বর প্রদান</TabsTrigger>
                <TabsTrigger value="result" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">ফলাফল</TabsTrigger>
            </TabsList>

            {/* --- 1. Routine Tab --- */}
            <TabsContent value="routine" className="space-y-4 print:hidden">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold flex items-center gap-2 text-gray-700"><Calendar className="w-5 h-5 text-purple-600"/> পরীক্ষার রুটিন</h3>
                        <Button onClick={openRoutineModal} className="bg-purple-600 hover:bg-purple-700 shadow-md">
                            <Edit className="w-4 h-4 mr-2"/> রুটিন সেটআপ / এডিট করুন
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

            {/* --- 2. Admit Card Tab (Updated for Professional Look) --- */}
            <TabsContent value="admit">
                <div className="print:hidden mb-4 flex justify-end bg-yellow-50 p-3 rounded-lg border border-yellow-200 items-center justify-between">
                    <div className="flex items-center gap-2 text-yellow-800 text-sm">
                        <CheckCircle className="w-4 h-4"/> 
                        <span>মোট শিক্ষার্থী: <strong>{toBengaliNumber(students.length)} জন</strong> | রুটিন সেট করা হয়েছে: <strong>{routines.length > 0 ? 'হ্যাঁ' : 'না'}</strong></span>
                    </div>
                    <Button onClick={handlePrintAdmitCards} disabled={students.length === 0} className="bg-green-600 hover:bg-green-700 gap-2"><Printer className="w-4 h-4"/> সব প্রবেশপত্র প্রিন্ট করুন</Button>
                </div>
                
                {/* Admit Cards Container */}
                <div id="printable-admit-area">
                    {students.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed text-gray-400 print:hidden">
                            <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-50"/>
                            <p>এই ক্লাসে কোনো শিক্ষার্থী পাওয়া যায়নি।</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 print:block font-[Kalpurush]">
                            {students.map((student) => (
                                <div key={student.id} className="admit-card relative mb-6 print:mb-0 bg-white" style={{ fontFamily: "'Kalpurush', 'Siyam Rupali', sans-serif" }}>
                                    
                                    {/* Double Border Frame */}
                                    <div className="border-4 border-double border-green-800 p-2 h-full rounded-2xl relative">
                                        
                                        <div className="border border-green-600 p-4 rounded-lg h-full relative flex flex-col justify-end">
                                            
                                            {/* Watermark */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
                                                 <School className="w-64 h-64 text-green-900" />
                                            </div>

                                            <div className="relative z-10 flex-shrink-0">
                                                {/* Header Section */}
                                                <div className="text-center mb-1">
                                                    {/* Bismillah above logo */}
                                                    <div className="flex justify-center mb-2 mt-2">
                                                        <Image src="/images/bismillah.svg" alt="Bismillah" width={200} height={30} className="h-5 w-auto object-contain" />
                                                    </div>
                                                    {/* Logo & Name */}
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="flex flex-col items-center justify-center gap-1 mb-1 w-full">
                                                            <div className="mb-0.5 w-full flex justify-center">
                                                                {/* Logo height adjusted to h-12 */}
                                                                <Image src="/images/long_logo.svg" alt="Madrasa Logo" width={600} height={120} className="h-12 w-auto object-contain" />
                                                            </div>
                                                            <div className="text-center -mt-1">
                                                                <p className="text-sm font-bold text-gray-700">হলিধানী বাজার, ঝিনাইদহ সদর, ঝিনাইদহ</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="border-b-2 border-green-800 w-full my-1"></div>
                                                    <h2 className="text-xl font-bold text-black">{exam?.title}</h2>
                                                    <div>
                                                        <span className="inline-block px-6 py-0.5 rounded-2xl border-2 border-black font-extrabold text-base bg-green-700 text-white shadow-sm">
                                                            প্রবেশপত্র
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Student Info (Updated Layout) */}
                                                <div className="bg-green-50/50 p-3 rounded-lg border border-green-100 mb-1 text-sm">
                                                    {/* Row 1: Badges */}
                                                    <div className="flex justify-between items-center mb-2 font-bold text-xs">
                                                        <div className="border border-green-700 rounded px-3 py-0.5 bg-white text-green-900 shadow-sm">
                                                            আইডি: <span className="font-mono">{toBengaliNumber(student.student_id)}</span>
                                                        </div>
                                                        <div className="border border-green-700 rounded px-3 py-0.5 bg-white text-green-900 shadow-sm">
                                                            শ্রেণি: {classes.find(c => c.id === selectedClass)?.name}
                                                        </div>
                                                        <div className="border border-green-700 rounded px-3 py-0.5 bg-white text-green-900 shadow-sm">
                                                            রোল: <span className="font-mono">{toBengaliNumber(student.roll_no || '---')}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Row 2: One Line Names */}
                                                    <div className="flex flex-wrap justify-between items-center gap-x-2 pt-1 border-t border-green-200 text-xs font-semibold">
                                                        <div className="flex gap-1 items-baseline">
                                                            <span className="text-gray-600">নাম:</span>
                                                            <span className="text-gray-900">{student.name_bn}</span>
                                                        </div>
                                                        <div className="flex gap-1 items-baseline">
                                                            <span className="text-gray-600">পিতা:</span>
                                                            <span className="text-gray-800">{student.father_name_bn}</span>
                                                        </div>
                                                        <div className="flex gap-1 items-baseline">
                                                            <span className="text-gray-600">মাতা:</span>
                                                            <span className="text-gray-800">{student.mother_name_bn}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Routine Table */}
                                            <div className="flex-1">
                                                <table className="w-full text-[13px] border-collapse border border-green-900">
                                                    <thead className="bg-green-100 text-green-900">
                                                        <tr>
                                                            <th className="border border-green-900 p-1 w-[15%] text-center">তারিখ</th>
                                                            <th className="border border-green-900 p-1 w-[10%] text-center">বার</th>
                                                            <th className="border border-green-900 p-1 text-left">বিষয়</th>
                                                            <th className="border border-green-900 p-1 w-auto text-center px-2">সময়সীমা</th>
                                                            <th className="border border-green-900 p-1 w-[15%] text-center">মোট সময়</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {routines.map(r => (
                                                            <tr key={r.id}>
                                                                <td className="border border-green-900 p-1 text-center font-bold">{toBengaliNumber(format(new Date(r.exam_date), 'dd/MM/yy'))}</td>
                                                                <td className="border border-green-900 p-1 text-center">{getBengaliDay(r.exam_date)}</td>
                                                                <td className="border border-green-900 p-1 font-bold truncate max-w-[100px]">{r.academic_subjects?.name}</td>
                                                                <td className="border border-green-900 p-1 text-center whitespace-nowrap">{formatTimeBangla(r.start_time)} - {formatTimeBangla(r.end_time)}</td>
                                                                <td className="border border-green-900 p-1 text-center">{calculateDurationBangla(r.start_time, r.end_time)}</td>
                                                            </tr>
                                                        ))}
                                                        {routines.length === 0 && (
                                                            <tr><td colSpan={5} className="border border-green-900 p-4 text-center text-gray-500">রুটিন এখনো প্রকাশিত হয়নি</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Signatures */}
                                            <div className="flex justify-between items-end mt-8 px-4 pb-0 flex-shrink-0">
                                                <div className="text-center">
                                                    <div className="w-32 border-t border-black border-dashed mb-1 mt-6"></div>
                                                    <p className="text-[12px] font-bold">অভিভাবকের স্বাক্ষর</p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="w-32 border-t border-black border-dashed mb-1 mt-6"></div>
                                                    <p className="text-[12px] font-bold">মুহ্তামিমের স্বাক্ষর</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </TabsContent>

            {/* --- 3. Marks Tab --- */}
            <TabsContent value="marks" className="print:hidden">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-lg">
                        <div className="w-64">
                            <label className="text-sm font-bold text-gray-600 block mb-1">বিষয় নির্বাচন করুন</label>
                            <select 
                                className="w-full border p-2 rounded bg-white"
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                            >
                                <option value="">বিষয়...</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.full_marks})</option>)}
                            </select>
                        </div>
                        <Button onClick={saveMarks} disabled={isSavingMarks} className="bg-purple-600 hover:bg-purple-700">
                            {isSavingMarks ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2 w-4 h-4"/>} নম্বর সেভ করুন
                        </Button>
                    </div>

                    {selectedSubject && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>আইডি</TableHead>
                                    <TableHead>নাম</TableHead>
                                    <TableHead className="w-40">প্রাপ্ত নম্বর</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map(std => (
                                    <TableRow key={std.id}>
                                        <TableCell className="font-mono font-bold text-gray-500">{std.student_id}</TableCell>
                                        <TableCell>{std.name_bn}</TableCell>
                                        <TableCell>
                                            <Input 
                                                type="number" 
                                                className="font-bold text-center border-purple-200 focus:ring-purple-500"
                                                placeholder="00"
                                                onChange={(e) => handleMarksChange(std.id, e.target.value)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </TabsContent>
            
            {/* --- 4. Result Tab --- */}
            <TabsContent value="result">
                <div className="p-10 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed">
                    রেজাল্ট শিট জেনারেশন সিস্টেম শীঘ্রই আসছে...
                </div>
            </TabsContent>
        </Tabs>
      )}

      {/* Routine Setup Modal */}
      <Dialog open={isRoutineModalOpen} onOpenChange={setIsRoutineModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>পরীক্ষার রুটিন সেটআপ</DialogTitle><DialogDescription>সব বিষয়ের তারিখ ও সময় একসাথে সেট করুন</DialogDescription></DialogHeader>
            <div className="overflow-x-auto border rounded-lg mt-4">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b sticky top-0">
                        <tr>
                            <th className="p-3">বিষয়</th>
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
      
      {/* Print CSS Logic */}
      <style jsx global>{`
        /* Import Kalpurush Font if available locally or via URL */
        @import url('https://fonts.googleapis.com/css2?family=Tiro+Bangla&display=swap');

        @media print {
            @page {
                size: A4;
                margin: 0.4in;
            }
            body * { visibility: hidden; }
            #printable-admit-area, #printable-admit-area * { visibility: visible; }
            
            #printable-admit-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
            }

            .admit-card {
                /* A4 Height is ~11.7in. With 0.4in top/bottom margin.
                   Using 140mm (approx 5.5in) to fit 2 cards comfortably. */
                height: 140mm; 
                margin-bottom: 5mm;
                page-break-inside: avoid;
                border: none !important;
                display: flex;
                flex-direction: column;
                font-family: 'Tiro Bangla', 'Kalpurush', sans-serif !important;
            }
            
            .admit-card:nth-child(2n) {
                page-break-after: always;
                margin-bottom: 0;
            }
            
            .admit-card > div {
                border-width: 2px !important;
            }

            aside, nav, header { display: none !important; }
            .print\\:hidden { display: none !important; }
            [role="tablist"] { display: none !important; }
        }
      `}</style>
    </div>
  );
}