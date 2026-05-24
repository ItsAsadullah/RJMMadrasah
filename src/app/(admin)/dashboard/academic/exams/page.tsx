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

    async function fetchData() {
      setLoading(true);
      const { data: bData } = await supabase.from("branches").select("id, name");
      if (bData) setBranches(bData);

      const { data: eData } = await supabase.from("exams").select("*, branches(name)").order("created_at", { ascending: false });
      if (eData) setExams(eData);
      setLoading(false);
    }

    useEffect(() => {
      fetchData();
    }, []);

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
      <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-white p-4 md:p-6 rounded-xl border shadow-sm">
          <div>
             <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2"><FileText className="w-5 h-5 md:w-6 md:h-6 text-purple-600"/> পরীক্ষা ব্যবস্থাপনা</h1>
             <p className="text-sm text-gray-500">নতুন পরীক্ষা তৈরি, রুটিন এবং ফলাফল প্রকাশ করুন</p>
          </div>
          <Button onClick={() => { resetForm(); setIsOpen(true); }} className="bg-purple-600 hover:bg-purple-700 font-bold shadow-md w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2"/> নতুন পরীক্ষা
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {loading ? <div className="col-span-3 text-center py-10"><Loader2 className="animate-spin w-8 h-8 text-purple-600 mx-auto"/></div> : 
           exams.map((exam) => (
            <div key={exam.id} className="bg-white p-4 md:p-6 rounded-xl border hover:shadow-lg transition-all group relative">
                 
                 {/* Actions - always visible on mobile, hover on desktop */}
                 <div className="absolute top-3 right-3 flex gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                     <button onClick={() => openEdit(exam)} className="p-1.5 bg-gray-100 rounded hover:bg-blue-100 text-blue-600"><Edit className="w-3.5 h-3.5"/></button>
                     <button onClick={() => { setDeleteId(exam.id); setIsDeleteOpen(true); }} className="p-1.5 bg-gray-100 rounded hover:bg-red-100 text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
                 </div>

                 <Link href={`/dashboard/academic/exams/${exam.id}`}>
                 <div className="cursor-pointer pr-14 sm:pr-0">
                      <div className="flex justify-between items-start mb-3">
                          <div className="bg-purple-50 p-2.5 rounded-lg text-purple-600">
                              <Calendar className="w-5 h-5" />
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${exam.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {exam.status === 'upcoming' ? 'আসন্ন' : exam.status === 'published' ? 'প্রকাশিত' : 'চলমান'}
                          </span>
                      </div>
                      <h3 className="text-base md:text-xl font-bold text-gray-800 mb-1">{exam.title}</h3>
                      <p className="text-xs md:text-sm text-gray-500 mb-3">{exam.branches?.name} | {exam.academic_year}</p>
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 border-t pt-3">
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
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{formData.id ? "পরীক্ষা এডিট করুন" : "নতুন পরীক্ষা তৈরি করুন"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 py-2">
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500">পরীক্ষার নাম</label>
                      <Input placeholder="উদাঃ বার্ষিক পরীক্ষা ২০২৬" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div className="grid grid-cols-2 gap-3">
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
                  <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto">বাতিল</Button>
                      <Button type="submit" disabled={isSubmitting} className="bg-purple-600 w-full sm:w-auto">{isSubmitting ? <Loader2 className="animate-spin"/> : <><Save className="w-4 h-4 mr-2"/> সংরক্ষণ করুন</>}</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogContent className="w-[95vw] max-w-sm">
               <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="w-5 h-5"/> ডিলিট নিশ্চিতকরণ</DialogTitle>
                  <DialogDescription>আপনি কি নিশ্চিত? এটি করলে পরীক্ষার সকল রুটিন এবং রেজাল্ট মুছে যাবে।</DialogDescription>
               </DialogHeader>
               <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="w-full sm:w-auto">না</Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting} className="w-full sm:w-auto">{isSubmitting ? <Loader2 className="animate-spin"/> : "হ্যাঁ, ডিলিট"}</Button>
               </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    );
}