"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users, Book, ChevronLeft, ArrowRight, Eye, CheckCircle, Search, X, Filter, CalendarCheck } from "lucide-react";
import Link from "next/link";
import ClassSubjectSetup from "@/components/dashboard/academic/ClassSubjectSetup";

export default function ClassDashboard({ params }: { params: Promise<{ branchId: string, classId: string }> }) {
  const { branchId, classId } = use(params);
  
  const [activeTab, setActiveTab] = useState("students");
  const [classInfo, setClassInfo] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ফিল্টার স্টেট
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, [classId]);

  const fetchData = async () => {
    setLoading(true);
    // ১. ক্লাসের তথ্য আনা
    const { data: cls } = await supabase.from("academic_classes").select("*, branches(name)").eq("id", classId).single();
    
    if (cls) {
        setClassInfo(cls);
        // ২. ক্লাসের নামের ভিত্তিতে স্টুডেন্ট আনা (অথবা ভবিষ্যতে class_id দিয়ে)
        const { data: stu } = await supabase
            .from("students")
            .select("*")
            .eq("branch_id", parseInt(branchId))
            .eq("class_name", cls.name)
            .eq("academic_year", cls.academic_year) // ক্লাসের সাল অনুযায়ী
            .order("roll_no", { ascending: true }); // রোল অনুযায়ী সাজানো
        
        if (stu) setStudents(stu);
    }
    setLoading(false);
  };

  // --- ফিল্টারিং লজিক ---
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      (student.name_bn?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (student.student_id?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (student.father_mobile || "").includes(searchTerm);

    const matchesStatus = statusFilter === "all" || student.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-6">
      
      {/* হেডার */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/academic/branches" className="hover:text-purple-600">শাখা</Link>
          <ArrowRight className="w-3 h-3" />
          <Link href={`/dashboard/academic/branches/${branchId}`} className="hover:text-purple-600">{classInfo?.branches?.name}</Link>
          <ArrowRight className="w-3 h-3" />
          <span className="font-semibold text-gray-800">{classInfo?.name}</span>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/academic/branches/${branchId}`}>
                <Button variant="ghost" size="icon" className="rounded-full bg-gray-50 hover:bg-gray-100"><ChevronLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{classInfo?.name} ড্যাশবোর্ড</h1>
              <p className="text-sm text-gray-500">শিক্ষাবর্ষ: {classInfo?.academic_year} | মোট শিক্ষার্থী: {students.length} জন</p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            {/* হাজিরা বাটন */}
            <Link href={`/dashboard/academic/branches/${branchId}/${classId}/attendance`} className="w-full md:w-auto"> 
               <Button className="w-full md:w-auto bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 font-semibold shadow-sm">
                  <CalendarCheck className="w-4 h-4 mr-2" /> হাজিরা খাতা
               </Button>
            </Link>
            
            <Link href={`/dashboard/students/add`} className="w-full md:w-auto"> 
               <Button className="w-full md:w-auto bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100 font-semibold">
                  <Plus className="w-4 h-4 mr-2" /> নতুন ভর্তি
               </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ট্যাব সেকশন */}
      <Tabs defaultValue="students" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="students" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"><Users className="w-4 h-4" /> শিক্ষার্থী তালিকা</TabsTrigger>
          <TabsTrigger value="subjects" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"><Book className="w-4 h-4" /> বিষয় সেটআপ</TabsTrigger>
        </TabsList>

        {/* ট্যাব ১: শিক্ষার্থী তালিকা */}
        <TabsContent value="students" className="space-y-4">
            
            {/* ফিল্টার বার */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 w-full">
                    {/* সার্চ বক্স */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                            placeholder="নাম, আইডি বা মোবাইল নম্বর খুঁজুন..." 
                            className="pl-9 bg-gray-50 focus:bg-white transition-all border-gray-200"
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
                    <div className="w-full md:w-48">
                        <select 
                            className="w-full h-10 px-3 border border-gray-200 rounded-md bg-gray-50 text-sm focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">সকল স্ট্যাটাস</option>
                            <option value="active">Active (ভর্তি)</option>
                            <option value="pending">Pending (অপেক্ষমাণ)</option>
                            <option value="rejected">Rejected (বাতিল)</option>
                        </select>
                    </div>

                     {/* ক্লিয়ার বাটন */}
                    {(searchTerm || statusFilter !== "all") && (
                        <Button variant="ghost" onClick={clearFilters} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                            <Filter className="w-4 h-4 mr-2" /> রিসেট
                        </Button>
                    )}
                </div>
            </div>

            {/* টেবিল */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 text-sm">
                        শিক্ষার্থী তালিকা <span className="text-gray-400 font-normal">({filteredStudents.length} জন)</span>
                    </h3>
                </div>
                <Table>
                    <TableHeader className="bg-white">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[80px]">রোল</TableHead>
                            <TableHead>নাম ও আইডি</TableHead>
                            <TableHead>অভিভাবকের মোবাইল</TableHead>
                            <TableHead>স্ট্যাটাস</TableHead>
                            <TableHead className="text-right">অ্যাকশন</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStudents.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-12 text-gray-400">কোনো শিক্ষার্থী পাওয়া যায়নি।</TableCell></TableRow>
                        ) : (
                            filteredStudents.map((student) => (
                                <TableRow key={student.id} className="hover:bg-gray-50/80 transition-colors">
                                    <TableCell className="font-mono font-bold text-gray-600">{student.roll_no || "-"}</TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-bold text-gray-800">{student.name_bn}</p>
                                            <p className="text-xs text-gray-500 font-mono">{student.student_id}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-gray-600 text-sm">{student.father_mobile || "N/A"}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide
                                            ${student.status === 'active' ? 'bg-green-100 text-green-700' : 
                                              student.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                                              'bg-red-100 text-red-700'}`}>
                                            {student.status === 'active' && <CheckCircle className="w-3 h-3" />} 
                                            {student.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/students/${student.id}`}>
                                            <Button size="sm" variant="outline" className="h-8 border-gray-200 hover:bg-gray-50 hover:text-purple-600 transition-colors">
                                                <Eye className="w-3 h-3 mr-1" /> বিস্তারিত
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </TabsContent>

        {/* ট্যাব ২: বিষয় সেটআপ (আলাদা কম্পোনেন্ট) */}
        <TabsContent value="subjects">
            <ClassSubjectSetup branchId={branchId} classId={classId} />
        </TabsContent>

      </Tabs>
    </div>
  );
}