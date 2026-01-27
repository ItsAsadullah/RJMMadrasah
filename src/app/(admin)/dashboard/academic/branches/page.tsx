"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, GitBranch, ArrowRight, CheckCircle, XCircle, Loader2, Users, CalendarClock, BookOpen, MapPin } from "lucide-react";
import Link from "next/link";

type BranchStat = {
  id: number;
  name: string;
  address: string;
  is_active: boolean;
  totalSessions: number;
  totalStudents: number;
  currentSessionStudents: number;
};

export default function BranchManagement() {
  const [branches, setBranches] = useState<BranchStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentYear = new Date().getFullYear();
  const [userEmail, setUserEmail] = useState("");
  
  const [formData, setFormData] = useState({ name: "", address: "", is_active: true });
  const [editingId, setEditingId] = useState<number | null>(null);

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [password, setPassword] = useState("");

  useEffect(() => { 
    fetchBranches(); 
    getUserEmail();
  }, []);

  const getUserEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) setUserEmail(user.email);
  };

  const fetchBranches = async () => {
    setLoading(true);
    const { data: branchData, error } = await supabase.from("branches").select("*").order("id", { ascending: true });
    
    if (error) {
      console.error("Error fetching branches:", error);
    } else if (branchData) {
      const statsPromises = branchData.map(async (branch) => {
        const { data: classes } = await supabase.from("academic_classes").select("academic_year").eq("branch_id", branch.id);
        const uniqueYears = new Set(classes?.map(c => c.academic_year));
        
        const { data: students } = await supabase.from("students").select("academic_year").eq("branch_id", branch.id).eq("status", "active");
        const totalStudents = students?.length || 0;
        const currentSessionStudents = students?.filter(s => s.academic_year === currentYear).length || 0;

        return {
          ...branch,
          totalSessions: uniqueYears.size,
          totalStudents: totalStudents,
          currentSessionStudents: currentSessionStudents
        };
      });
      setBranches(await Promise.all(statsPromises));
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("শাখার নাম দিন");
    setIsSubmitting(true);

    const payload = { name: formData.name, address: formData.address, is_active: formData.is_active };

    if (editingId) {
      await supabase.from("branches").update(payload).eq("id", editingId);
    } else {
      await supabase.from("branches").insert([payload]);
    }
    
    setIsOpen(false);
    setFormData({ name: "", address: "", is_active: true });
    setEditingId(null);
    await fetchBranches();
    setIsSubmitting(false);
  };

  const handleEdit = (branch: any) => {
    setFormData({ name: branch.name, address: branch.address, is_active: branch.is_active });
    setEditingId(branch.id);
    setIsOpen(true);
  };

  // --- Password Protected Delete ---
  const openDeleteModal = (id: number) => {
    setDeleteId(id);
    setPassword("");
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteId || !password) return;
    setIsSubmitting(true);

    // Verify Password
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: password,
    });

    if (authError) {
      alert("পাসওয়ার্ড ভুল হয়েছে!");
      setIsSubmitting(false);
      return;
    }

    // Delete Branch
    const { error } = await supabase.from("branches").delete().eq("id", deleteId);
    
    if (error) {
        alert("ডিলিট করা যায়নি! এই শাখার অধীনে ক্লাস বা শিক্ষার্থী থাকলে আগে সেগুলো মুছতে হবে।");
    } else {
        await fetchBranches();
        setIsDeleteOpen(false);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-green-600" /> শাখা ব্যবস্থাপনা
          </h1>
          <p className="text-sm text-gray-500">বর্তমান শিক্ষাবর্ষ: <span className="font-bold text-green-600">{currentYear}</span></p>
        </div>
        <Button onClick={() => { setIsOpen(true); setEditingId(null); setFormData({name:"", address:"", is_active: true}); }} className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100">
          <Plus className="w-4 h-4 mr-2" /> নতুন শাখা খুলুন
        </Button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {branches.map((branch) => (
            <div key={branch.id} className={`bg-white rounded-2xl border transition-all hover:shadow-lg group relative overflow-hidden ${branch.is_active ? 'border-gray-200' : 'border-red-200 bg-red-50/10'}`}>
                
                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(branch)} className="h-8 w-8 text-gray-500 bg-white border hover:text-green-600 shadow-sm"><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteModal(branch.id)} className="h-8 w-8 text-red-400 bg-white border hover:text-red-600 shadow-sm"><Trash2 className="w-4 h-4" /></Button>
                </div>

                <div className="p-6 pb-0">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-green-50 h-14 w-14 rounded-xl flex items-center justify-center text-green-600 font-bold text-xl border border-green-100">
                            {branch.name[0]}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">{branch.name}</h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" /> {branch.address || "ঠিকানা নেই"}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-4 border-t border-dashed border-gray-200">
                        <div className="text-center p-2 rounded-lg bg-blue-50/50">
                            <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">মোট সেশন</p>
                            <div className="flex items-center justify-center gap-1 text-blue-700 font-bold text-lg"><CalendarClock className="w-4 h-4" /> {branch.totalSessions}</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-green-50/50">
                            <p className="text-[10px] text-green-600 font-bold uppercase mb-1">বর্তমান ছাত্রী</p>
                            <div className="flex items-center justify-center gap-1 text-green-700 font-bold text-lg"><Users className="w-4 h-4" /> {branch.currentSessionStudents}</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-purple-50/50">
                            <p className="text-[10px] text-purple-600 font-bold uppercase mb-1">সর্বমোট</p>
                            <div className="flex items-center justify-center gap-1 text-purple-700 font-bold text-lg"><BookOpen className="w-4 h-4" /> {branch.totalStudents}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-3 mt-4 flex justify-between items-center border-t border-gray-100">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${branch.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {branch.is_active ? <CheckCircle className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>}
                        {branch.is_active ? "সচল" : "বন্ধ"}
                    </span>
                    <Link href={`/dashboard/academic/branches/${branch.id}`}>
                        <Button size="sm" className="bg-gray-900 text-white hover:bg-gray-800 text-xs h-8 px-4">
                            প্রবেশ করুন <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                    </Link>
                </div>
            </div>
            ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle className="text-xl font-bold">{editingId ? "শাখা আপডেট করুন" : "নতুন শাখা যোগ করুন"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2"><label className="text-sm font-medium text-gray-700">শাখার নাম *</label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="উদাঃ হলিধানী বাজার শাখা" required className="h-11" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-gray-700">ঠিকানা</label><Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="শাখার অবস্থান" className="h-11" /></div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <input type="checkbox" id="status" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="accent-green-600 w-5 h-5 cursor-pointer" />
              <label htmlFor="status" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">এই শাখাটি বর্তমানে সচল আছে</label>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg font-bold">{isSubmitting ? <Loader2 className="animate-spin" /> : (editingId ? "আপডেট করুন" : "শাখা তৈরি করুন")}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 font-bold flex items-center gap-2"><Trash2 className="w-5 h-5" /> শাখা ডিলিট নিশ্চিতকরণ</DialogTitle>
            <DialogDescription className="text-gray-600 pt-2">
              সতর্কতা: শাখাটি ডিলিট করলে এর সাথে সম্পর্কিত <strong>সকল ক্লাস এবং শিক্ষার্থী</strong> মুছে যেতে পারে।<br /><br />নিশ্চিত করতে আপনার <strong>লগইন পাসওয়ার্ড</strong> দিন:
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDeleteConfirm} className="space-y-4 mt-2">
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">পাসওয়ার্ড</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="আপনার পাসওয়ার্ড দিন" className="h-11 focus:ring-red-500" required />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>বাতিল</Button>
                <Button type="submit" disabled={isSubmitting} variant="destructive" className="font-bold">{isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : "নিশ্চিত ডিলিট করুন"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


