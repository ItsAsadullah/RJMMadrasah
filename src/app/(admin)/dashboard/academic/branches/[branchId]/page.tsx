"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Calendar, ArrowRight, Folder, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AcademicYearPage({ params }: { params: Promise<{ branchId: string }> }) {
  const { branchId } = use(params);
  const [years, setYears] = useState<number[]>([]);
  const [branchInfo, setBranchInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: "", 
    academic_year: new Date().getFullYear() 
  });

  useEffect(() => {
    fetchData();
  }, [branchId]);

  const fetchData = async () => {
    setLoading(true);
    // ১. শাখার তথ্য নিয়ে আসা
    const { data: branch } = await supabase.from("branches").select("*").eq("id", branchId).single();
    if (branch) setBranchInfo(branch);

    // ২. এই শাখার অধীনে থাকা সব ইউনিক বছর বের করা
    const { data: classes, error } = await supabase
      .from("academic_classes")
      .select("academic_year")
      .eq("branch_id", branchId)
      .order("academic_year", { ascending: false });
    
    if (error) {
      console.error("Error fetching years:", error);
    } else if (classes) {
      const uniqueYears = Array.from(new Set(classes.map(c => Number(c.academic_year))));
      setYears(uniqueYears);
    }
    setLoading(false);
  };

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // নতুন বছর শুরু করার জন্য একটি ডিফল্ট ক্লাস তৈরি করতে হবে
    const { error } = await supabase.from("academic_classes").insert([{
      name: formData.name,
      academic_year: Number(formData.academic_year),
      branch_id: parseInt(branchId),
      is_active: true
    }]);

    if (error) {
      alert("ত্রুটি: " + error.message);
    } else {
      setIsOpen(false);
      setFormData({ name: "", academic_year: new Date().getFullYear() });
      await fetchData();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/academic/branches" className="hover:text-green-600 transition-colors">শাখা তালিকা</Link>
          <ArrowRight className="w-3 h-3" />
          <span className="font-semibold text-gray-800">{branchInfo?.name || "লোড হচ্ছে..."}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-green-600" /> শিক্ষাবর্ষ তালিকা
            </h1>
            <p className="text-sm text-gray-500">শাখা: {branchInfo?.name}</p>
          </div>
          <Button onClick={() => setIsOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" /> নতুন শিক্ষাবর্ষ
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-green-600 w-10 h-10" />
            <p className="text-gray-500">লোড হচ্ছে...</p>
          </div>
        ) : years.length > 0 ? (
          years.map((year) => (
            <Link key={year} href={`/dashboard/academic/branches/${branchId}/year/${year}`}>
              <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-green-500 hover:shadow-xl transition-all cursor-pointer group text-center space-y-4 relative overflow-hidden">
                <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Folder className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-800">{year}</h3>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">Academic Session</p>
                </div>
                <div className="pt-2">
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full group-hover:bg-green-600 group-hover:text-white transition-colors">
                        ক্লাস দেখুন
                    </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full bg-white border-2 border-dashed border-gray-200 rounded-2xl py-20 flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-gray-300" />
            <div className="text-center">
                <h3 className="text-lg font-bold text-gray-700">কোনো শিক্ষাবর্ষ পাওয়া যায়নি</h3>
                <p className="text-gray-500 text-sm">ডান পাশের বাটন থেকে নতুন শিক্ষাবর্ষ শুরু করুন।</p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">নতুন শিক্ষাবর্ষ শুরু করুন</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateYear} className="space-y-5 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">শিক্ষাবর্ষ (Year)</label>
              <Input 
                type="number" 
                value={formData.academic_year} 
                onChange={(e) => setFormData({...formData, academic_year: parseInt(e.target.value)})} 
                className="h-12 text-lg font-bold"
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">প্রথম ক্লাসের নাম</label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="যেমন: প্লে বা ১ম শ্রেণী" 
                className="h-11"
                required 
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-green-600 text-lg font-bold hover:bg-green-700 transition-colors">
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 w-5 h-5" />} শুরু করুন
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}