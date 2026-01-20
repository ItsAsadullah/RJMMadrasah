"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ArrowRight, Book, ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SubjectPage({ params }: { params: Promise<{ branchId: string, classId: string }> }) {
  const { branchId, classId } = use(params);
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: "", 
    code: "", 
    full_marks: "100", 
    pass_marks: "33", 
    exam_type: "Written" 
  });

  useEffect(() => {
    fetchData();
  }, [classId]);

  const fetchData = async () => {
    setLoading(true);
    try {
        const { data: cls } = await supabase.from("academic_classes").select("*, branches(name)").eq("id", classId).single();
        if (cls) setClassInfo(cls);

        const { data: subs } = await supabase
          .from("academic_subjects")
          .select("*")
          .eq("class_id", classId)
          .order("created_at", { ascending: true });
        
        if (subs) setSubjects(subs);
    } catch (err) {
        console.error(err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // ফিক্স: যদি কোড না থাকে তবে একটি ইউনিক নাম বা কোড সেট করা যেন কনফ্লিক্ট না হয়
    // অথবা ডাটাবেস এর ইউনিক রুল মেনে চলা
    const finalCode = formData.code.trim() || `${formData.name.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const { error } = await supabase.from("academic_subjects").insert([{
      name: formData.name,
      code: finalCode,
      class_id: classId,
      full_marks: parseInt(formData.full_marks),
      pass_marks: parseInt(formData.pass_marks),
      exam_type: formData.exam_type
    }]);

    if (error) {
      if (error.code === '23505') {
          alert("এই কোড বা বিষয়ের নাম এই ক্লাসে ইতিমধ্যে ব্যবহৃত হয়েছে। দয়া করে ভিন্ন কোড ব্যবহার করুন।");
      } else {
          alert("সেভ করা যায়নি: " + error.message);
      }
    } else {
      setIsOpen(false);
      setFormData({ name: "", code: "", full_marks: "100", pass_marks: "33", exam_type: "Written" });
      fetchData();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("বিষয়টি ডিলিট করবেন? এটি চিরতরে মুছে যাবে।")) return;
    const { error } = await supabase.from("academic_subjects").delete().eq("id", id);
    if (!error) fetchData();
    else alert("ডিলিট করা যায়নি।");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/academic/branches" className="hover:text-purple-600 transition-colors">শাখা</Link>
          <ArrowRight className="w-3 h-3" />
          <Link href={`/dashboard/academic/branches/${branchId}`} className="hover:text-purple-600 transition-colors">{classInfo?.branches?.name || "..."}</Link>
          <ArrowRight className="w-3 h-3" />
          {classInfo && (
            <Link href={`/dashboard/academic/branches/${branchId}/year/${classInfo.academic_year}`} className="hover:text-purple-600 transition-colors">
              {classInfo.academic_year}
            </Link>
          )}
          <ArrowRight className="w-3 h-3" />
          <span className="font-semibold text-gray-800">{classInfo?.name}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/academic/branches/${branchId}/year/${classInfo?.academic_year}`}>
                <Button variant="ghost" size="icon" className="rounded-full bg-gray-50 hover:bg-gray-100 h-10 w-10">
                    <ChevronLeft className="w-5 h-5" />
                </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Book className="w-6 h-6 text-purple-600" /> বিষয় ও নম্বর সেটআপ
              </h1>
              <p className="text-sm text-gray-500">শ্রেণি: {classInfo?.name} | শিক্ষাবর্ষ: {classInfo?.academic_year}</p>
            </div>
          </div>
          <Button onClick={() => setIsOpen(true)} className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-100">
            <Plus className="w-4 h-4 mr-2" /> নতুন বিষয় যোগ
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-purple-600 w-8 h-8" />
                <p className="text-sm text-gray-500">লোড হচ্ছে...</p>
            </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-32">বিষয় কোড</TableHead>
                  <TableHead>বিষয়ের নাম</TableHead>
                  <TableHead>ধরন</TableHead>
                  <TableHead>পূর্ণ নম্বর</TableHead>
                  <TableHead>পাস নম্বর</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.length > 0 ? (
                  subjects.map((sub) => (
                    <TableRow key={sub.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-mono text-xs font-bold text-gray-500">{sub.code}</TableCell>
                      <TableCell className="font-bold text-gray-700 text-base">{sub.name}</TableCell>
                      <TableCell>
                        <span className="text-[10px] font-bold uppercase bg-purple-50 px-2 py-0.5 rounded text-purple-600 border border-purple-100">
                            {sub.exam_type}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-600">{sub.full_marks}</TableCell>
                      <TableCell className="text-red-500 font-bold">{sub.pass_marks}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(sub.id)} 
                            className="text-red-300 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                      <TableCell colSpan={6} className="text-center py-20">
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                             <Book className="w-12 h-12 opacity-20" />
                             <p className="italic">এখনো কোনো বিষয় যোগ করা হয়নি।</p>
                          </div>
                      </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">নতুন বিষয় যুক্ত করুন</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
                এই শ্রেণির জন্য বিষয়ের নাম এবং মানবণ্টন প্রদান করুন।
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">বিষয়ের নাম *</label>
                    <Input 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        placeholder="উদাঃ কুরআন মাজীদ" 
                        className="h-11" 
                        required 
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">কোড (ঐচ্ছিক)</label>
                    <Input 
                        value={formData.code} 
                        onChange={(e) => setFormData({...formData, code: e.target.value})} 
                        placeholder="উদাঃ 101" 
                        className="h-11" 
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">পূর্ণ নম্বর</label>
                    <Input 
                        type="number" 
                        value={formData.full_marks} 
                        onChange={(e) => setFormData({...formData, full_marks: e.target.value})} 
                        className="h-11 font-bold" 
                        required
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">পাস নম্বর</label>
                    <Input 
                        type="number" 
                        value={formData.pass_marks} 
                        onChange={(e) => setFormData({...formData, pass_marks: e.target.value})} 
                        className="h-11 font-bold text-red-500" 
                        required
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">পরীক্ষার ধরণ</label>
                <select 
                    className="w-full h-11 px-3 border rounded-md bg-white font-medium text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    value={formData.exam_type}
                    onChange={(e) => setFormData({...formData, exam_type: e.target.value})}
                >
                    <option value="Written">Written (লিখিত)</option>
                    <option value="Oral">Oral (মৌখিক)</option>
                    <option value="Practical">Practical (ব্যবহারিক)</option>
                </select>
            </div>

            <div className="pt-2">
                <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 font-bold text-lg shadow-lg shadow-purple-100 transition-all active:scale-95"
                >
                    {isSubmitting ? (
                        <><Loader2 className="animate-spin mr-2 h-5 w-5" /> সেভ হচ্ছে...</>
                    ) : (
                        "বিষয়টি যুক্ত করুন"
                    )}
                </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}