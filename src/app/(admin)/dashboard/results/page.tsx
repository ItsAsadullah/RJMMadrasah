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
import { Loader2, Save, Search, BookOpen } from "lucide-react";
import { departments, classesByDept } from "@/data/bangladesh-data"; // আগের ডাটা ফাইল থেকে

// টাইপ
type Student = {
  id: string;
  name_bn: string;
  birth_reg_no: string; // রোলের বদলে আমরা জন্ম নিবন্ধন বা আইডি ব্যবহার করতে পারি ইউনিক হিসেবে
};

export default function ResultManagement() {
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  
  // সিলেকশন স্টেট
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [examName, setExamName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [examYear, setExamYear] = useState(new Date().getFullYear().toString());

  // ডাটা স্টেট
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<{ [key: string]: string }>({}); // student_id -> marks

  // স্টুডেন্ট ফেচ করা
  const handleFetchStudents = async () => {
    if (!selectedClass || !selectedDept) {
      alert("দয়া করে বিভাগ এবং শ্রেণি সিলেক্ট করুন");
      return;
    }

    setFetchingStudents(true);
    // ওই ক্লাসের সব 'active' স্টুডেন্টদের আনা হবে
    const { data, error } = await supabase
      .from("students")
      .select("id, name_bn, birth_reg_no")
      .eq("class_name", selectedClass)
      .eq("department", selectedDept)
      .eq("status", "active") // শুধুমাত্র ভর্তি কনফার্ম হওয়া ছাত্রীরা
      .order("name_bn", { ascending: true });

    if (error) {
      console.error(error);
      alert("শিক্ষার্থী লোড করতে সমস্যা হয়েছে");
    } else {
      setStudents(data || []);
      if (data?.length === 0) alert("এই ক্লাসে কোনো শিক্ষার্থী পাওয়া যায়নি।");
    }
    setFetchingStudents(false);
  };

  // নম্বর ইনপুট হ্যান্ডেলার
  const handleMarkChange = (studentId: string, value: string) => {
    setMarks(prev => ({ ...prev, [studentId]: value }));
  };

  // সাবমিট (সেভ)
  const handleSubmit = async () => {
    if (!examName || !subjectName) {
      alert("পরীক্ষার নাম এবং বিষয় অবশ্যই দিতে হবে।");
      return;
    }

    // যেসব ছাত্রীর নম্বর দেওয়া হয়েছে শুধু তাদের ডাটা তৈরি করা
    const resultsToInsert = Object.entries(marks).map(([studentId, mark]) => ({
      student_id: studentId,
      exam_name: examName,
      class_name: selectedClass,
      subject_name: subjectName,
      marks: parseInt(mark),
      year: parseInt(examYear),
      // গ্রেড ক্যালকুলেশন (সিম্পল লজিক)
      grade: parseInt(mark) >= 80 ? 'A+' : parseInt(mark) >= 70 ? 'A' : parseInt(mark) >= 60 ? 'A-' : parseInt(mark) >= 50 ? 'B' : parseInt(mark) >= 40 ? 'C' : parseInt(mark) >= 33 ? 'D' : 'F'
    }));

    if (resultsToInsert.length === 0) {
      alert("অন্তত একজন শিক্ষার্থীর নম্বর দিন।");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("results").insert(resultsToInsert);

    if (error) {
      console.error(error);
      alert("রেজাল্ট সেভ করা যায়নি!");
    } else {
      alert("রেজাল্ট সফলভাবে সেভ হয়েছে! ✅");
      // রিসেট বা ক্লিনআপ করতে পারেন চাইলে
      setMarks({});
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-green-600" /> রেজাল্ট এন্ট্রি
          </h1>
          <p className="text-sm text-gray-500 mt-1">ক্লাস এবং বিষয় নির্বাচন করে নম্বর প্রদান করুন</p>
        </div>

        {/* ১. সিলেকশন এরিয়া */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">বিভাগ</label>
            <select 
              className="w-full h-10 px-3 border rounded-md bg-white focus:ring-2 focus:ring-green-500"
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSelectedClass(""); // বিভাগ পাল্টালে ক্লাস রিসেট
              }}
            >
              <option value="">সিলেক্ট করুন</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">ক্লাস/জামাত</label>
            <select 
              className="w-full h-10 px-3 border rounded-md bg-white focus:ring-2 focus:ring-green-500"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={!selectedDept}
            >
              <option value="">আগে বিভাগ দিন</option>
              {selectedDept && classesByDept[selectedDept]?.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">পরীক্ষার নাম</label>
            <Input 
              placeholder="উদাঃ বার্ষিক পরীক্ষা ২০২৫" 
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">বিষয় (Subject)</label>
            <Input 
              placeholder="উদাঃ বাংলা" 
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <Button 
              onClick={handleFetchStudents} 
              disabled={fetchingStudents || !selectedClass}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {fetchingStudents ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
              শিক্ষার্থী খুঁজুন
            </Button>
          </div>
        </div>
      </div>

      {/* ২. স্টুডেন্ট লিস্ট এবং নম্বর ইনপুট */}
      {students.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-700">শিক্ষার্থী তালিকা ({students.length} জন)</h3>
            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
              বিষয়: {subjectName || "নির্ধারিত হয়নি"}
            </span>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">ক্রমিক</TableHead>
                <TableHead>শিক্ষার্থীর নাম</TableHead>
                <TableHead>আইডি/রেজিঃ</TableHead>
                <TableHead className="w-[200px]">প্রাপ্ত নম্বর (১০০ এর মধ্যে)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student, index) => (
                <TableRow key={student.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium text-gray-800">{student.name_bn}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-500">{student.birth_reg_no || "N/A"}</TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      className="w-24 focus:ring-green-500"
                      value={marks[student.id] || ""}
                      onChange={(e) => handleMarkChange(student.id, e.target.value)}
                      max={100}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="p-6 bg-gray-50 border-t flex justify-end">
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-8 h-12 text-lg shadow-md"
            >
              {loading ? <><Loader2 className="animate-spin mr-2" /> সেভ হচ্ছে...</> : <><Save className="mr-2" /> রেজাল্ট সেভ করুন</>}
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}