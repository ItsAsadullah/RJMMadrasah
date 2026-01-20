"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Layers, Calendar, ArrowRight, Settings, Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function ClassListPage({ params }: { params: Promise<{ branchId: string, year: string }> }) {
  const { branchId, year } = use(params);
  const [classes, setClasses] = useState<any[]>([]);
  const [branchInfo, setBranchInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [className, setClassName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [branchId, year]);

  const fetchData = async () => {
    setLoading(true);
    // ১. ব্রাঞ্চ তথ্য
    const { data: branch } = await supabase.from("branches").select("name").eq("id", branchId).single();
    if (branch) setBranchInfo(branch);

    // ২. নির্দিষ্ট শাখা এবং শিক্ষাবর্ষ অনুযায়ী ক্লাস ফিল্টার
    // এখানে .eq('academic_year', year) সরাসরি কাজ করে, তবে টাইপ চেক করা ভালো
    const { data: cls, error } = await supabase
      .from("academic_classes")
      .select("*")
      .eq("branch_id", parseInt(branchId))
      .eq("academic_year", parseInt(year)) // কঠোরভাবে Integer ফিল্টারিং
      .order("name", { ascending: true });
    
    if (error) {
        console.error("Classes Error:", error);
    } else {
        setClasses(cls || []);
    }
    setLoading(false);
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className) return;
    setIsSubmitting(true);

    const { error } = await supabase.from("academic_classes").insert([{
      name: className,
      academic_year: parseInt(year),
      branch_id: parseInt(branchId),
      is_active: true
    }]);

    if (error) {
      alert("ত্রুটি: এই নামে হয়তো ক্লাস ইতিমধ্যে আছে।");
    } else {
      setIsOpen(false);
      setClassName("");
      await fetchData();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত? এই ক্লাসের সকল বিষয় মুছে যাবে!")) return;
    const { error } = await supabase.from("academic_classes").delete().eq("id", id);
    if (!error) fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/academic/branches" className="hover:text-blue-600">শাখা</Link>
          <ArrowRight className="w-3 h-3" />
          <Link href={`/dashboard/academic/branches/${branchId}`} className="hover:text-blue-600">{branchInfo?.name}</Link>
          <ArrowRight className="w-3 h-3" />
          <span className="font-semibold text-gray-800">শিক্ষাবর্ষ {year}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/academic/branches/${branchId}`}>
                <Button variant="ghost" size="icon" className="rounded-full bg-gray-50 hover:bg-gray-100">
                    <ChevronLeft className="w-5 h-5" />
                </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Layers className="w-6 h-6 text-blue-600" /> শ্রেণি তালিকা ({year})
              </h1>
              <p className="text-sm text-gray-500">শাখা: {branchInfo?.name}</p>
            </div>
          </div>
          <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100">
            <Plus className="w-4 h-4 mr-2" /> নতুন ক্লাস
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>
        ) : classes.length > 0 ? (
          classes.map((cls) => (
            <div key={cls.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 font-black text-lg">
                  {cls.name.substring(0, 2)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{cls.name}</h3>
                  <p className="text-xs text-gray-400 font-medium tracking-wider">CLASS UNIT</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link href={`/dashboard/academic/branches/${branchId}/${cls.id}`}>
                  <Button variant="outline" className="w-full justify-between hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all">
                    <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> বিষয় ও নম্বর সেটআপ</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                
                <Button 
                    variant="ghost" 
                    onClick={() => handleDelete(cls.id)}
                    className="w-full text-red-400 hover:text-red-600 hover:bg-red-50 text-xs py-1 h-8"
                >
                    <Trash2 className="w-3 h-3 mr-1" /> ক্লাসটি মুছুন
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">এই শিক্ষাবর্ষে কোনো ক্লাস যোগ করা হয়নি।</p>
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-bold">নতুন ক্লাস যোগ করুন ({year})</DialogTitle></DialogHeader>
          <form onSubmit={handleAddClass} className="space-y-4 mt-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">ক্লাসের নাম</label>
                <Input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="যেমন: হিফজ বিভাগ বা নূরানী ১ম" className="h-11" required />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-bold">
              {isSubmitting ? <Loader2 className="animate-spin" /> : "তৈরি করুন"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}