"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users, Book, ChevronLeft, ArrowRight, Eye, CheckCircle, Search, X, Filter } from "lucide-react";
import Link from "next/link";
import ClassSubjectSetup from "@/components/dashboard/academic/ClassSubjectSetup";

export default function ClassDashboard({ params }: { params: Promise<{ branchId: string, year: string, classId: string }> }) {
  const { branchId, year, classId } = use(params);
  
  const [activeTab, setActiveTab] = useState("students");
  const [classInfo, setClassInfo] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ফিল্টার স্টেট
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, pending, rejected

  useEffect(() => {
    fetchData();
  }, [classId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: cls } = await supabase.from("academic_classes").select("*, branches(name)").eq("id", classId).single();
    if (cls) {
        setClassInfo(cls);
        const { data: stu } = await supabase
            .from("students")
            .select("*")
            .eq("branch_id", parseInt(branchId))
            .eq("academic_year", parseInt(year))
            .eq("class_name", cls.name)
            // .eq("status", "active") // সব স্টুডেন্ট দেখাবো, যাতে ফিল্টার করা যায়
            .order("name_bn", { ascending: true });
        
        if (stu) setStudents(stu);
    }
    setLoading(false);
  };

  // --- ফিল্টারিং লজিক ---
  const filteredStudents = students.filter(student => {
    // ১. নাম বা মোবাইল দিয়ে সার্চ
    const matchesSearch = 
      student.name_bn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.father_mobile?.includes(searchTerm) ||
      student.birth_reg_no?.includes(searchTerm);

    // ২. স্ট্যাটাস দিয়ে ফিল্টার
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // রিসেট ফাংশন
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-6">
      
      {/* হেডার */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href={`/dashboard/academic/branches/${branchId}/year/${year}`} className="hover:text-blue-600">ক্লাস তালিকা</Link>
          <ArrowRight className="w-3 h-3" />
          <span className="font-semibold text-gray-800">{classInfo?.name}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/academic/branches/${branchId}/year/${year}`}>
                <Button variant="ghost" size="icon" className="rounded-full bg-gray-50 hover:bg-gray-100"><ChevronLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{classInfo?.name} ড্যাশবোর্ড</h1>
              <p className="text-sm text-gray-500">{classInfo?.branches?.name} | শিক্ষাবর্ষ: {year}</p>
            </div>
          </div>
          
          <Link href={`/dashboard/students/add`}> 
             <Button className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100">
                <Plus className="w-4 h-4 mr-2" /> নতুন ভর্তি
             </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="students" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
          <TabsTrigger value="students" className="gap-2"><Users className="w-4 h-4" /> শিক্ষার্থী তালিকা</TabsTrigger>
          <TabsTrigger value="subjects" className="gap-2"><Book className="w-4 h-4" /> বিষয় সেটআপ</TabsTrigger>
        </TabsList>

        {/* ট্যাব ১: শিক্ষার্থী তালিকা (ফিল্টার সহ) */}
        <TabsContent value="students" className="space-y-4">
            
            {/* --- ফিল্টার বার (নতুন যুক্ত করা হয়েছে) --- */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 gap-4 w-full md:w-auto">
                    {/* সার্চ বক্স */}
                    <div className="relative flex-1 md:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                            placeholder="নাম, মোবাইল বা রেজিঃ নম্বর খুঁজুন..." 
                            className="pl-9 bg-gray-50/50 focus:bg-white transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {/* স্ট্যাটাস ফিল্টার */}
                    <div className="w-40">
                        <select 
                            className="w-full h-10 px-3 border rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">সকল স্ট্যাটাস</option>
                            <option value="active">Active (ভর্তি)</option>
                            <option value="pending">Pending (অপেক্ষমাণ)</option>
                            <option value="rejected">Rejected (বাতিল)</option>
                        </select>
                    </div>
                </div>

                {/* ক্লিয়ার বাটন */}
                {(searchTerm || statusFilter !== "all") && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                        <Filter className="w-3 h-3 mr-2" /> ফিল্টার মুছুন
                    </Button>
                )}
            </div>

            {/* টেবিল */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 text-sm">
                        মোট শিক্ষার্থী: <span className="text-blue-600">{filteredStudents.length}</span> জন 
                        {searchTerm && ` (খোঁজা হচ্ছে: "${searchTerm}")`}
                    </h3>
                </div>
                <Table>
                    <TableHeader className="bg-white">
                        <TableRow>
                            <TableHead>নাম</TableHead>
                            <TableHead>আইডি/রেজিঃ</TableHead>
                            <TableHead>মোবাইল</TableHead>
                            <TableHead>স্ট্যাটাস</TableHead>
                            <TableHead className="text-right">অ্যাকশন</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStudents.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-400">কোনো শিক্ষার্থী পাওয়া যায়নি।</TableCell></TableRow>
                        ) : (
                            filteredStudents.map((student) => (
                                <TableRow key={student.id} className="hover:bg-gray-50">
                                    <TableCell className="font-bold text-gray-800">{student.name_bn}</TableCell>
                                    <TableCell className="font-mono text-xs">{student.birth_reg_no || "N/A"}</TableCell>
                                    <TableCell className="font-mono text-gray-600">{student.father_mobile}</TableCell>
                                    <TableCell>
                                        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded w-fit capitalize
                                            ${student.status === 'active' ? 'bg-green-50 text-green-600' : 
                                              student.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 
                                              'bg-red-50 text-red-600'}`}>
                                            {student.status === 'active' && <CheckCircle className="w-3 h-3" />} 
                                            {student.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/students/${student.id}`}>
                                            <Button size="sm" variant="outline" className="h-8"><Eye className="w-3 h-3 mr-1" /> বিস্তারিত</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </TabsContent>

        <TabsContent value="subjects">
            <ClassSubjectSetup branchId={branchId} classId={classId} />
        </TabsContent>

      </Tabs>
    </div>
  );
}


