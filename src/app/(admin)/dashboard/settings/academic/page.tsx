"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Save, Loader2, BookOpen, Calendar, Building, Layers, School, Edit, Search, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import ClassSubjectSetup from "@/components/dashboard/academic/ClassSubjectSetup";

export default function AcademicSettings() {
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);

  // --- Filter States ---
  const [filterBranchName, setFilterBranchName] = useState("");

  const [filterDeptBranch, setFilterDeptBranch] = useState("");
  const [filterDeptName, setFilterDeptName] = useState("");

  const [filterClassBranch, setFilterClassBranch] = useState("");
  const [filterClassDept, setFilterClassDept] = useState("");
  const [filterClassYear, setFilterClassYear] = useState("");
  const [filterClassName, setFilterClassName] = useState("");

  const [filterExamYear, setFilterExamYear] = useState("");
  const [filterExamName, setFilterExamName] = useState("");

  // Form States
  const [newBranch, setNewBranch] = useState({ name: "", address: "", phone: "", is_active: true });
  const [editingBranch, setEditingBranch] = useState<any>(null); // For edit mode

  const [newDept, setNewDept] = useState({ name: "", branch_id: "", is_active: true });
  const [editingDept, setEditingDept] = useState<any>(null);

  const [newClass, setNewClass] = useState({ name: "", branch_id: "", department_id: "", academic_year: new Date().getFullYear().toString(), is_active: true, allow_residential: true });
  const [editingClass, setEditingClass] = useState<any>(null);

  const [newExam, setNewExam] = useState({ name: "", year: new Date().getFullYear().toString() });
  const [editingExam, setEditingExam] = useState<any>(null);

  const [subjectBranchId, setSubjectBranchId] = useState<string>("");
  const [subjectYear, setSubjectYear] = useState<string>(new Date().getFullYear().toString());
  const [subjectClassId, setSubjectClassId] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: branchData } = await supabase.from("branches").select("*").order("id", { ascending: true });
    const { data: deptData } = await supabase.from("departments").select("*, branches(name)").order("name", { ascending: true });
    const { data: classData } = await supabase.from("academic_classes").select("*, branches(name), departments(name)").order("name", { ascending: true });
    const { data: examData } = await supabase.from("exams").select("*").order("created_at", { ascending: false });
    
    if (branchData) setBranches(branchData);
    if (deptData) setDepartments(deptData);
    if (classData) setClasses(classData);
    if (examData) setExams(examData);
  };

  // --- Branch Functions ---
  const handleAddBranch = async () => {
    if (!newBranch.name) return alert("শাখার নাম দিন");
    setLoading(true);

    if (editingBranch) {
        // Update Logic
        const { error } = await supabase.from("branches").update(newBranch).eq("id", editingBranch.id);
        if (!error) {
            setNewBranch({ name: "", address: "", phone: "", is_active: true });
            setEditingBranch(null);
            fetchData();
        } else {
            alert(error.message);
        }
    } else {
        // Insert Logic
        const { error } = await supabase.from("branches").insert([newBranch]);
        if (!error) {
            setNewBranch({ name: "", address: "", phone: "", is_active: true });
            fetchData();
        } else {
            alert(error.message);
        }
    }
    setLoading(false);
  };

  const handleEditBranch = (branch: any) => {
      setNewBranch({ name: branch.name, address: branch.address || "", phone: branch.phone || "", is_active: branch.is_active });
      setEditingBranch(branch);
  };

  const handleDeleteBranch = async (id: number) => {
    if (!confirm("নিশ্চিত ডিলিট করবেন?")) return;
    const { error } = await supabase.from("branches").delete().eq("id", id);
    if (error) alert("ডিলিট করা যাবে না (অন্য তথ্যের সাথে যুক্ত)");
    else fetchData();
  };

  // --- Department Functions ---
  const handleAddDept = async () => {
    if (!newDept.name || !newDept.branch_id) return alert("বিভাগের নাম এবং শাখা নির্বাচন করুন");
    setLoading(true);

    if (editingDept) {
        // Update
        const { error } = await supabase.from("departments").update(newDept).eq("id", editingDept.id);
        if (!error) {
            setNewDept({ name: "", branch_id: "", is_active: true });
            setEditingDept(null);
            fetchData();
        } else {
            alert(error.message);
        }
    } else {
        // Insert
        const { error } = await supabase.from("departments").insert([newDept]);
        if (!error) {
            setNewDept({ name: "", branch_id: "", is_active: true });
            fetchData();
        } else {
            alert(error.message);
        }
    }
    setLoading(false);
  };

  const handleEditDept = (dept: any) => {
      setNewDept({ name: dept.name, branch_id: dept.branch_id, is_active: dept.is_active });
      setEditingDept(dept);
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm("নিশ্চিত ডিলিট করবেন?")) return;
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) alert("ডিলিট করা যাবে না (অন্য তথ্যের সাথে যুক্ত)");
    else fetchData();
  };

  // --- Class Functions ---
  const handleAddClass = async () => {
    if (!newClass.name || !newClass.branch_id) return alert("ক্লাসের নাম এবং শাখা নির্বাচন করুন");
    setLoading(true);
    // department text field is legacy, but we might want to keep it synced or just use department_id
    // For now we will insert department_id. The legacy 'department' column might be needed if other parts of app use it.
    // Let's fetch the department name to populate the legacy column if needed, or just leave it.
    // Ideally we should move away from the text column.
    // For compatibility with existing code that uses 'department' text column:
    let deptName = "";
    if (newClass.department_id) {
        const d = departments.find(dp => dp.id === newClass.department_id);
        if (d) deptName = d.name;
    }

    const payload: any = {
        name: newClass.name,
        branch_id: parseInt(newClass.branch_id),
        academic_year: parseInt(newClass.academic_year),
        is_active: newClass.is_active,
        allow_residential: newClass.allow_residential,
        department: deptName // Populate legacy column
    };
    if (newClass.department_id) payload.department_id = newClass.department_id;

    if (editingClass) {
        // Update
        const { error } = await supabase.from("academic_classes").update(payload).eq("id", editingClass.id);
        if (!error) {
            setNewClass({ name: "", branch_id: "", department_id: "", academic_year: new Date().getFullYear().toString(), is_active: true, allow_residential: true });
            setEditingClass(null);
            fetchData();
        } else {
            alert(error.message);
        }
    } else {
        // Insert
        const { error } = await supabase.from("academic_classes").insert([payload]);
        if (!error) {
            setNewClass({ name: "", branch_id: "", department_id: "", academic_year: new Date().getFullYear().toString(), is_active: true, allow_residential: true });
            fetchData();
        } else {
            alert(error.message);
        }
    }
    setLoading(false);
  };

  const handleEditClass = (cls: any) => {
      setNewClass({
          name: cls.name,
          branch_id: cls.branch_id,
          department_id: cls.department_id || "",
          academic_year: cls.academic_year,
          is_active: cls.is_active,
          allow_residential: cls.allow_residential
      });
      setEditingClass(cls);
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("নিশ্চিত ডিলিট করবেন?")) return;
    const { error } = await supabase.from("academic_classes").delete().eq("id", id);
    if (error) alert("ডিলিট করা যাবে না (অন্য তথ্যের সাথে যুক্ত)");
    else fetchData();
  };

  // --- Exam Functions ---
  const handleAddExam = async () => {
    if (!newExam.name) return alert("পরীক্ষার নাম দিন");
    setLoading(true);

    const payload = {
        title: newExam.name,
        academic_year: parseInt(newExam.year)
    };

    if (editingExam) {
        // Update
        const { error } = await supabase.from("exams").update(payload).eq("id", editingExam.id);
        if (!error) {
            setNewExam({ name: "", year: new Date().getFullYear().toString() });
            setEditingExam(null);
            fetchData();
        } else {
            alert(error.message);
        }
    } else {
        // Insert
        const { error } = await supabase.from("exams").insert([payload]);
        if (!error) {
            setNewExam({ name: "", year: new Date().getFullYear().toString() });
            fetchData();
        } else {
            alert(error.message);
        }
    }
    setLoading(false);
  };

  const handleEditExam = (exam: any) => {
      setNewExam({ name: exam.title, year: exam.academic_year?.toString() || new Date().getFullYear().toString() });
      setEditingExam(exam);
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm("নিশ্চিত ডিলিট করবেন?")) return;
    await supabase.from("exams").delete().eq("id", id);
    fetchData();
  };

  // --- Filtered data ---
  const filteredBranches = branches.filter(b =>
    !filterBranchName || b.name?.toLowerCase().includes(filterBranchName.toLowerCase())
  );

  const filteredDepartments = departments.filter(d => {
    const branchMatch = !filterDeptBranch || String(d.branch_id) === String(filterDeptBranch);
    const nameMatch = !filterDeptName || d.name?.toLowerCase().includes(filterDeptName.toLowerCase());
    return branchMatch && nameMatch;
  });

  const filteredClasses = classes.filter(c => {
    const branchMatch = !filterClassBranch || String(c.branch_id) === String(filterClassBranch);
    const deptMatch = !filterClassDept || String(c.department_id) === String(filterClassDept);
    const yearMatch = !filterClassYear || String(c.academic_year) === String(filterClassYear);
    const nameMatch = !filterClassName || c.name?.toLowerCase().includes(filterClassName.toLowerCase());
    return branchMatch && deptMatch && yearMatch && nameMatch;
  });

  const filteredExams = exams.filter(e => {
    const yearMatch = !filterExamYear || String(e.academic_year) === String(filterExamYear);
    const nameMatch = !filterExamName || e.title?.toLowerCase().includes(filterExamName.toLowerCase());
    return yearMatch && nameMatch;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">একাডেমিক সেটিংস</h1>

      <Tabs defaultValue="branches" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-4xl">
          <TabsTrigger value="branches">শাখা</TabsTrigger>
          <TabsTrigger value="departments">বিভাগ</TabsTrigger>
          <TabsTrigger value="classes">শ্রেণি</TabsTrigger>
          <TabsTrigger value="subjects">বিষয়</TabsTrigger>
          <TabsTrigger value="exams">পরীক্ষা</TabsTrigger>
        </TabsList>

        {/* --- Branches Tab --- */}
        <TabsContent value="branches" className="space-y-6 mt-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-600"/> {editingBranch ? "শাখা তথ্য হালনাগাদ করুন" : "নতুন শাখা যুক্ত করুন"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1"><label className="text-sm font-medium">শাখার নাম</label><Input value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} placeholder="উদাঃ হলিধানী শাখা"/></div>
                    <div className="space-y-1"><label className="text-sm font-medium">ঠিকানা</label><Input value={newBranch.address} onChange={e => setNewBranch({...newBranch, address: e.target.value})} placeholder="ঠিকানা"/></div>
                    <div className="space-y-1"><label className="text-sm font-medium">ফোন</label><Input value={newBranch.phone} onChange={e => setNewBranch({...newBranch, phone: e.target.value})} placeholder="ফোন নম্বর"/></div>
                    <div className="flex gap-2">
                        {editingBranch && (
                            <Button variant="outline" onClick={() => { setEditingBranch(null); setNewBranch({ name: "", address: "", phone: "", is_active: true }); }} className="text-gray-500">
                                বাতিল
                            </Button>
                        )}
                        <Button onClick={handleAddBranch} disabled={loading} className="bg-blue-600 hover:bg-blue-700 flex-1">
                            {editingBranch ? <><Save className="w-4 h-4 mr-2"/> আপডেট করুন</> : <><Plus className="w-4 h-4 mr-2"/> যুক্ত করুন</>}
                        </Button>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Filter Bar */}
                <div className="p-4 border-b bg-gray-50 flex gap-3 items-center">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input value={filterBranchName} onChange={e => setFilterBranchName(e.target.value)} placeholder="নাম দিয়ে খুঁজুন..." className="pl-9 h-9" />
                    </div>
                    {filterBranchName && <Button size="sm" variant="ghost" onClick={() => setFilterBranchName("")} className="text-gray-500 h-9"><X className="w-4 h-4 mr-1"/>রিসেট</Button>}
                    <span className="text-xs text-gray-400 ml-auto">{filteredBranches.length}/{branches.length} শাখা</span>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b"><tr><th className="p-4">নাম</th><th className="p-4">ঠিকানা</th><th className="p-4">ফোন</th><th className="p-4 text-right">অ্যাকশন</th></tr></thead>
                    <tbody className="divide-y">{filteredBranches.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50">
                            <td className="p-4 font-medium">{b.name}</td>
                            <td className="p-4">{b.address}</td>
                            <td className="p-4">{b.phone}</td>
                            <td className="p-4 text-right">
                                <Button size="icon" variant="ghost" onClick={() => handleEditBranch(b)} className="text-blue-500 mr-2"><Edit className="w-4 h-4"/></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDeleteBranch(b.id)} className="text-red-500"><Trash2 className="w-4 h-4"/></Button>
                            </td>
                        </tr>
                    ))}
                    {filteredBranches.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-400 italic">কোনো শাখা পাওয়া যায়নি।</td></tr>}
                    </tbody>
                </table>
            </div>
        </TabsContent>

        {/* --- Departments Tab --- */}
        <TabsContent value="departments" className="space-y-6 mt-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-600"/> {editingDept ? "বিভাগ হালনাগাদ করুন" : "নতুন বিভাগ যুক্ত করুন"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">শাখা নির্বাচন করুন</label>
                        <select className="w-full h-10 px-3 border rounded-md" value={newDept.branch_id} onChange={e => setNewDept({...newDept, branch_id: e.target.value})}>
                            <option value="">শাখা সিলেক্ট করুন</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1"><label className="text-sm font-medium">বিভাগের নাম</label><Input value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} placeholder="উদাঃ জেনারেল / হিফজ"/></div>
                    <div className="flex gap-2">
                        {editingDept && (
                            <Button variant="outline" onClick={() => { setEditingDept(null); setNewDept({ name: "", branch_id: "", is_active: true }); }} className="text-gray-500">
                                বাতিল
                            </Button>
                        )}
                        <Button onClick={handleAddDept} disabled={loading} className="bg-purple-600 hover:bg-purple-700 flex-1">
                            {editingDept ? <><Save className="w-4 h-4 mr-2"/> আপডেট করুন</> : <><Plus className="w-4 h-4 mr-2"/> যুক্ত করুন</>}
                        </Button>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Filter Bar */}
                <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-3 items-center">
                    <select className="h-9 px-3 border rounded-md text-sm" value={filterDeptBranch} onChange={e => setFilterDeptBranch(e.target.value)}>
                        <option value="">সব শাখা</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input value={filterDeptName} onChange={e => setFilterDeptName(e.target.value)} placeholder="বিভাগের নাম..." className="pl-9 h-9" />
                    </div>
                    {(filterDeptBranch || filterDeptName) && <Button size="sm" variant="ghost" onClick={() => { setFilterDeptBranch(""); setFilterDeptName(""); }} className="text-gray-500 h-9"><X className="w-4 h-4 mr-1"/>রিসেট</Button>}
                    <span className="text-xs text-gray-400 ml-auto">{filteredDepartments.length}/{departments.length} বিভাগ</span>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b"><tr><th className="p-4">শাখা</th><th className="p-4">বিভাগ</th><th className="p-4 text-right">অ্যাকশন</th></tr></thead>
                    <tbody className="divide-y">{filteredDepartments.map(d => (
                        <tr key={d.id} className="hover:bg-gray-50">
                            <td className="p-4">{d.branches?.name}</td>
                            <td className="p-4 font-medium">{d.name}</td>
                            <td className="p-4 text-right">
                                <Button size="icon" variant="ghost" onClick={() => handleEditDept(d)} className="text-blue-500 mr-2"><Edit className="w-4 h-4"/></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDeleteDept(d.id)} className="text-red-500"><Trash2 className="w-4 h-4"/></Button>
                            </td>
                        </tr>
                    ))}
                    {filteredDepartments.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-gray-400 italic">কোনো বিভাগ পাওয়া যায়নি।</td></tr>}
                    </tbody>
                </table>
            </div>
        </TabsContent>

        {/* --- Classes Tab --- */}
        <TabsContent value="classes" className="space-y-6 mt-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <School className="w-5 h-5 text-green-600"/> {editingClass ? "শ্রেণি হালনাগাদ করুন" : "নতুন শ্রেণি যুক্ত করুন"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">শাখা</label>
                        <select className="w-full h-10 px-3 border rounded-md" value={newClass.branch_id} onChange={e => setNewClass({...newClass, branch_id: e.target.value, department_id: ""})}>
                            <option value="">শাখা সিলেক্ট</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">বিভাগ</label>
                        <select className="w-full h-10 px-3 border rounded-md" value={newClass.department_id} onChange={e => setNewClass({...newClass, department_id: e.target.value})}>
                            <option value="">বিভাগ সিলেক্ট</option>
                            {departments.filter(d => d.branch_id == newClass.branch_id).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1"><label className="text-sm font-medium">শ্রেণির নাম</label><Input value={newClass.name} onChange={e => setNewClass({...newClass, name: e.target.value})} placeholder="উদাঃ প্রথম শ্রেণি"/></div>
                    <div className="space-y-1"><label className="text-sm font-medium">শিক্ষাবর্ষ</label><Input type="number" value={newClass.academic_year} onChange={e => setNewClass({...newClass, academic_year: e.target.value})} /></div>
                    <div className="space-y-1 flex flex-col justify-center">
                        <label className="text-sm font-medium mb-2">আবাসিক সুবিধা?</label>
                        <div className="flex items-center gap-2">
                            <Checkbox 
                                id="residential" 
                                checked={newClass.allow_residential} 
                                onCheckedChange={(checked) => setNewClass({...newClass, allow_residential: checked as boolean})} 
                            />
                            <label htmlFor="residential" className="text-sm text-gray-600 cursor-pointer select-none">
                                {newClass.allow_residential ? "আবাসিক আছে" : "অনাবাসিক"}
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {editingClass && (
                            <Button variant="outline" onClick={() => { setEditingClass(null); setNewClass({ name: "", branch_id: "", department_id: "", academic_year: new Date().getFullYear().toString(), is_active: true, allow_residential: true }); }} className="text-gray-500">
                                বাতিল
                            </Button>
                        )}
                        <Button onClick={handleAddClass} disabled={loading} className="bg-green-600 hover:bg-green-700 flex-1">
                            {editingClass ? <><Save className="w-4 h-4 mr-2"/> আপডেট করুন</> : <><Plus className="w-4 h-4 mr-2"/> যুক্ত করুন</>}
                        </Button>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Filter Bar */}
                <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-3 items-center">
                    <select className="h-9 px-3 border rounded-md text-sm" value={filterClassBranch} onChange={e => { setFilterClassBranch(e.target.value); setFilterClassDept(""); }}>
                        <option value="">সব শাখা</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <select className="h-9 px-3 border rounded-md text-sm" value={filterClassDept} onChange={e => setFilterClassDept(e.target.value)}>
                        <option value="">সব বিভাগ</option>
                        {departments.filter(d => !filterClassBranch || String(d.branch_id) === String(filterClassBranch)).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <Input type="number" value={filterClassYear} onChange={e => setFilterClassYear(e.target.value)} placeholder="শিক্ষাবর্ষ" className="h-9 w-28" />
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input value={filterClassName} onChange={e => setFilterClassName(e.target.value)} placeholder="শ্রেণির নাম..." className="pl-9 h-9" />
                    </div>
                    {(filterClassBranch || filterClassDept || filterClassYear || filterClassName) && (
                        <Button size="sm" variant="ghost" onClick={() => { setFilterClassBranch(""); setFilterClassDept(""); setFilterClassYear(""); setFilterClassName(""); }} className="text-gray-500 h-9"><X className="w-4 h-4 mr-1"/>রিসেট</Button>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">{filteredClasses.length}/{classes.length} শ্রেণি</span>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b"><tr><th className="p-4">শাখা</th><th className="p-4">বিভাগ</th><th className="p-4">শ্রেণি</th><th className="p-4">শিক্ষাবর্ষ</th><th className="p-4">আবাসিক</th><th className="p-4 text-right">অ্যাকশন</th></tr></thead>
                    <tbody className="divide-y">{filteredClasses.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50">
                            <td className="p-4">{c.branches?.name}</td>
                            <td className="p-4">{c.departments?.name || c.department}</td>
                            <td className="p-4 font-medium">{c.name}</td>
                            <td className="p-4">{c.academic_year}</td>
                            <td className="p-4">{c.allow_residential ? <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs">আছে</span> : <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded text-xs">নেই</span>}</td>
                            <td className="p-4 text-right">
                                <Button size="icon" variant="ghost" onClick={() => handleEditClass(c)} className="text-blue-500 mr-2"><Edit className="w-4 h-4"/></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDeleteClass(c.id)} className="text-red-500"><Trash2 className="w-4 h-4"/></Button>
                            </td>
                        </tr>
                    ))}
                    {filteredClasses.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-400 italic">কোনো শ্রেণি পাওয়া যায়নি।</td></tr>}
                    </tbody>
                </table>
            </div>
        </TabsContent>

        {/* --- Subject Management Tab --- */}
        <TabsContent value="subjects" className="space-y-6 mt-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" /> বিষয় সেটআপ (ক্লাস ভিত্তিক)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-sm font-medium">শাখা</label>
                <select
                  className="w-full h-10 px-3 border rounded-md"
                  value={subjectBranchId}
                  onChange={(e) => {
                    setSubjectBranchId(e.target.value);
                    setSubjectClassId("");
                  }}
                >
                  <option value="">শাখা সিলেক্ট</option>
                  {branches.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">শিক্ষাবর্ষ</label>
                <Input
                  type="number"
                  value={subjectYear}
                  onChange={(e) => {
                    setSubjectYear(e.target.value);
                    setSubjectClassId("");
                  }}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium">ক্লাস</label>
                <select
                  className="w-full h-10 px-3 border rounded-md"
                  value={subjectClassId}
                  onChange={(e) => setSubjectClassId(e.target.value)}
                  disabled={!subjectBranchId || !subjectYear}
                >
                  <option value="">ক্লাস সিলেক্ট</option>
                  {classes
                    .filter((c) => String(c.branch_id) === String(subjectBranchId) && String(c.academic_year) === String(subjectYear))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.departments?.name ? `(${c.departments.name})` : ""}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {subjectBranchId && subjectClassId ? (
            <ClassSubjectSetup branchId={String(subjectBranchId)} classId={String(subjectClassId)} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-gray-500">
              বিষয় সেটআপ দেখতে শাখা, শিক্ষাবর্ষ এবং ক্লাস নির্বাচন করুন।
            </div>
          )}
        </TabsContent>

        {/* --- Exam Management Tab --- */}
        <TabsContent value="exams" className="space-y-6 mt-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> {editingExam ? "পরীক্ষা হালনাগাদ করুন" : "নতুন পরীক্ষা তৈরি করুন"}
            </h3>
            <div className="flex gap-4 items-end">
              <div className="space-y-1 flex-1">
                <label className="text-sm font-medium">পরীক্ষার নাম</label>
                <Input placeholder="উদাঃ বার্ষিক পরীক্ষা" value={newExam.name} onChange={(e) => setNewExam({ ...newExam, name: e.target.value })} />
              </div>
              <div className="space-y-1 w-32">
                <label className="text-sm font-medium">সাল</label>
                <Input type="number" value={newExam.year} onChange={(e) => setNewExam({ ...newExam, year: e.target.value })} />
              </div>
              <div className="flex gap-2">
                  {editingExam && (
                      <Button variant="outline" onClick={() => { setEditingExam(null); setNewExam({ name: "", year: new Date().getFullYear().toString() }); }} className="text-gray-500">
                          বাতিল
                      </Button>
                  )}
                  <Button onClick={handleAddExam} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                    {editingExam ? <><Save className="w-4 h-4 mr-2"/> আপডেট করুন</> : <><Save className="w-4 h-4 mr-2"/> সেভ করুন</>}
                  </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h4 className="font-bold mb-4">পরীক্ষার তালিকা</h4>
            {/* Filter Bar */}
            <div className="flex flex-wrap gap-3 items-center mb-4 p-3 bg-gray-50 rounded-lg border">
                <Input type="number" value={filterExamYear} onChange={e => setFilterExamYear(e.target.value)} placeholder="সাল দিয়ে ফিল্টার" className="h-9 w-36" />
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input value={filterExamName} onChange={e => setFilterExamName(e.target.value)} placeholder="পরীক্ষার নাম..." className="pl-9 h-9" />
                </div>
                {(filterExamYear || filterExamName) && <Button size="sm" variant="ghost" onClick={() => { setFilterExamYear(""); setFilterExamName(""); }} className="text-gray-500 h-9"><X className="w-4 h-4 mr-1"/>রিসেট</Button>}
                <span className="text-xs text-gray-400 ml-auto">{filteredExams.length}/{exams.length} পরীক্ষা</span>
            </div>
            <div className="space-y-2">
              {filteredExams.map((exam) => (
                <div key={exam.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-bold text-gray-800">{exam.title}</p>
                    <p className="text-xs text-gray-500">{exam.academic_year} সাল</p>
                  </div>
                  <div>
                      <Button size="icon" variant="ghost" onClick={() => handleEditExam(exam)} className="text-blue-500 mr-2"><Edit className="w-4 h-4"/></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteExam(exam.id)} className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                  </div>
                </div>
              ))}
              {filteredExams.length === 0 && <p className="text-center py-6 text-gray-400 italic">কোনো পরীক্ষা পাওয়া যায়নি।</p>}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
