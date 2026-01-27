"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Calendar, FileText, Loader2, Edit, Trash2, AlertTriangle, Save, X } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function ExamListPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  
  // Modals
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    academic_year: new Date().getFullYear(),
    branch_id: "",
    start_date: "",
    end_date: "",
    status: "upcoming"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: bData } = await supabase.from("branches").select("id, name");
    if (bData) setBranches(bData);

    const { data: eData } = await supabase.from("exams").select("*, branches(name)").order("created_at", { ascending: false });
    if (eData) setExams(eData);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.branch_id) return alert("শাখা নির্বাচন করুন");
    setIsSubmitting(true);

    const payload = {
        title: formData.title,
        academic_year: formData.academic_year,
        branch_id: formData.branch_id,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        status: formData.status
    };

    let error;
    if (formData.id) {
        const { error: err } = await supabase.from("exams").update(payload).eq("id", formData.id);
        error = err;
    } else {
        const { error: err } = await supabase.from("exams").insert([payload]);
        error = err;
    }

    if (error) alert(error.message);
    else {
      setIsOpen(false);
      resetForm();
      fetchData();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
      if(!deleteId) return;
      setIsSubmitting(true);
      const { error } = await supabase.from("exams").delete().eq("id", deleteId);
      if(error) alert("ডিলিট করা যায়নি!");
      else {
          setIsDeleteOpen(false);
          fetchData();
      }
      setIsSubmitting(false);
  };

  const openEdit = (exam: any) => {
      setFormData({
          id: exam.id,
          title: exam.title,
          academic_year: exam.academic_year,
          branch_id: exam.branch_id,
          start_date: exam.start_date || "",
          end_date: exam.end_date || "",
          status: exam.status
      });
      setIsOpen(true);
  };

  const resetForm = () => {
      setFormData({ id: "", title: "", academic_year: new Date().getFullYear(), branch_id: "", start_date: "", end_date: "", status: "upcoming" });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileText className="w-6 h-6 text-purple-600"/> পরীক্ষা ব্যবস্থাপনা</h1>
           <p className="text-gray-500">নতুন পরীক্ষা তৈরি, রুটিন এবং ফলাফল প্রকাশ করুন</p>
        </div>
        <Button onClick={() => { resetForm(); setIsOpen(true); }} className="bg-purple-600 hover:bg-purple-700 font-bold shadow-md">
            <Plus className="w-4 h-4 mr-2"/> নতুন পরীক্ষা
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <div className="col-span-3 text-center py-10"><Loader2 className="animate-spin w-8 h-8 text-purple-600 mx-auto"/></div> : 
         exams.map((exam) => (
          <div key={exam.id} className="bg-white p-6 rounded-xl border hover:shadow-lg transition-all group relative">
               
               {/* Actions */}
               <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => openEdit(exam)} className="p-2 bg-gray-100 rounded hover:bg-blue-100 text-blue-600"><Edit className="w-4 h-4"/></button>
                   <button onClick={() => { setDeleteId(exam.id); setIsDeleteOpen(true); }} className="p-2 bg-gray-100 rounded hover:bg-red-100 text-red-600"><Trash2 className="w-4 h-4"/></button>
               </div>

               <Link href={`/dashboard/academic/exams/${exam.id}`}>
               <div className="cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-purple-50 p-3 rounded-lg text-purple-600">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${exam.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {exam.status === 'upcoming' ? 'আসন্ন' : exam.status === 'published' ? 'প্রকাশিত' : 'চলমান'}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{exam.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{exam.branches?.name} | {exam.academic_year}</p>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-400 border-t pt-4">
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                            <span>শুরু:</span> 
                            <span className="font-bold text-gray-600">{exam.start_date ? format(new Date(exam.start_date), 'dd MMM yy') : 'N/A'}</span>
                        </div>
                        <span>-</span>
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                            <span>শেষ:</span> 
                            <span className="font-bold text-gray-600">{exam.end_date ? format(new Date(exam.end_date), 'dd MMM yy') : 'N/A'}</span>
                        </div>
                    </div>
               </div>
               </Link>
            </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>{formData.id ? "পরীক্ষা এডিট করুন" : "নতুন পরীক্ষা তৈরি করুন"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 py-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">পরীক্ষার নাম</label>
                    <Input placeholder="উদাঃ বার্ষিক পরীক্ষা ২০২৬" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">শাখা</label>
                        <select className="w-full border rounded h-10 px-3 text-sm bg-white" value={formData.branch_id} onChange={e => setFormData({...formData, branch_id: e.target.value})} required>
                            <option value="">নির্বাচন করুন</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">শিক্ষাবর্ষ</label>
                        <Input type="number" value={formData.academic_year} onChange={e => setFormData({...formData, academic_year: parseInt(e.target.value)})} required />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-xs font-bold text-gray-500">শুরু</label><Input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} /></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-gray-500">শেষ</label><Input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} /></div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">স্ট্যাটাস</label>
                    <select className="w-full border rounded h-10 px-3 text-sm bg-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="upcoming">আসন্ন (Upcoming)</option>
                        <option value="ongoing">চলমান (Ongoing)</option>
                        <option value="completed">সম্পন্ন (Completed)</option>
                        <option value="published">প্রকাশিত (Published)</option>
                    </select>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>বাতিল</Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-purple-600">{isSubmitting ? <Loader2 className="animate-spin"/> : <><Save className="w-4 h-4 mr-2"/> সংরক্ষণ করুন</>}</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-sm">
             <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="w-5 h-5"/> ডিলিট নিশ্চিতকরণ</DialogTitle>
                <DialogDescription>আপনি কি নিশ্চিত? এটি করলে পরীক্ষার সকল রুটিন এবং রেজাল্ট মুছে যাবে।</DialogDescription>
             </DialogHeader>
             <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>না</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin"/> : "হ্যাঁ, ডিলিট"}</Button>
             </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}