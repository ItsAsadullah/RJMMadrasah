"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader2, Save, Search, BookOpen, Filter } from "lucide-react";

export default function ResultManagement() {
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  
  // ড্রপডাউন ডাটা
  const [branches, setBranches] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // সিলেকশন স্টেট
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  // ডাটা স্টেট
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<{ [key: string]: string }>({}); // student_id -> marks

  // ১. প্রাথমিক ডাটা লোড (Branch & Exam)
  useEffect(() => {
    const fetchInitData = async () => {
      const { data: b } = await supabase.from("branches").select("*").eq("is_active", true);
      const { data: e } = await supabase.from("exams").select("*").eq("year", selectedYear);
      if (b) setBranches(b);
      if (e) setExams(e);
    };
    fetchInitData();
  }, [selectedYear]);

  // ২. ক্লাস লোড (Branch & Year সিলেক্ট করলে)
  useEffect(() => {
    if (!selectedBranch || !selectedYear) return;
    const fetchClasses = async () => {
      const { data } = await supabase
        .from("academic_classes")
        .select("*")
        .eq("branch_id", selectedBranch)
        .eq("academic_year", selectedYear)
        .eq("is_active", true);
      if (data) setClasses(data);
      else setClasses([]);
    };
    fetchClasses();
  }, [selectedBranch, selectedYear]);

  // ৩. বিষয় লোড (Class সিলেক্ট করলে)
  useEffect(() => {
    if (!selectedClass) return;
    const fetchSubjects = async () => {
      const { data } = await supabase
        .from("academic_subjects")
        .select("*")
        .eq("class_id", selectedClass);
      if (data) setSubjects(data);
      else setSubjects([]);
    };
    fetchSubjects();
  }, [selectedClass]);

  // ৪. স্টুডেন্ট ফেচ করা
  const handleFetchStudents = async () => {
    if (!selectedClass || !selectedSubject || !selectedExam) {
      alert("দয়া করে পরীক্ষা, ক্লাস এবং বিষয় নির্বাচন করুন");
      return;
    }

    setFetchingStudents(true);
    
    // সিলেক্টেড ক্লাসের নাম বের করা (স্টুডেন্ট টেবিলের সাথে ম্যাচ করার জন্য)
    // নোট: স্টুডেন্ট টেবিলে আমরা class_name টেক্সট হিসেবে রেখেছিলাম। 
    // ভালো হতো যদি class_id ব্যবহার করতাম, তবে এখন নাম দিয়েই ম্যাচ করাচ্ছি।
    const clsObj = classes.find(c => c.id === selectedClass);
    if (!clsObj) return;

    // স্টুডেন্টদের তালিকা আনা
    const { data: stuData } = await supabase
      .from("students")
      .select("id, name_bn, birth_reg_no, photo_url")
      .eq("branch_id", selectedBranch)
      .eq("class_name", clsObj.name) // নাম দিয়ে ম্যাচিং
      .eq("status", "active")
      .order("name_bn", { ascending: true });

    // যদি ইতিমধ্যে রেজাল্ট সেভ করা থাকে, তা লোড করা
    const { data: existingResults } = await supabase
      .from("results")
      .select("student_id, marks")
      .eq("exam_name", exams.find(e => e.id === selectedExam)?.name)
      .eq("class_name", clsObj.name)
      .eq("subject_name", subjects.find(s => s.id === selectedSubject)?.name)
      .eq("year", selectedYear);

    if (stuData) {
      setStudents(stuData);
      
      // পুরনো নম্বর স্টেটে সেট করা
      const loadedMarks: any = {};
      existingResults?.forEach((r: any) => {
        loadedMarks[r.student_id] = r.marks;
      });
      setMarks(loadedMarks);

      if (stuData.length === 0) alert("এই ক্লাসে কোনো শিক্ষার্থী পাওয়া যায়নি।");
    }
    setFetchingStudents(false);
  };

  // সাবমিট (সেভ)
  const handleSubmit = async () => {
    const examObj = exams.find(e => e.id === selectedExam);
    const clsObj = classes.find(c => c.id === selectedClass);
    const subObj = subjects.find(s => s.id === selectedSubject);

    if (!examObj || !clsObj || !subObj) return;

    const resultsToInsert = Object.entries(marks).map(([studentId, mark]) => {
        // নম্বর ভ্যালিডেশন
        const numMark = parseInt(mark);
        if (isNaN(numMark)) return null;

        // গ্রেড ক্যালকুলেশন
        let grade = 'F';
        if (numMark >= 80) grade = 'A+';
        else if (numMark >= 70) grade = 'A';
        else if (numMark >= 60) grade = 'A-';
        else if (numMark >= 50) grade = 'B';
        else if (numMark >= 40) grade = 'C';
        else if (numMark >= 33) grade = 'D';

        return {
            student_id: studentId,
            exam_name: examObj.name,
            class_name: clsObj.name,
            subject_name: subObj.name,
            marks: numMark,
            total_marks: subObj.full_marks,
            grade: grade,
            year: parseInt(selectedYear)
        };
    }).filter(Boolean); // নাল ভ্যালু রিমুভ

    if (resultsToInsert.length === 0) {
      alert("নম্বর প্রদান করুন।");
      return;
    }

    setLoading(true);
    
    // আগের রেজাল্ট ডিলিট করে নতুন করে ইনসার্ট (Upsert এর বিকল্প হিসেবে সহজ পদ্ধতি)
    // অথবা আপনি চাইলে upsert ব্যবহার করতে পারেন যদি student_id + exam + subject ইউনিক হয়
    
    // এখানে আমরা সিম্পল ইনসার্ট ব্যবহার করছি, কিন্তু ডুপ্লিকেট এড়াতে আগে ক্লিন করছি
    await supabase.from("results").delete()
        .eq("exam_name", examObj.name)
        .eq("class_name", clsObj.name)
        .eq("subject_name", subObj.name)
        .eq("year", parseInt(selectedYear));

    const { error } = await supabase.from("results").insert(resultsToInsert);

    if (error) {
      console.error(error);
      alert("সেভ করা যায়নি! " + error.message);
    } else {
      alert("ফলাফল সফলভাবে সেভ হয়েছে! ✅");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="border-b pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-green-600" /> রেজাল্ট এন্ট্রি
            </h1>
            <p className="text-sm text-gray-500 mt-1">সঠিক তথ্য নির্বাচন করে শিক্ষার্থীদের নম্বর প্রদান করুন</p>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-sm font-bold text-gray-600">শিক্ষাবর্ষ:</span>
             <Input 
                type="number" 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)} 
                className="w-24 h-9 font-bold text-center"
             />
          </div>
        </div>

        {/* ১. সিলেকশন এরিয়া */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">শাখা</label>
            <select 
              className="w-full h-10 px-3 border rounded-md bg-white focus:ring-2 focus:ring-green-500 text-sm"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="">সিলেক্ট করুন</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">ক্লাস/জামাত</label>
            <select 
              className="w-full h-10 px-3 border rounded-md bg-white focus:ring-2 focus:ring-green-500 text-sm"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={!selectedBranch}
            >
              <option value="">আগে শাখা দিন</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">পরীক্ষা</label>
            <select 
              className="w-full h-10 px-3 border rounded-md bg-white focus:ring-2 focus:ring-green-500 text-sm"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
            >
              <option value="">সিলেক্ট করুন</option>
              {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">বিষয়</label>
            <select 
              className="w-full h-10 px-3 border rounded-md bg-white focus:ring-2 focus:ring-green-500 text-sm"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedClass}
            >
              <option value="">আগে ক্লাস দিন</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.full_marks})</option>)}
            </select>
          </div>

        </div>

        <div className="flex justify-end">
            <Button 
              onClick={handleFetchStudents} 
              disabled={fetchingStudents || !selectedSubject}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto px-8"
            >
              {fetchingStudents ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              শিক্ষার্থী খুঁজুন
            </Button>
        </div>
      </div>

      {/* ২. স্টুডেন্ট লিস্ট এবং নম্বর ইনপুট */}
      {students.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <Filter className="w-4 h-4" /> শিক্ষার্থী তালিকা ({students.length} জন)
            </h3>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              বিষয়: {subjects.find(s => s.id === selectedSubject)?.name}
            </span>
          </div>
          
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[50px]">ক্রমিক</TableHead>
                <TableHead>শিক্ষার্থীর নাম</TableHead>
                <TableHead>আইডি/রেজিঃ</TableHead>
                <TableHead className="w-[200px] text-right">প্রাপ্ত নম্বর (Marks)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student, index) => (
                <TableRow key={student.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-gray-500">{index + 1}</TableCell>
                  <TableCell>
                    <div className="font-bold text-gray-800">{student.name_bn}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-gray-500">{student.birth_reg_no || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <Input 
                      type="number" 
                      placeholder="00" 
                      className="w-24 ml-auto text-right font-bold text-lg h-10 focus:ring-green-500 focus:border-green-500"
                      value={marks[student.id] || ""}
                      onChange={(e) => {
                          const val = e.target.value;
                          if (parseInt(val) > (subjects.find(s => s.id === selectedSubject)?.full_marks || 100)) return;
                          setMarks(prev => ({ ...prev, [student.id]: val }));
                      }}
                      min={0}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="p-6 bg-gray-50 border-t flex justify-end sticky bottom-0 z-10 shadow-inner">
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-8 h-12 text-lg shadow-lg shadow-green-200 transition-all active:scale-95"
            >
              {loading ? <><Loader2 className="animate-spin mr-2" /> সেভ হচ্ছে...</> : <><Save className="mr-2" /> ফলাফল সেভ করুন</>}
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
