"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Users, School, Filter, Plus, ListFilter, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StudentTable from "@/components/dashboard/students/StudentTable";
import StudentForm from "@/components/dashboard/students/StudentForm";
import { departments, classesByDept } from "@/data/bangladesh-data";

export default function StudentManagement() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [branchFilter, setBranchFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  useEffect(() => {
    fetchStudents();

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

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching students:", error);
    else setStudents(data || []);
    setLoading(false);
  };

  // --- Filter Logic ---
  const filteredStudents = students.filter(s => {
    if (branchFilter !== "all" && s.branch_id.toString() !== branchFilter) return false;
    if (deptFilter !== "all" && s.department !== deptFilter) return false;
    if (classFilter !== "all" && s.class_name !== classFilter) return false;
    return true;
  });

  const activeStudents = filteredStudents.filter(s => s.status === 'active');
  const pendingStudents = filteredStudents.filter(s => s.status === 'pending');

  // --- Handlers ---
  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) alert("Error deleting student");
    else alert("Student deleted successfully");
  };

  const handleBulkDelete = async (ids: string[]) => {
    const { error } = await supabase.from("students").delete().in("id", ids);
    if (error) alert("Error deleting students");
    else alert(`${ids.length} students deleted successfully`);
  };

  const handleAddNew = () => {
    setEditingStudent(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50/50 min-h-screen font-[Kalpurush]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-600" /> শিক্ষার্থী ব্যবস্থাপনা
          </h1>
          <p className="text-sm text-gray-500">সকল শিক্ষার্থীর তথ্য, ভর্তি ও প্রোফাইল নিয়ন্ত্রণ করুন</p>
        </div>
        
        <Button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700 shadow-md">
            <Plus className="w-4 h-4 mr-2" /> নতুন শিক্ষার্থী ভর্তি
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-full text-blue-600"><Users className="w-6 h-6" /></div>
            <div>
                <p className="text-sm text-gray-500">মোট শিক্ষার্থী (সক্রিয়)</p>
                <h3 className="text-2xl font-bold text-gray-800">{students.filter(s => s.status === 'active').length}</h3>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-orange-50 p-3 rounded-full text-orange-600"><Clock className="w-6 h-6" /></div>
            <div>
                <p className="text-sm text-gray-500">অপেক্ষমাণ আবেদন</p>
                <h3 className="text-2xl font-bold text-gray-800">{students.filter(s => s.status === 'pending').length}</h3>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-purple-50 p-3 rounded-full text-purple-600"><School className="w-6 h-6" /></div>
            <div>
                <p className="text-sm text-gray-500">মোট শাখা</p>
                <h3 className="text-2xl font-bold text-gray-800">২টি</h3>
            </div>
        </div>
      </div>

      {/* Filters & Content */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        
        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center gap-2 text-gray-600 font-medium">
                <Filter className="w-4 h-4" /> ফিল্টার:
            </div>
            
            <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="শাখা নির্বাচন" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">সকল শাখা</SelectItem>
                    <SelectItem value="1">হলিধানী</SelectItem>
                    <SelectItem value="2">চাঁন্দুয়ালী</SelectItem>
                </SelectContent>
            </Select>

            <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="বিভাগ নির্বাচন" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">সকল বিভাগ</SelectItem>
                    {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
            </Select>

            <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="শ্রেণি নির্বাচন" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">সকল শ্রেণি</SelectItem>
                    {deptFilter !== "all" 
                        ? classesByDept[deptFilter]?.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)
                        : Object.values(classesByDept).flat().filter((v, i, a) => a.indexOf(v) === i).map((c: any) => <SelectItem key={c} value={c}>{c}</SelectItem>)
                    }
                </SelectContent>
            </Select>

            <Button 
                variant="ghost" 
                onClick={() => { setBranchFilter("all"); setDeptFilter("all"); setClassFilter("all"); }}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
                রিসেট
            </Button>
        </div>

        {/* Tabs for Active/Pending */}
        <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
                <TabsTrigger value="active" className="flex items-center gap-2">
                    <ListFilter className="w-4 h-4" /> শিক্ষার্থী তালিকা ({activeStudents.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> অপেক্ষমাণ ({pendingStudents.length})
                </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>
                ) : (
                    <StudentTable 
                        data={activeStudents} 
                        onEdit={handleEdit} 
                        onDelete={handleDelete}
                        onBulkDelete={handleBulkDelete}
                    />
                )}
            </TabsContent>

            <TabsContent value="pending">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>
                ) : pendingStudents.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                        কোনো অপেক্ষমাণ শিক্ষার্থী নেই
                    </div>
                ) : (
                    <StudentTable 
                        data={pendingStudents} 
                        onEdit={handleEdit} 
                        onDelete={handleDelete}
                        onBulkDelete={handleBulkDelete}
                    />
                )}
            </TabsContent>
        </Tabs>

      </div>

      {/* Form Modal */}
      <StudentForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen}
        student={editingStudent}
        onSuccess={fetchStudents}
      />

    </div>
  );
}
