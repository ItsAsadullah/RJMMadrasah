"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ArrowRight, Book, ChevronLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { subjectCodes } from "@/data/bangladesh-data";

export default function SubjectPage({ params }: { params: Promise<{ branchId: string, classId: string }> }) {
  const { branchId, classId } = use(params);
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // স্মার্ট সিলেকশন স্টেট
  const [selectedSubjects, setSelectedSubjects] = useState<{ 
    [code: number]: { selected: boolean, full: number, pass: number } 
  }>({});

  // ম্যানুয়াল ইনপুট স্টেট (অন্যান্য বিষয়ের জন্য)
  const [manualSubject, setManualSubject] = useState({ name: "", code: "", full: 100, pass: 33 });

  useEffect(() => {
    fetchData();
  }, [classId]);

  const fetchData = async () => {
    setLoading(true);
    // ১. ক্লাসের তথ্য আনা
    const { data: cls } = await supabase.from("academic_classes").select("*, branches(name)").eq("id", classId).single();
    if (cls) {
        setClassInfo(cls);
        preparePresets(cls.name); // ক্লাসের নাম অনুযায়ী সাবজেক্ট লিস্ট তৈরি
    }

    // ২. ইতিমধ্যে যুক্ত থাকা বিষয়গুলো আনা
    const { data: subs } = await supabase
      .from("academic_subjects")
      .select("*")
      .eq("class_id", classId)
      .order("code", { ascending: true });
    
    if (subs) setSubjects(subs);
    setLoading(false);
  };

  // ক্লাসের নাম অনুযায়ী অটোমেটিক চেকবক্স লিস্ট তৈরি
  const preparePresets = (className: string) => {
      // নির্দিষ্ট ক্লাসের জন্য প্রস্তাবিত কোডগুলো বের করা
      const presetCodes = subjectCodes.class_wise[className as keyof typeof subjectCodes.class_wise] || [];
      const initialSelection: any = {};
      
      // সব কমন সাবজেক্ট লোড করা
      Object.keys(subjectCodes.common).forEach((codeStr: string) => {
          const code = parseInt(codeStr);
          // যদি এই ক্লাসের জন্য রিকমেন্ডেড হয় তবে সিলেক্টেড থাকবে (true), না হলে false
          const isRecommended = presetCodes.includes(code);
          initialSelection[code] = { 
              selected: isRecommended, 
              full: 100, 
              pass: 33 
          };
      });
      setSelectedSubjects(initialSelection);
  };

  // চেকবক্স হ্যান্ডলার
  const handleCheckboxChange = (code: number, checked: boolean) => {
      setSelectedSubjects(prev => ({
          ...prev,
          [code]: { ...prev[code], selected: checked }
      }));
  };

  // নম্বর পরিবর্তন হ্যান্ডলার
  const handleMarkChange = (code: number, field: 'full' | 'pass', value: string) => {
      setSelectedSubjects(prev => ({
          ...prev,
          [code]: { ...prev[code], [field]: parseInt(value) || 0 }
      }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // ১. সিলেক্ট করা বিষয়গুলো প্রসেস করা
    const subjectsToInsert = Object.entries(selectedSubjects)
        .filter(([_, val]) => val.selected) // শুধু সিলেক্ট করাগুলো নিবে
        .map(([code, val]) => ({
            class_id: classId,
            name: subjectCodes.common[parseInt(code)], // কোড থেকে নাম বের করা
            code: code,
            full_marks: val.full,
            pass_marks: val.pass,
            exam_type: "Written"
        }));

    // ২. যদি ম্যানুয়াল সাবজেক্ট বক্সে কিছু লেখা থাকে, সেটাও যুক্ত করা
    if (manualSubject.name) {
        subjectsToInsert.push({
            class_id: classId,
            name: manualSubject.name,
            code: manualSubject.code || "N/A",
            full_marks: manualSubject.full,
            pass_marks: manualSubject.pass,
            exam_type: "Written"
        });
    }

    if (subjectsToInsert.length === 0) {
        alert("অন্তত একটি বিষয় সিলেক্ট করুন অথবা ম্যানুয়ালি লিখুন।");
        setIsSubmitting(false);
        return;
    }

    const { error } = await supabase.from("academic_subjects").insert(subjectsToInsert);

    if (error) {
      alert("সেভ হয়নি! সম্ভবত কিছু বিষয় আগে থেকেই যুক্ত আছে।");
      console.error(error);
    } else {
      setIsOpen(false);
      // ম্যানুয়াল ইনপুট রিসেট
      setManualSubject({ name: "", code: "", full: 100, pass: 33 });
      fetchData();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("বিষয়টি ডিলিট করবেন?")) return;
    await supabase.from("academic_subjects").delete().eq("id", id);
    fetchData();
  };

  return (
    <div className="space-y-6">
      {/* হেডার */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/academic/branches" className="hover:text-purple-600">শাখা</Link>
          <ArrowRight className="w-3 h-3" />
          <Link href={`/dashboard/academic/branches/${branchId}`} className="hover:text-purple-600">{classInfo?.branches?.name}</Link>
          <ArrowRight className="w-3 h-3" />
          {classInfo && (
            <Link href={`/dashboard/academic/branches/${branchId}/year/${classInfo.academic_year}`} className="hover:text-purple-600">
              {classInfo.academic_year}
            </Link>
          )}
          <ArrowRight className="w-3 h-3" />
          <span className="font-semibold text-gray-800">{classInfo?.name}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/academic/branches/${branchId}/year/${classInfo?.academic_year}`}>
                <Button variant="ghost" size="icon" className="rounded-full bg-gray-50 hover:bg-gray-100">
                    <ChevronLeft className="w-5 h-5" />
                </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Book className="w-6 h-6 text-purple-600" /> বিষয় ও নম্বর সেটআপ
              </h1>
              <p className="text-sm text-gray-500">শ্রেণি: {classInfo?.name} | মোট বিষয়: {subjects.length} টি</p>
            </div>
          </div>
          <Button onClick={() => setIsOpen(true)} className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-100">
            <Plus className="w-4 h-4 mr-2" /> নতুন বিষয় যোগ
          </Button>
        </div>
      </div>

      {/* বিষয় তালিকা টেবিল */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-purple-600" /></div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-24">কোড</TableHead>
                <TableHead>বিষয়ের নাম</TableHead>
                <TableHead>ধরণ</TableHead>
                <TableHead>পূর্ণ নম্বর</TableHead>
                <TableHead>পাস নম্বর</TableHead>
                <TableHead className="text-right">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((sub) => (
                <TableRow key={sub.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-mono text-xs text-gray-400 font-bold">{sub.code || "N/A"}</TableCell>
                  <TableCell className="font-bold text-gray-700">{sub.name}</TableCell>
                  <TableCell><span className="text-[10px] font-bold uppercase bg-gray-100 px-2 py-0.5 rounded text-gray-500">{sub.exam_type}</span></TableCell>
                  <TableCell className="font-semibold">{sub.full_marks}</TableCell>
                  <TableCell className="text-red-500 font-bold">{sub.pass_marks}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(sub.id)} className="text-red-300 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {subjects.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-gray-400 italic">এখনো কোনো বিষয় যোগ করা হয়নি।</TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* স্মার্ট সাবজেক্ট সিলেকশন মডাল */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Book className="w-5 h-5 text-purple-600" /> বিষয় নির্বাচন করুন ({classInfo?.name})
            </DialogTitle>
            <DialogDescription>
                নিচের তালিকা থেকে প্রয়োজনীয় বিষয়গুলোতে টিক দিন। প্রয়োজন হলে নম্বর পরিবর্তন করুন।
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-2">
            {/* ১. প্রি-সেট লিস্ট (চেকবক্স সহ) */}
            <div className="border rounded-lg overflow-hidden shadow-sm">
                <div className="max-h-[300px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b sticky top-0 z-10">
                            <tr>
                                <th className="p-3 w-10">#</th>
                                <th className="p-3">কোড</th>
                                <th className="p-3">বিষয়ের নাম</th>
                                <th className="p-3 w-24 text-center">পূর্ণমান</th>
                                <th className="p-3 w-24 text-center">পাস</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {Object.keys(selectedSubjects).map((codeStr) => {
                                const code = parseInt(codeStr);
                                const data = selectedSubjects[code];
                                return (
                                    <tr key={code} className={data.selected ? "bg-purple-50/50" : "hover:bg-gray-50"}>
                                        <td className="p-3">
                                            <input 
                                                type="checkbox" 
                                                checked={data.selected} 
                                                onChange={(e) => handleCheckboxChange(code, e.target.checked)}
                                                className="w-4 h-4 accent-purple-600 cursor-pointer"
                                            />
                                        </td>
                                        <td className="p-3 font-mono text-xs text-gray-500">{code}</td>
                                        <td className="p-3 font-medium text-gray-800">{subjectCodes.common[code]}</td>
                                        <td className="p-3 text-center">
                                            <Input 
                                                type="number" 
                                                value={data.full} 
                                                onChange={(e) => handleMarkChange(code, 'full', e.target.value)} 
                                                disabled={!data.selected}
                                                className="h-8 w-20 text-center bg-white"
                                            />
                                        </td>
                                        <td className="p-3 text-center">
                                            <Input 
                                                type="number" 
                                                value={data.pass} 
                                                onChange={(e) => handleMarkChange(code, 'pass', e.target.value)} 
                                                disabled={!data.selected}
                                                className="h-8 w-20 text-center text-red-600 font-bold bg-white"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ২. ম্যানুয়াল সাবজেক্ট (অন্যান্য) */}
            <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">তালিকায় নেই? ম্যানুয়ালি যোগ করুন</p>
                <div className="flex flex-col md:flex-row gap-2">
                    <Input placeholder="বিষয়ের নাম (উদাঃ পদার্থবিজ্ঞান)" value={manualSubject.name} onChange={(e) => setManualSubject({...manualSubject, name: e.target.value})} className="flex-1 h-9 bg-white" />
                    <Input placeholder="কোড" value={manualSubject.code} onChange={(e) => setManualSubject({...manualSubject, code: e.target.value})} className="w-full md:w-20 h-9 bg-white" />
                    <div className="flex gap-2">
                        <Input type="number" placeholder="Total" value={manualSubject.full} onChange={(e) => setManualSubject({...manualSubject, full: parseInt(e.target.value)})} className="w-20 h-9 bg-white" />
                        <Input type="number" placeholder="Pass" value={manualSubject.pass} onChange={(e) => setManualSubject({...manualSubject, pass: parseInt(e.target.value)})} className="w-20 h-9 bg-white text-red-600 font-bold" />
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button onClick={() => setIsOpen(false)} variant="outline">বাতিল</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 font-bold shadow-md">
                    {isSubmitting ? <><Loader2 className="animate-spin mr-2" /> সেভ হচ্ছে...</> : "সংরক্ষণ করুন"}
                </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}