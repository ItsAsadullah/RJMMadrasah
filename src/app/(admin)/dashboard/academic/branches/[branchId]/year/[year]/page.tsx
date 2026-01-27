"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, Layers, Calendar, ArrowRight, Settings, Loader2, ChevronLeft, Edit, Save, BookOpen, Users, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { departments, classesByDept } from "@/data/bangladesh-data";

// --- ক্লাসের লজিক্যাল অর্ডার ---
const classOrder = [
  "শিশু", "প্রথম শ্রেণি", "দ্বিতীয় শ্রেণি", "তৃতীয় শ্রেণি", "চতুর্থ শ্রেণি", "পঞ্চম শ্রেণি",
  "নাজেরা", "হিফজ", "আমুখতা",
  "নাহবেমীর", "হেদায়াতুন নাহু", "কাফিয়া", "শরহে জামী", "শরহে বেকায়া"
];

export default function ClassListPage({ params }: { params: Promise<{ branchId: string, year: string }> }) {
  const { branchId, year } = use(params);
  const [classes, setClasses] = useState<any[]>([]);
  const [branchInfo, setBranchInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  
  // Sorting State
  const [sortType, setSortType] = useState("logical");

  // Create Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ department: "", name: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({ id: "", department: "", name: "" });

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);
    };
    getUser();
    fetchData();
  }, [branchId, year]);

  const fetchData = async () => {
    setLoading(true);
    // ১. ব্রাঞ্চ তথ্য
    const { data: branch } = await supabase.from("branches").select("name").eq("id", branchId).single();
    if (branch) setBranchInfo(branch);

    // ২. ক্লাস ডাটা + সাবজেক্ট কাউন্ট ফেচ করা
    const { data: clsData, error } = await supabase
      .from("academic_classes")
      .select(`*, academic_subjects (count)`)
      .eq("branch_id", parseInt(branchId))
      .eq("academic_year", parseInt(year));

    if (error) {
        console.error("Classes Error:", error);
    } else if (clsData) {
        // ৩. স্টুডেন্ট কাউন্ট আলাদাভাবে ফেচ করা
        const { data: students } = await supabase
            .from("students")
            .select("class_name")
            .eq("branch_id", parseInt(branchId))
            .eq("academic_year", parseInt(year))
            .eq("status", "active");

        // ৪. ডাটা মার্জ করা
        const mergedClasses = clsData.map((c: any) => {
            const studentCount = students?.filter(s => s.class_name === c.name).length || 0;
            return {
                ...c,
                subjectCount: c.academic_subjects[0]?.count || 0,
                studentCount: studentCount
            };
        });

        // ডিফল্ট সর্টিং প্রয়োগ
        sortClasses(mergedClasses, "logical");
    }
    setLoading(false);
  };

  const sortClasses = (data: any[], type: string) => {
    let sorted = [...data];
    if (type === "logical") {
        sorted.sort((a, b) => {
            const indexA = classOrder.indexOf(a.name);
            const indexB = classOrder.indexOf(b.name);
            if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
    } else if (type === "new_first") {
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (type === "old_first") {
        sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    setClasses(sorted);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const type = e.target.value;
      setSortType(type);
      sortClasses(classes, type);
  };

  // --- Grouping Logic ---
  const groupedClasses = classes.reduce((acc: any, cls) => {
    const dept = cls.department || "বিভাগ নেই (Undefined)";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(cls);
    return acc;
  }, {});

  const sortedGroupKeys = Object.keys(groupedClasses).sort((a, b) => {
      const idxA = departments.indexOf(a);
      const idxB = departments.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
  });

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.department) return alert("বিভাগ এবং ক্লাসের নাম সিলেক্ট করুন");
    setIsSubmitting(true);

    const { error } = await supabase.from("academic_classes").insert([{
      department: formData.department,
      name: formData.name,
      academic_year: parseInt(year),
      branch_id: parseInt(branchId),
      is_active: true
    }]);

    if (error) {
      alert("ত্রুটি: সম্ভবত এই ক্লাসটি ইতিমধ্যে তৈরি করা হয়েছে।");
    } else {
      setIsOpen(false);
      setFormData({ department: "", name: "" });
      await fetchData();
    }
    setIsSubmitting(false);
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData.name || !editData.department) return;
    setIsSubmitting(true);

    const { error } = await supabase
      .from("academic_classes")
      .update({ name: editData.name, department: editData.department })
      .eq("id", editData.id);

    if (error) {
      alert("আপডেট করা যায়নি!");
    } else {
      setIsEditOpen(false);
      await fetchData();
    }
    setIsSubmitting(false);
  };

  const handleDeleteConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteId || !password) return;
    setIsSubmitting(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email: userEmail, password });
    if (authError) { alert("পাসওয়ার্ড ভুল হয়েছে!"); setIsSubmitting(false); return; }
    
    const { error } = await supabase.from("academic_classes").delete().eq("id", deleteId);
    if (!error) { setIsDeleteOpen(false); await fetchData(); } else alert("ডিলিট ব্যর্থ হয়েছে!");
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/academic/branches" className="hover:text-blue-600">শাখা</Link>
          <ArrowRight className="w-3 h-3" />
          <Link href={`/dashboard/academic/branches/${branchId}`} className="hover:text-blue-600">{branchInfo?.name}</Link>
          <ArrowRight className="w-3 h-3" />
          <span className="font-semibold text-gray-800">শিক্ষাবর্ষ {year}</span>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/academic/branches/${branchId}`}>
                <Button variant="ghost" size="icon" className="rounded-full bg-gray-50 hover:bg-gray-100"><ChevronLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Layers className="w-6 h-6 text-blue-600" /> শ্রেণি তালিকা ({year})
              </h1>
              <p className="text-sm text-gray-500">শাখা: {branchInfo?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <ArrowUpDown className="w-4 h-4 text-gray-500" />
                <select 
                    value={sortType} 
                    onChange={handleSortChange} 
                    className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
                >
                    <option value="logical">একাডেমিক ক্রম</option>
                    <option value="new_first">সর্বশেষ তৈরি আগে</option>
                    <option value="old_first">সর্বপ্রথম তৈরি আগে</option>
                </select>
            </div>
            <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100">
              <Plus className="w-4 h-4 mr-2" /> নতুন ক্লাস
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>
      ) : sortedGroupKeys.length > 0 ? (
        <div className="space-y-8">
          {sortedGroupKeys.map((dept) => (
            <div key={dept} className="space-y-4">
              <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2 border-b pb-2">
                <span className={`w-2 h-6 rounded-full ${dept === 'বিভাগ নেই (Undefined)' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                {dept}
                {dept === 'বিভাগ নেই (Undefined)' && <span className="text-xs text-red-500 ml-2">(দয়া করে এগুলো ডিলিট বা এডিট করুন)</span>}
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full font-normal text-gray-500 ml-auto">{groupedClasses[dept].length} টি ক্লাস</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedClasses[dept].map((cls: any) => (
                  <div key={cls.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all group relative overflow-hidden">
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {/* FIX: Department null হলে empty string পাস করা হচ্ছে */}
                      <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); setEditData({id: cls.id, name: cls.name, department: cls.department || ""}); setIsEditOpen(true); }} className="h-8 w-8 text-gray-500 bg-white border"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); setDeleteId(cls.id); setPassword(""); setIsDeleteOpen(true); }} className="h-8 w-8 text-red-400 bg-white border"><Trash2 className="w-4 h-4" /></Button>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 font-black text-lg">
                        {cls.name.substring(0, 1)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{cls.name}</h3>
                        <p className="text-xs text-gray-400 font-medium tracking-wider">{cls.department || "N/A"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-green-50 p-2 rounded-lg text-center border border-green-100">
                            <div className="flex items-center justify-center gap-1 text-green-600 text-xs font-bold mb-1"><Users className="w-3 h-3" /> শিক্ষার্থী</div>
                            <span className="text-lg font-bold text-green-800">{cls.studentCount}</span>
                        </div>
                        <div className="bg-purple-50 p-2 rounded-lg text-center border border-purple-100">
                            <div className="flex items-center justify-center gap-1 text-purple-600 text-xs font-bold mb-1"><BookOpen className="w-3 h-3" /> বিষয়</div>
                            <span className="text-lg font-bold text-purple-800">{cls.subjectCount}</span>
                        </div>
                    </div>

                    <Link href={`/dashboard/academic/branches/${branchId}/year/${year}/class/${cls.id}`} className="w-full">
                      <Button variant="outline" className="w-full justify-between hover:bg-blue-600 hover:text-white transition-all">
                        <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> বিস্তারিত</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="col-span-full text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center gap-3">
          <Layers className="w-12 h-12 text-gray-300" />
          <p className="text-gray-500 font-medium">এই শিক্ষাবর্ষে কোনো ক্লাস নেই।</p>
          <Button variant="link" onClick={() => setIsOpen(true)} className="text-blue-600">নতুন ক্লাস তৈরি করুন</Button>
        </div>
      )}

      {/* 1. Create Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-bold">নতুন ক্লাস যোগ করুন</DialogTitle></DialogHeader>
          <form onSubmit={handleAddClass} className="space-y-4 mt-4">
            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">বিভাগ নির্বাচন করুন</label>
                <select 
                    className="w-full h-10 px-3 border rounded-md"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value, name: ""})}
                    required
                >
                    <option value="">সিলেক্ট করুন</option>
                    {departments.map((d, i) => <option key={i} value={d}>{d}</option>)}
                </select>
            </div>
            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">ক্লাসের নাম</label>
                <select 
                    className="w-full h-10 px-3 border rounded-md"
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
            <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600">{isSubmitting ? <Loader2 className="animate-spin" /> : "তৈরি করুন"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent><DialogHeader><DialogTitle className="font-bold">ক্লাস সংশোধন</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateClass} className="space-y-4 mt-4">
             <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">বিভাগ</label>
                <select 
                    className="w-full h-10 px-3 border rounded-md"
                    value={editData.department || ""} // FIX: Null value handling
                    onChange={(e) => setEditData({...editData, department: e.target.value, name: ""})}
                >
                    <option value="">সিলেক্ট করুন (পরিবর্তন করতে)</option>
                    {departments.map((d, i) => <option key={i} value={d}>{d}</option>)}
                </select>
            </div>
            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">ক্লাসের নাম</label>
                <select 
                    className="w-full h-10 px-3 border rounded-md"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                >
                    <option value="">নাম পরিবর্তন করুন</option>
                    {editData.department && classesByDept[editData.department]?.map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                    ))}
                </select>
            </div>
            <DialogFooter>
                <Button type="button" onClick={() => setIsEditOpen(false)} variant="outline">বাতিল</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600">{isSubmitting ? <Loader2 className="animate-spin" /> : "আপডেট করুন"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Delete Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-red-600">ডিলিট নিশ্চিতকরণ</DialogTitle><DialogDescription>পাসওয়ার্ড দিয়ে নিশ্চিত করুন। ক্লাসের সব ডাটা মুছে যাবে।</DialogDescription></DialogHeader>
          <form onSubmit={handleDeleteConfirm} className="space-y-4">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="পাসওয়ার্ড" required />
            <DialogFooter><Button type="button" onClick={() => setIsDeleteOpen(false)} variant="outline">বাতিল</Button><Button type="submit" variant="destructive">ডিলিট</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}