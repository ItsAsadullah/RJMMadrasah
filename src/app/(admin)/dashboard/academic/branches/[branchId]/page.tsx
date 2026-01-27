"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { 
  Plus, Calendar, ArrowRight, Loader2, Star, Clock, History, 
  Users, Layers, GraduationCap, Trash2, Edit, Save, Shield
} from "lucide-react";
import Link from "next/link";
import { departments, classesByDept } from "@/data/bangladesh-data";

type YearStat = {
  year: number;
  classCount: number;
  studentCount: number;
};

export default function AcademicYearPage({ params }: { params: Promise<{ branchId: string }> }) {
  const { branchId } = use(params);
  const currentYear = new Date().getFullYear();
  
  const [yearsData, setYearsData] = useState<YearStat[]>([]);
  const [branchInfo, setBranchInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  // Create Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    department: "", 
    name: "", 
    academic_year: currentYear + 1 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<{ old: number, new: number } | null>(null);

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteYear, setDeleteYear] = useState<number | null>(null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);
    };
    getUser();
    fetchData();
  }, [branchId]);

  const fetchData = async () => {
    setLoading(true);
    // ১. ব্রাঞ্চ তথ্য
    const { data: branch } = await supabase.from("branches").select("*").eq("id", branchId).single();
    if (branch) setBranchInfo(branch);

    // ২. ক্লাস ডাটা ফেচ
    const { data: classes } = await supabase
      .from("academic_classes")
      .select("academic_year")
      .eq("branch_id", branchId);
    
    // ৩. স্টুডেন্ট ডাটা ফেচ
    const { data: students } = await supabase
      .from("students")
      .select("academic_year")
      .eq("branch_id", branchId)
      .eq("status", "active");
    
    if (classes) {
      const uniqueYears = Array.from(new Set(classes.map(c => Number(c.academic_year))));
      
      const stats: YearStat[] = uniqueYears.map(year => {
        const classCount = classes.filter(c => Number(c.academic_year) === year).length;
        const studentCount = students?.filter(s => Number(s.academic_year) === year).length || 0;
        
        return {
          year,
          classCount,
          studentCount
        };
      });

      // নতুন বছর আগে দেখাবে
      setYearsData(stats.sort((a, b) => b.year - a.year));
    }
    setLoading(false);
  };

  // --- Create Handler ---
  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.department) return alert("দয়া করে বিভাগ এবং ক্লাসের নাম সিলেক্ট করুন।");
    
    setIsSubmitting(true);
    
    // নতুন বছর শুরু করার জন্য একটি ক্লাস এন্ট্রি দেওয়া হচ্ছে
    const { error } = await supabase.from("academic_classes").insert([{
      name: formData.name,
      department: formData.department,
      academic_year: formData.academic_year,
      branch_id: parseInt(branchId),
      is_active: true
    }]);

    if (error) {
      alert("সমস্যা হয়েছে! সম্ভবত এই ক্লাসটি ইতিমধ্যে তালিকায় আছে।");
    } else {
      setIsOpen(false);
      setFormData({ department: "", name: "", academic_year: currentYear + 1 });
      fetchData();
    }
    setIsSubmitting(false);
  };

  // --- Edit Handler ---
  const openEditModal = (e: React.MouseEvent, year: number) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingYear({ old: year, new: year });
    setIsEditOpen(true);
  };

  const handleUpdateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingYear) return;
    setIsSubmitting(true);

    // ১. ক্লাসের সাল আপডেট
    const { error: classError } = await supabase
      .from("academic_classes")
      .update({ academic_year: editingYear.new })
      .eq("branch_id", parseInt(branchId))
      .eq("academic_year", editingYear.old);

    if (classError) {
      alert("আপডেট করা যায়নি!");
    } else {
      // ২. স্টুডেন্টের সাল আপডেট (অপশনাল কিন্তু ভালো)
      await supabase
        .from("students")
        .update({ academic_year: editingYear.new })
        .eq("branch_id", parseInt(branchId))
        .eq("academic_year", editingYear.old);

      setIsEditOpen(false);
      await fetchData();
    }
    setIsSubmitting(false);
  };

  // --- Delete Handler ---
  const openDeleteModal = (e: React.MouseEvent, year: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteYear(year);
    setPassword("");
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteYear || !password) return;
    setIsSubmitting(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email: userEmail, password });
    if (authError) { alert("পাসওয়ার্ড ভুল হয়েছে!"); setIsSubmitting(false); return; }

    const { error } = await supabase.from("academic_classes").delete().eq("branch_id", branchId).eq("academic_year", deleteYear);
    if (error) alert("শিক্ষাবর্ষ ডিলিট করা যায়নি!");
    else { await fetchData(); setIsDeleteOpen(false); }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8">
      {/* হেডার */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/academic/branches" className="hover:text-green-600 font-medium">শাখা তালিকা</Link>
          <ArrowRight className="w-3 h-3" />
          <span className="font-semibold text-gray-800">{branchInfo?.name}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-green-600" /> শিক্ষাবর্ষ তালিকা
            </h1>
            <p className="text-sm text-gray-500">শিক্ষাবর্ষ অনুযায়ী শ্রেণি ও শিক্ষার্থী ব্যবস্থাপনা</p>
          </div>
          <Button onClick={() => setIsOpen(true)} className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100 font-bold">
            <Plus className="w-4 h-4 mr-2" /> নতুন শিক্ষাবর্ষ শুরু
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {yearsData.map((stat) => {
            const isCurrent = stat.year === currentYear;
            const isUpcoming = stat.year > currentYear;

            return (
              <Link key={stat.year} href={`/dashboard/academic/branches/${branchId}/year/${stat.year}`}>
                <div className={`
                  relative p-6 rounded-2xl border-2 transition-all cursor-pointer group text-center space-y-4 overflow-hidden h-full flex flex-col justify-between
                  ${isCurrent 
                    ? 'bg-green-50 border-green-500 shadow-xl scale-105 ring-4 ring-green-100' 
                    : isUpcoming 
                      ? 'bg-blue-50 border-blue-200 hover:border-blue-500 hover:shadow-lg' 
                      : 'bg-white border-gray-200 hover:border-gray-400 grayscale hover:grayscale-0 hover:shadow-md'}
                `}>
                  
                  {/* Action Buttons (Edit & Delete) */}
                  <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => openEditModal(e, stat.year)} 
                      className="p-1.5 rounded-full bg-white text-gray-400 hover:text-blue-600 shadow-sm border border-gray-100"
                      title="সাল সংশোধন"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => openDeleteModal(e, stat.year)} 
                      className="p-1.5 rounded-full bg-white text-red-300 hover:text-red-600 shadow-sm border border-gray-100"
                      title="শিক্ষাবর্ষ ডিলিট"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isCurrent && (
                    <div className="absolute top-0 left-0 bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-br-xl shadow-sm z-10">
                      বর্তমান
                    </div>
                  )}
                  {isUpcoming && (
                    <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-br-xl shadow-sm z-10">
                      আপকামিং
                    </div>
                  )}

                  <div>
                    <div className={`
                      w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110 shadow-sm
                      ${isCurrent ? 'bg-white text-green-700' : isUpcoming ? 'bg-white text-blue-700' : 'bg-gray-100 text-gray-500'}
                    `}>
                      {isCurrent ? <Star className="w-8 h-8 fill-current" /> : isUpcoming ? <Clock className="w-8 h-8" /> : <History className="w-8 h-8" />}
                    </div>
                    
                    <h3 className={`text-3xl font-black ${isCurrent ? 'text-green-800' : 'text-gray-800'}`}>{stat.year}</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-70">SESSION</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 w-full pt-2">
                    <div className={`p-2 rounded-lg ${isCurrent ? 'bg-white/60' : 'bg-gray-100/50'}`}>
                       <div className="flex items-center justify-center gap-1 text-xs font-bold text-gray-500 mb-1">
                          <Layers className="w-3 h-3" /> ক্লাস
                       </div>
                       <span className="text-lg font-bold text-gray-800">{stat.classCount}</span>
                    </div>
                    <div className={`p-2 rounded-lg ${isCurrent ? 'bg-white/60' : 'bg-gray-100/50'}`}>
                       <div className="flex items-center justify-center gap-1 text-xs font-bold text-gray-500 mb-1">
                          <GraduationCap className="w-3 h-3" /> ছাত্রী
                       </div>
                       <span className="text-lg font-bold text-gray-800">{stat.studentCount}</span>
                    </div>
                  </div>
                  
                  <Button size="sm" className={`w-full rounded-lg font-bold ${isCurrent ? 'bg-green-600 hover:bg-green-700' : 'bg-white border hover:bg-gray-100 text-gray-700'}`}>
                    প্রবেশ করুন
                  </Button>
                </div>
              </Link>
            );
          })}

          {/* Empty State */}
          {yearsData.length === 0 && (
             <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl border-gray-300 text-gray-400 flex flex-col items-center gap-3">
                <div className="bg-gray-50 p-4 rounded-full"><Calendar className="w-12 h-12 opacity-20" /></div>
                <div>
                    <h3 className="text-lg font-bold text-gray-600">কোনো শিক্ষাবর্ষ চালু করা হয়নি</h3>
                    <p className="text-sm">উপরের বাটনে ক্লিক করে নতুন শিক্ষাবর্ষ শুরু করুন।</p>
                </div>
                <Button variant="outline" onClick={() => setIsOpen(true)}>+ এখনই শুরু করুন</Button>
             </div>
          )}
        </div>
      )}

      {/* --- 1. Create Year Modal (Updated) --- */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">নতুন শিক্ষাবর্ষ শুরু করুন</DialogTitle>
            <DialogDescription>
                শিক্ষাবর্ষ চালু করার জন্য ওই বছরের একটি শুরুর ক্লাস (যেমন: প্লে বা নার্সারি) তৈরি করতে হবে।
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateYear} className="space-y-5 mt-2">
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">শিক্ষাবর্ষ (Year)</label>
              <Input 
                type="number" 
                value={formData.academic_year} 
                onChange={(e) => setFormData({...formData, academic_year: parseInt(e.target.value)})} 
                required 
                className="font-bold text-lg h-12 text-center bg-gray-50 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">বিভাগ</label>
                    <select 
                        className="w-full h-11 px-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value, name: ""})}
                        required
                    >
                        <option value="">সিলেক্ট করুন</option>
                        {departments.map((d, i) => <option key={i} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">প্রথম ক্লাস</label>
                    <select 
                        className="w-full h-11 px-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                        disabled={!formData.department}
                    >
                        <option value="">সিলেক্ট করুন</option>
                        {formData.department && classesByDept[formData.department]?.map((c, i) => (
                            <option key={i} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>
            
            <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-green-600 font-bold hover:bg-green-700 text-lg">
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "শুরু করুন"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- 2. Edit Modal --- */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>শিক্ষাবর্ষ সংশোধন করুন</DialogTitle>
            <DialogDescription>এটি পরিবর্তন করলে এই বছরের <strong>সকল ক্লাসের সাল</strong> আপডেট হয়ে যাবে।</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateYear} className="space-y-4 mt-2">
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">নতুন শিক্ষাবর্ষ (Year)</label>
                <Input 
                  type="number" 
                  value={editingYear?.new} 
                  onChange={(e) => setEditingYear(prev => prev ? ({...prev, new: parseInt(e.target.value)}) : null)} 
                  required 
                  className="font-bold text-lg text-center"
                />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>বাতিল</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600">
                  {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <><Save className="w-4 h-4 mr-2" /> আপডেট করুন</>}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- 3. Delete Modal --- */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 font-bold flex items-center gap-2">
                <Trash2 className="w-5 h-5" /> শিক্ষাবর্ষ ডিলিট
            </DialogTitle>
            <DialogDescription className="text-gray-600 pt-2">
               সতর্কতা: <strong>{deleteYear}</strong> সালের সকল ক্লাস এবং ডাটা মুছে যাবে!<br /><br />
               নিশ্চিত করতে আপনার <span className="font-bold text-gray-800">লগইন পাসওয়ার্ড</span> দিন:
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDeleteConfirm} className="space-y-4 mt-2">
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">পাসওয়ার্ড</label>
                <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="••••••••" 
                        className="pl-9 h-11 focus:ring-red-500 border-red-100 bg-red-50/20" 
                        required 
                    />
                </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" onClick={() => setIsDeleteOpen(false)} variant="outline">বাতিল</Button>
                <Button type="submit" disabled={isSubmitting} variant="destructive" className="font-bold">
                    {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : "নিশ্চিত ডিলিট করুন"}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}