"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Users, School, Filter, Plus, ListFilter, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StudentTable from "@/components/dashboard/students/StudentTable";
import StudentForm from "@/components/dashboard/students/StudentForm";
import { getClassOrder } from "@/lib/classOrder";

export default function StudentManagement() {
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [branchFilter, setBranchFilter] = useState("all");
    const [deptFilter, setDeptFilter] = useState("all");
    const [classFilter, setClassFilter] = useState("all");
    const [showFilters, setShowFilters] = useState(false);

    // Dynamic academic data from database
    const [dbDepartments, setDbDepartments] = useState<any[]>([]);
    const [dbClasses, setDbClasses] = useState<any[]>([]);

    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);

    async function fetchStudents() {
      setLoading(true);
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.error("Error fetching students:", error);
      else setStudents(data || []);
      setLoading(false);
    }

    async function fetchBranches() {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .order("id", { ascending: true });

      if (error) console.error("Error fetching branches:", error);
      else setBranches(data || []);
    }

    async function fetchAcademicData() {
      try {
        const { data: depts, error: deptError } = await supabase
          .from("departments")
          .select("id, name, branch_id");
        if (deptError) console.error("Error fetching departments:", deptError);
        else setDbDepartments(depts || []);

        const { data: classes, error: classError } = await supabase
          .from("academic_classes")
          .select("id, name, branch_id, department_id");
        if (classError) console.error("Error fetching classes:", classError);
        else setDbClasses(classes || []);
      } catch (error) {
        console.error("Error fetching academic data:", error);
      }
    }

    useEffect(() => {
      fetchStudents();
      fetchBranches();
      fetchAcademicData();

      // Real-time subscription
      const channel = supabase
        .channel('students-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setStudents(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setStudents(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
          } else if (payload.eventType === 'DELETE') {
            setStudents(prev => prev.filter(s => s.id !== payload.old.id));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, []);

    // --- Filter Logic ---
    const filteredStudents = students.filter(s => {
      if (branchFilter !== "all" && String(s.branch_id || "") !== branchFilter) return false;
      
      if (deptFilter !== "all") {
        const parts = deptFilter.split("::");
        if (parts.length === 2) {
          const [dBranchId, dName] = parts;
          if (String(s.branch_id || "") !== dBranchId || (s.department || "").trim() !== dName) return false;
        } else {
          if ((s.department || "").trim() !== deptFilter) return false;
        }
      }
      
      if (classFilter !== "all") {
        const parts = classFilter.split("::");
        if (parts.length === 2) {
          const [cBranchId, cName] = parts;
          if (String(s.branch_id || "") !== cBranchId || (s.class_name || "").trim() !== cName) return false;
        } else {
          if ((s.class_name || "").trim() !== classFilter) return false;
        }
      }
      
      return true;
    });

    const getDeptOptions = () => {
      const options: { label: string, value: string }[] = [];
      const seen = new Set();
      
      const studentsForBranch = branchFilter === "all" ? students : students.filter(s => String(s.branch_id) === branchFilter);

      studentsForBranch.forEach(s => {
        const name = (s.department || "").trim();
        if (!name) return;
        const branchId = s.branch_id || "";
        const value = `${branchId}::${name}`;
        if (!seen.has(value)) {
          seen.add(value);
          let label = name;
          if (branchFilter === "all") {
             const branch = branches.find(b => String(b.id) === String(branchId));
             if (branch) label = `${name} - ${branch.name}`;
          }
          options.push({ label, value });
        }
      });
      // Sort alphabetically by label
      return options.sort((a, b) => a.label.localeCompare(b.label, "bn"));
    };
    const deptOptions = getDeptOptions();

    const getClassOptions = () => {
      const options: { label: string, value: string }[] = [];
      const seen = new Set();
      
      const studentsForClass = students.filter(s => {
        if (branchFilter !== "all" && String(s.branch_id) !== branchFilter) return false;
        
        if (deptFilter !== "all") {
          const parts = deptFilter.split("::");
          if (parts.length === 2) {
            const [dBranchId, dName] = parts;
            if (String(s.branch_id || "") !== dBranchId || (s.department || "").trim() !== dName) return false;
          } else {
            if ((s.department || "").trim() !== deptFilter) return false;
          }
        }
        return true;
      });

      studentsForClass.forEach(s => {
        const name = (s.class_name || "").trim();
        if (!name) return;
        const branchId = s.branch_id || "";
        const value = `${branchId}::${name}`;
        if (!seen.has(value)) {
          seen.add(value);
          let label = name;
          if (branchFilter === "all") {
             const branch = branches.find(b => String(b.id) === String(branchId));
             if (branch) label = `${name} - ${branch.name}`;
          }
          options.push({ label, value });
        }
      });
      // Sort by class order (ছোট → বড়), then by branch label
      return options.sort((a, b) => {
        const classNameA = a.label.split(" - ")[0].trim();
        const classNameB = b.label.split(" - ")[0].trim();
        const diff = getClassOrder(classNameA) - getClassOrder(classNameB);
        if (diff !== 0) return diff;
        return a.label.localeCompare(b.label, "bn");
      });
    };
    const classOptions = getClassOptions();

    const handleBranchChange = (value: string) => {
      setBranchFilter(value);
      setDeptFilter("all");
      setClassFilter("all");
    };

    const handleDeptChange = (value: string) => {
      setDeptFilter(value);
      setClassFilter("all");
    };

    const activeStudents = filteredStudents.filter(s => s.status === 'active');
    const pendingStudents = filteredStudents.filter(s => s.status === 'pending');

    // --- Handlers ---
    const handleEdit = (student: any) => {
      router.push(`/dashboard/students/edit/${student.id}`);
    };

    const handleDelete = async (id: string) => {
      if (!confirm("Are you sure you want to delete this student?")) return;
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) alert("Error deleting student");
      else { alert("Student deleted successfully"); fetchStudents(); }
    };

    const handleBulkDelete = async (ids: string[]) => {
      const { error } = await supabase.from("students").delete().in("id", ids);
      if (error) alert("Error deleting students");
      else { alert(`${ids.length} students deleted successfully`); fetchStudents(); }
    };

    const handleAddNew = () => {
      router.push('/dashboard/students/add');
    };

    return (
      <div className="space-y-3 md:space-y-4 px-0 py-3 md:py-4 bg-gray-50/50 min-h-screen font-[Kalpurush]">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 px-3 md:px-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" /> শিক্ষার্থী ব্যবস্থাপনা
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">সকল শিক্ষার্থীর তথ্য, ভর্তি ও প্রোফাইল নিয়ন্ত্রণ করুন</p>
          </div>
          
          <Button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700 shadow-md h-9 text-sm w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" /> নতুন শিক্ষার্থী ভর্তি
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 px-3 md:px-4">
          <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 sm:gap-3">
              <div className="bg-blue-50 p-2.5 md:p-3 rounded-full text-blue-600"><Users className="w-5 h-5 md:w-6 md:h-6" /></div>
              <div>
                  <p className="text-xs md:text-sm text-gray-500">মোট শিক্ষার্থী (সক্রিয়)</p>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 leading-none mt-1">{students.filter(s => s.status === 'active').length}</h3>
              </div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 sm:gap-3">
              <div className="bg-orange-50 p-2.5 md:p-3 rounded-full text-orange-600"><Clock className="w-5 h-5 md:w-6 md:h-6" /></div>
              <div>
                  <p className="text-xs md:text-sm text-gray-500">অপেক্ষমাণ আবেদন</p>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 leading-none mt-1">{students.filter(s => s.status === 'pending').length}</h3>
              </div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 sm:gap-3 col-span-2 md:col-span-1 overflow-hidden">
              <div className="bg-purple-50 p-2.5 md:p-3 rounded-full text-purple-600 flex-shrink-0"><School className="w-5 h-5 md:w-6 md:h-6" /></div>
              <div className="flex overflow-x-auto gap-2 w-full text-center pb-1 scrollbar-thin scrollbar-thumb-gray-200">
                  <div className="rounded-md bg-gray-50 px-2 py-1.5 min-w-[70px] flex-1 flex-shrink-0">
                    <p className="text-[10px] md:text-xs text-gray-500 leading-tight">মোট শাখা</p>
                    <p className="text-sm md:text-base font-bold text-gray-800">{branches.length}টি</p>
                  </div>
                  {branches.map(branch => {
                    const count = students.filter(s => s.status === "active" && String(s.branch_id) === String(branch.id)).length;
                    return (
                      <div key={branch.id} className="rounded-md bg-gray-50 px-2 py-1.5 min-w-[70px] flex-1 flex-shrink-0">
                        <p className="text-[10px] md:text-xs text-gray-500 leading-tight truncate" title={branch.name}>{branch.name}</p>
                        <p className="text-sm md:text-base font-semibold text-gray-800">{count} জন</p>
                      </div>
                    );
                  })}
              </div>
          </div>
        </div>

        {/* ── Filter Card ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-3 sm:p-4 md:p-5">
            <Button
              type="button"
              variant="outline"
              className="h-9 px-3 text-sm"
              onClick={() => setShowFilters(prev => !prev)}
            >
              <Filter className="w-4 h-4 mr-2" />
              ফিল্টার
              {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </Button>

            {showFilters && (
              <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center bg-gray-50 p-3 md:p-4 rounded-lg border mt-3">
                <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
                  <Filter className="w-4 h-4" /> ফিল্টার:
                </div>

                <Select value={branchFilter} onValueChange={handleBranchChange}>
                  <SelectTrigger className="w-full md:w-45 bg-white h-9 text-sm">
                    <SelectValue placeholder="শাখা নির্বাচন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সকল শাখা</SelectItem>
                    {branches?.map(b => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={deptFilter} onValueChange={handleDeptChange}>
                  <SelectTrigger className="w-full md:w-45 bg-white h-9 text-sm">
                    <SelectValue placeholder="বিভাগ নির্বাচন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সকল বিভাগ</SelectItem>
                    {deptOptions.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-full md:w-45 bg-white h-9 text-sm">
                    <SelectValue placeholder="শ্রেণি নির্বাচন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সকল শ্রেণি</SelectItem>
                    {classOptions.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  onClick={() => { setBranchFilter("all"); setDeptFilter("all"); setClassFilter("all"); }}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 px-3 text-sm w-full md:w-auto"
                >
                  রিসেট
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs + Table Card (full-width, minimal padding) ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <Tabs defaultValue="active" className="w-full">
            <div className="px-3 sm:px-4 md:px-5 pt-3 sm:pt-4 border-b border-gray-100">
              <TabsList className="grid w-full grid-cols-2 mb-0 h-auto p-1">
                <TabsTrigger value="active" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-2">
                  <ListFilter className="w-4 h-4" /> শিক্ষার্থী তালিকা ({activeStudents.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-2">
                  <Clock className="w-4 h-4" /> অপেক্ষমাণ ({pendingStudents.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="active" className="m-0">
              <div className="p-3 sm:p-4 md:p-5">
                {loading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>
                ) : (
                  <StudentTable
                    data={activeStudents.map(s => ({ ...s, branches: { name: branches.find(b => String(b.id) === String(s.branch_id))?.name || "-" } }))}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onBulkDelete={handleBulkDelete}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="pending" className="m-0">
              <div className="p-3 sm:p-4 md:p-5">
                {loading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>
                ) : pendingStudents.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                    কোনো অপেক্ষমাণ শিক্ষার্থী নেই
                  </div>
                ) : (
                  <StudentTable
                    data={pendingStudents.map(s => ({ ...s, branches: { name: branches.find(b => String(b.id) === String(s.branch_id))?.name || "-" } }))}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onBulkDelete={handleBulkDelete}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Form Modal */}
        <StudentForm 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen}
          student={editingStudent}
          onSuccess={fetchStudents}
          branches={branches}
          dbDepartments={dbDepartments}
          dbClasses={dbClasses}
        />

      </div>
    );
}
