"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { departments, classesByDept } from "@/data/bangladesh-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Save, Loader2, BookOpen, Calendar } from "lucide-react";

export default function AcademicSettings() {
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // ফর্ম স্টেট
  const [newExam, setNewExam] = useState({ name: "", year: new Date().getFullYear().toString() });
  const [newSubject, setNewSubject] = useState({ 
    department: "", 
    class_name: "", 
    subject_name: "", 
    full_marks: "100", 
    pass_marks: "33" 
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: examData } = await supabase.from("exams").select("*").order("created_at", { ascending: false });
    const { data: subjectData } = await supabase.from("subjects").select("*").order("class_name", { ascending: true });
    
    if (examData) setExams(examData);
    if (subjectData) setSubjects(subjectData);
  };

  // --- Exam Functions ---
  const handleAddExam = async () => {
    if (!newExam.name) return alert("পরীক্ষার নাম দিন");
    setLoading(true);
    const { error } = await supabase.from("exams").insert([newExam]);
    if (!error) {
      setNewExam({ ...newExam, name: "" });
      fetchData();
    }
    setLoading(false);
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm("নিশ্চিত ডিলিট করবেন?")) return;
    await supabase.from("exams").delete().eq("id", id);
    fetchData();
  };

  // --- Subject Functions ---
  const handleAddSubject = async () => {
    if (!newSubject.class_name || !newSubject.subject_name) return alert("ক্লাস ও বিষয় নির্বাচন করুন");
    setLoading(true);
    const { error } = await supabase.from("subjects").insert([{
      ...newSubject,
      full_marks: parseInt(newSubject.full_marks),
      pass_marks: parseInt(newSubject.pass_marks)
    }]);
    if (!error) {
      setNewSubject({ ...newSubject, subject_name: "" }); // শুধু নাম রিসেট, ক্লাস ঠিক থাকবে
      fetchData();
    }
    setLoading(false);
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("বিষয়টি ডিলিট করবেন?")) return;
    await supabase.from("subjects").delete().eq("id", id);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">একাডেমিক সেটিংস</h1>

      <Tabs defaultValue="subjects" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="subjects">বিষয় ও নম্বর</TabsTrigger>
          <TabsTrigger value="exams">পরীক্ষা তালিকা</TabsTrigger>
        </TabsList>

        {/* --- Subject Management Tab --- */}
        <TabsContent value="subjects" className="space-y-6 mt-6">
          
          {/* Add Subject Form */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600" /> নতুন বিষয় যুক্ত করুন
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-sm font-medium">বিভাগ</label>
                <select 
                  className="w-full h-10 px-3 border rounded-md"
                  value={newSubject.department}
                  onChange={(e) => setNewSubject({ ...newSubject, department: e.target.value, class_name: "" })}
                >
                  <option value="">সিলেক্ট</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">ক্লাস</label>
                <select 
                  className="w-full h-10 px-3 border rounded-md"
                  value={newSubject.class_name}
                  onChange={(e) => setNewSubject({ ...newSubject, class_name: e.target.value })}
                >
                  <option value="">সিলেক্ট</option>
                  {newSubject.department && classesByDept[newSubject.department]?.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1 md:col-span-1">
                <label className="text-sm font-medium">বিষয়ের নাম</label>
                <Input placeholder="উদাঃ বাংলা" value={newSubject.subject_name} onChange={(e) => setNewSubject({ ...newSubject, subject_name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">মোট নম্বর</label>
                <Input type="number" value={newSubject.full_marks} onChange={(e) => setNewSubject({ ...newSubject, full_marks: e.target.value })} />
              </div>
              <Button onClick={handleAddSubject} disabled={loading} className="bg-green-600 hover:bg-green-700 w-full">
                {loading ? <Loader2 className="animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} যুক্ত করুন
              </Button>
            </div>
          </div>

          {/* Subject List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b font-medium text-gray-700">সকল বিষয়ের তালিকা</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <th className="p-4">ক্লাস</th>
                    <th className="p-4">বিষয়</th>
                    <th className="p-4">মোট নম্বর</th>
                    <th className="p-4">পাশ নম্বর</th>
                    <th className="p-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {subjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="p-4 font-medium">{sub.class_name}</td>
                      <td className="p-4">{sub.subject_name}</td>
                      <td className="p-4">{sub.full_marks}</td>
                      <td className="p-4 text-red-600">{sub.pass_marks}</td>
                      <td className="p-4 text-right">
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteSubject(sub.id)} className="text-red-500 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* --- Exam Management Tab --- */}
        <TabsContent value="exams" className="space-y-6 mt-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> নতুন পরীক্ষা তৈরি
            </h3>
            <div className="flex gap-4 items-end">
              <div className="space-y-1 flex-1">
                <label className="text-sm font-medium">পরীক্ষার নাম</label>
                <Input placeholder="উদাঃ বার্ষিক পরীক্ষা" value={newExam.name} onChange={(e) => setNewExam({ ...newExam, name: e.target.value })} />
              </div>
              <div className="space-y-1 w-32">
                <label className="text-sm font-medium">সাল</label>
                <Input type="number" value={newExam.year} onChange={(e) => setNewExam({ ...newExam, year: e.target.value })} />
              </div>
              <Button onClick={handleAddExam} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" /> সেভ করুন
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h4 className="font-bold mb-4">পরীক্ষার তালিকা</h4>
            <div className="space-y-2">
              {exams.map((exam) => (
                <div key={exam.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-bold text-gray-800">{exam.name}</p>
                    <p className="text-xs text-gray-500">{exam.year} সাল</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => handleDeleteExam(exam.id)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}