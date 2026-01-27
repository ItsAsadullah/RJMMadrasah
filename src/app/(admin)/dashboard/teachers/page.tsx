"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Loader2, User, Phone, BookOpen } from "lucide-react";

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ id: "", name: "", phone: "", designation: "", subject_specialty: "" });
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("teachers").select("*").order("created_at", { ascending: false });
    if (data) setTeachers(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
        name: formData.name,
        phone: formData.phone,
        designation: formData.designation,
        subject_specialty: formData.subject_specialty
    };

    let error;
    if (isEdit && formData.id) {
        const { error: err } = await supabase.from("teachers").update(payload).eq("id", formData.id);
        error = err;
    } else {
        const { error: err } = await supabase.from("teachers").insert([payload]);
        error = err;
    }

    if (error) {
        alert("সমস্যা হয়েছে: " + error.message);
    } else {
        setIsOpen(false);
        setFormData({ id: "", name: "", phone: "", designation: "", subject_specialty: "" });
        fetchTeachers();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত এই শিক্ষককে ডিলিট করতে চান?")) return;
    await supabase.from("teachers").delete().eq("id", id);
    fetchTeachers();
  };

  const openEdit = (teacher: any) => {
      setFormData(teacher);
      setIsEdit(true);
      setIsOpen(true);
  };

  const openAdd = () => {
      setFormData({ id: "", name: "", phone: "", designation: "", subject_specialty: "" });
      setIsEdit(false);
      setIsOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <User className="w-6 h-6 text-blue-600"/> শিক্ষক তালিকা
            </h1>
            <p className="text-sm text-gray-500">মাদ্রাসার সকল শিক্ষকদের তালিকা ও তথ্য</p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2"/> নতুন শিক্ষক
        </Button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
            <TableHeader className="bg-gray-50">
                <TableRow>
                    <TableHead>নাম</TableHead>
                    <TableHead>পদবী</TableHead>
                    <TableHead>মোবাইল</TableHead>
                    <TableHead>বিষয় দক্ষতা</TableHead>
                    <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600"/></TableCell></TableRow>
                ) : teachers.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-400">কোনো তথ্য নেই</TableCell></TableRow>
                ) : (
                    teachers.map((t) => (
                        <TableRow key={t.id}>
                            <TableCell className="font-bold text-gray-700">{t.name}</TableCell>
                            <TableCell>{t.designation}</TableCell>
                            <TableCell className="font-mono">{t.phone}</TableCell>
                            <TableCell><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs">{t.subject_specialty}</span></TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Edit className="w-4 h-4 text-gray-500"/></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="w-4 h-4 text-red-400"/></Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
              <DialogHeader><DialogTitle>{isEdit ? "শিক্ষক তথ্য সংশোধন" : "নতুন শিক্ষক যোগ করুন"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="space-y-1"><label className="text-sm font-bold text-gray-600">নাম</label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="শিক্ষকের নাম" /></div>
                  <div className="space-y-1"><label className="text-sm font-bold text-gray-600">পদবী</label><Input value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} placeholder="উদাঃ সহকারী শিক্ষক" /></div>
                  <div className="space-y-1"><label className="text-sm font-bold text-gray-600">মোবাইল</label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="01XXXXXXXXX" /></div>
                  <div className="space-y-1"><label className="text-sm font-bold text-gray-600">বিষয় দক্ষতা</label><Input value={formData.subject_specialty} onChange={e => setFormData({...formData, subject_specialty: e.target.value})} placeholder="উদাঃ আরবি, বাংলা" /></div>
                  
                  <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>বাতিল</Button>
                      <Button type="submit" disabled={isSubmitting} className="bg-blue-600">{isSubmitting ? <Loader2 className="animate-spin"/> : "সংরক্ষণ করুন"}</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    </div>
  );
}