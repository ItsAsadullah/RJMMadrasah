"use client";

import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Calendar as CalendarIcon, 
  Save, Loader2, ArrowLeft, CheckCircle2, BookOpen, GraduationCap 
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export default function AttendancePage({ params }: { params: Promise<{ branchId: string, classId: string }> }) {
  const { branchId, classId } = use(params);
  const searchParams = useSearchParams();
  
  // URL Params
  const queryDate = searchParams.get('date');
  const type = searchParams.get('type') || 'general';
  const subjectId = searchParams.get('subjectId');

  const [date, setDate] = useState(queryDate || new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [subjectInfo, setSubjectInfo] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [date, subjectId]); 

  const fetchData = async () => {
    setLoading(true);
    
    // ১. ক্লাসের তথ্য আনা
    const { data: cls } = await supabase.from("academic_classes").select("name, academic_year").eq("id", classId).single();
    if (cls) {
        setClassInfo(cls);
        
        // স্টুডেন্ট লিস্ট আনা
        const { data: stuData } = await supabase
          .from("students")
          .select("id, student_id, name_bn, roll_no, photo_url")
          .eq("branch_id", parseInt(branchId))
          .eq("class_name", cls.name)
          .eq("academic_year", cls.academic_year)
          .eq("status", "active")
          .order("roll_no", { ascending: true });

        if (stuData) setStudents(stuData);
    }

    // ২. যদি বিষয়ভিত্তিক হয়, বিষয়ের নাম আনা
    if (type === 'subject' && subjectId) {
        const { data: sub } = await supabase.from("academic_subjects").select("name").eq("id", subjectId).single();
        if (sub) setSubjectInfo(sub);
    }

    // ৩. পূর্বের হাজিরা চেক করা
    let query = supabase
      .from("attendance")
      .select("student_id, status, remarks")
      .eq("class_id", classId)
      .eq("date", date)
      .eq("branch_id", parseInt(branchId));
    
    if (type === 'subject' && subjectId) {
        query = query.eq("subject_id", subjectId);
    } else {
        query = query.is("subject_id", null); // জেনারেল হলে subject_id নাল থাকবে
    }

    const { data: attData } = await query;

    const attMap: Record<string, AttendanceStatus> = {};
    const remMap: Record<string, string> = {};
    
    if (attData) {
      attData.forEach((a: any) => {
        attMap[a.student_id] = a.status;
        if (a.remarks) remMap[a.student_id] = a.remarks;
      });
    }
    
    setAttendance(attMap);
    setRemarks(remMap);
    setLoading(false);
  };

  const handleStatusChange = (id: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [id]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const newAtt: Record<string, AttendanceStatus> = {};
    students.forEach(s => newAtt[s.id] = status);
    setAttendance(newAtt);
  };

  const handleSave = async () => {
    setSaving(true);
    
    const upsertData = students.map(s => ({
        student_id: s.id,
        class_id: classId,
        branch_id: parseInt(branchId),
        date: date,
        status: attendance[s.id] || null,
        remarks: remarks[s.id] || null,
        subject_id: type === 'subject' ? subjectId : null // বিষয় আইডি সেভ করা
    })).filter(a => a.status !== undefined && a.status !== null);

    if (upsertData.length === 0) {
        alert("দয়া করে অন্তত একজনের হাজিরা দিন।");
        setSaving(false);
        return;
    }

    // আগের ডাটা ডিলিট না করে Upsert করব, তবে subject_id এর ইউনিক কনস্ট্রেইন্ট খেয়াল রাখতে হবে
    // এখানে আমরা ধরে নিচ্ছি DB তে (student_id, date, subject_id) বা (student_id, date) ইউনিক।
    // যদি subject_id সাপোর্ট না থাকে, তাহলে এটি এরর দিতে পারে।
    
    // সেফটির জন্য আমরা আগে ডিলিট করে ইনসার্ট করতে পারি অথবা কনফ্লিক্ট হ্যান্ডেল করতে পারি।
    // এখানে সিম্পল Upsert ব্যবহার করা হচ্ছে। 
    
    // নোট: আপনার DB স্কিমায় যদি subject_id কলাম না থাকে, এটি কাজ করবে না। 
    
    // নির্দিষ্ট সাবজেক্ট এবং ডেটের জন্য ডিলিট করে নতুন করে ইনসার্ট (সেফ পদ্ধতি)
    let deleteQuery = supabase.from("attendance").delete().eq("class_id", classId).eq("date", date);
    if(type === 'subject' && subjectId) deleteQuery = deleteQuery.eq("subject_id", subjectId);
    else deleteQuery = deleteQuery.is("subject_id", null);
    
    await deleteQuery;

    const { error } = await supabase.from("attendance").insert(upsertData);

    if (error) {
        alert("ত্রুটি: " + error.message);
    } else {
        alert("হাজিরা সফলভাবে সংরক্ষিত হয়েছে! ✅");
    }
    setSaving(false);
  };

  const stats = {
    present: Object.values(attendance).filter(s => s === 'present').length,
    absent: Object.values(attendance).filter(s => s === 'absent').length,
    leave: Object.values(attendance).filter(s => s === 'leave').length,
    total: students.length
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Link href="/dashboard/attendance" className="hover:text-green-600 flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" /> ড্যাশবোর্ডে ফিরে যান
                </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                {type === 'subject' ? <BookOpen className="w-6 h-6 text-purple-600"/> : <GraduationCap className="w-6 h-6 text-green-600"/>}
                {classInfo?.name} - {type === 'subject' ? subjectInfo?.name : "সাধারণ"} উপস্থিতি
            </h1>
            <p className="text-sm text-gray-500">তারিখ: {format(new Date(date), 'dd MMMM yyyy')}</p>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border">
            <CalendarIcon className="w-5 h-5 text-gray-500" />
            <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="bg-white border rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
            />
        </div>
      </div>

      {/* Stats & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 bg-white p-4 rounded-xl border shadow-sm flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4 text-sm font-medium">
                  <span className="text-green-600 bg-green-50 px-2 py-1 rounded">উপস্থিত: {stats.present}</span>
                  <span className="text-red-600 bg-red-50 px-2 py-1 rounded">অনুপস্থিত: {stats.absent}</span>
                  <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded">ছুটি: {stats.leave}</span>
                  <span className="text-gray-600 px-2 py-1">মোট: {stats.total}</span>
              </div>
              <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => markAll('present')} className="text-green-600 hover:bg-green-50">সবাই P</Button>
                  <Button size="sm" variant="outline" onClick={() => setAttendance({})} className="text-gray-400">রিসেট</Button>
              </div>
          </div>
          <div className="md:col-span-1">
             <Button onClick={handleSave} disabled={saving} className="w-full h-full bg-green-600 hover:bg-green-700 font-bold text-lg shadow-md">
                 {saving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2"/>} সংরক্ষণ
             </Button>
          </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
            <div className="p-20 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto text-green-600"/></div>
        ) : (
            <Table>
                <TableHeader className="bg-gray-50">
                    <TableRow>
                        <TableHead className="w-16 text-center">রোল</TableHead>
                        <TableHead>শিক্ষার্থী</TableHead>
                        <TableHead className="text-center w-[250px]">স্ট্যাটাস</TableHead>
                        <TableHead>মন্তব্য</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map((student) => (
                        <TableRow key={student.id} className={cn("hover:bg-gray-50 transition-colors", attendance[student.id] === 'absent' ? 'bg-red-50 hover:bg-red-100' : '')}>
                            <TableCell className="font-mono font-bold text-center text-gray-600">{student.roll_no || "-"}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden relative border">
                                        {student.photo_url ? <Image src={student.photo_url} alt="" fill className="object-cover" /> : <div className="flex items-center justify-center h-full w-full text-xs font-bold text-gray-400">{student.name_bn[0]}</div>}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">{student.name_bn}</p>
                                        <p className="text-[10px] text-gray-500 font-mono">{student.student_id}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="flex justify-center gap-1 bg-gray-100 p-1 rounded-lg w-fit mx-auto">
                                    <button 
                                        onClick={() => handleStatusChange(student.id, 'present')}
                                        className={cn("w-8 h-8 rounded-md text-xs font-bold transition-all", attendance[student.id] === 'present' ? "bg-white text-green-600 shadow-sm ring-1 ring-green-200" : "text-gray-400 hover:text-green-600")}
                                        title="উপস্থিত"
                                    >P</button>
                                    <button 
                                        onClick={() => handleStatusChange(student.id, 'absent')}
                                        className={cn("w-8 h-8 rounded-md text-xs font-bold transition-all", attendance[student.id] === 'absent' ? "bg-white text-red-600 shadow-sm ring-1 ring-red-200" : "text-gray-400 hover:text-red-600")}
                                        title="অনুপস্থিত"
                                    >A</button>
                                    <button 
                                        onClick={() => handleStatusChange(student.id, 'late')}
                                        className={cn("w-8 h-8 rounded-md text-xs font-bold transition-all", attendance[student.id] === 'late' ? "bg-white text-orange-600 shadow-sm ring-1 ring-orange-200" : "text-gray-400 hover:text-orange-600")}
                                        title="দেরি"
                                    >L</button>
                                    <button 
                                        onClick={() => handleStatusChange(student.id, 'leave')}
                                        className={cn("w-8 h-8 rounded-md text-xs font-bold transition-all", attendance[student.id] === 'leave' ? "bg-white text-purple-600 shadow-sm ring-1 ring-purple-200" : "text-gray-400 hover:text-purple-600")}
                                        title="ছুটি/এক্সকিউজ"
                                    >E</button>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Input 
                                    value={remarks[student.id] || ""}
                                    onChange={(e) => setRemarks(prev => ({...prev, [student.id]: e.target.value}))}
                                    className="h-9 text-xs bg-white border-gray-200 focus:border-green-500"
                                    placeholder="কারণ লিখুন..."
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )}
      </div>
    </div>
  );
}
