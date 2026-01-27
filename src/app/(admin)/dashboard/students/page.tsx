"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Eye, CheckCircle, XCircle, Loader2, Users, School, Filter, Download
} from "lucide-react";
import Link from "next/link";
import { departments, classesByDept } from "@/data/bangladesh-data";

type Student = {
  id: string;
  name_bn: string;
  class_name: string;
  department: string;
  father_mobile: string;
  status: string;
  created_at: string;
  branch_id: number;
  photo_url: string;
  birth_reg_no: string;
  academic_year: number;
};

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState("");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    fetchStudents();
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

  // --- Filtering Logic ---
  const filteredStudents = students.filter(student => {
    const matchName = student.name_bn.toLowerCase().includes(filterName.toLowerCase()) || 
                      student.birth_reg_no?.includes(filterName) ||
                      student.father_mobile?.includes(filterName);
    const matchBranch = filterBranch === "all" || student.branch_id.toString() === filterBranch;
    const matchClass = filterClass === "all" || student.class_name === filterClass;
    const matchYear = !student.academic_year || student.academic_year.toString() === filterYear;

    return matchName && matchBranch && matchClass && matchYear;
  });

  const activeStudents = filteredStudents.filter(s => s.status === 'active');
  const pendingStudents = students.filter(s => s.status === 'pending'); // পেন্ডিং সবার দেখার জন্য গ্লোবাল ফিল্টার বাদ দেওয়া হলো

  // --- Statistics Calculation ---
  const getBranchStats = (branchId: number) => {
    return students.filter(s => s.branch_id === branchId && s.status === 'active' && (!s.academic_year || s.academic_year.toString() === filterYear)).length;
  };

  // ক্লাস অনুযায়ী গ্রুপিং
  const classStats = activeStudents.reduce((acc: any, curr) => {
    const cls = curr.class_name || "অনির্ধারিত";
    if (!acc[cls]) acc[cls] = 0;
    acc[cls]++;
    return acc;
  }, {});

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;
  }

  return (
    <div className="space-y-6">
      
      {/* হেডার এবং পরিসংখ্যান কার্ড */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-600" /> শিক্ষার্থী ব্যবস্থাপনা
          </h1>
          <p className="text-sm text-gray-500">শিক্ষাবর্ষ: {filterYear}</p>
        </div>
        
        <Link href="/dashboard/students/add">
            <Button className="bg-green-600 hover:bg-green-700">
                নতুন শিক্ষার্থী ভর্তি করুন
            </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-full text-blue-600"><Users className="w-6 h-6" /></div>
            <div>
                <p className="text-sm text-gray-500">মোট শিক্ষার্থী ({filterYear})</p>
                <h3 className="text-2xl font-bold text-gray-800">{activeStudents.length} জন</h3>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-purple-50 p-3 rounded-full text-purple-600"><School className="w-6 h-6" /></div>
            <div>
                <p className="text-sm text-gray-500">হলিধানী শাখা</p>
                <h3 className="text-2xl font-bold text-gray-800">{getBranchStats(1)} জন</h3>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-orange-50 p-3 rounded-full text-orange-600"><School className="w-6 h-6" /></div>
            <div>
                <p className="text-sm text-gray-500">চাঁন্দুয়ালী শাখা</p>
                <h3 className="text-2xl font-bold text-gray-800">{getBranchStats(2)} জন</h3>
            </div>
        </div>
      </div>

      {/* ট্যাবস: ওভারভিউ, লিস্ট, এবং পেন্ডিং */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[500px] mb-6">
          <TabsTrigger value="overview">শ্রেণিভিত্তিক তথ্য</TabsTrigger>
          <TabsTrigger value="list">শিক্ষার্থী তালিকা</TabsTrigger>
          <TabsTrigger value="pending">
             অপেক্ষমাণ আবেদন 
             {pendingStudents.length > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-2 rounded-full">{pendingStudents.length}</span>}
          </TabsTrigger>
        </TabsList>

        {/* --- ১. ওভারভিউ ট্যাব --- */}
        <TabsContent value="overview">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Filter className="w-4 h-4" /> শ্রেণিভিত্তিক শিক্ষার্থীর সংখ্যা ({filterYear})
                </h3>
                
                {Object.keys(classStats).length === 0 ? (
                    <p className="text-center py-10 text-gray-400">এই বছরে কোনো শিক্ষার্থী পাওয়া যায়নি।</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(classStats).map(([cls, count]: any) => (
                            <div key={cls} className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                                <h4 className="text-lg font-bold text-gray-800">{cls}</h4>
                                <p className="text-sm text-green-600 font-medium">{count} জন</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </TabsContent>

        {/* --- ২. শিক্ষার্থী তালিকা ট্যাব --- */}
        <TabsContent value="list" className="space-y-4">
            
            {/* ফিল্টার বার */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/4 space-y-1">
                    <label className="text-xs font-bold text-gray-500">নাম / আইডি / মোবাইল</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input 
                            placeholder="খুঁজুন..." 
                            className="pl-9" 
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                        />
                    </div>
                </div>
                <div className="w-full md:w-1/6 space-y-1">
                    <label className="text-xs font-bold text-gray-500">শিক্ষাবর্ষ</label>
                    <Input 
                        type="number" 
                        value={filterYear} 
                        onChange={(e) => setFilterYear(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-1/6 space-y-1">
                    <label className="text-xs font-bold text-gray-500">শাখা</label>
                    <select 
                        className="w-full h-10 px-3 border rounded-md bg-white text-sm"
                        value={filterBranch}
                        onChange={(e) => setFilterBranch(e.target.value)}
                    >
                        <option value="all">সকল শাখা</option>
                        <option value="1">হলিধানী</option>
                        <option value="2">চাঁন্দুয়ালী</option>
                    </select>
                </div>
                <div className="w-full md:w-1/6 space-y-1">
                    <label className="text-xs font-bold text-gray-500">শ্রেণি</label>
                    <select 
                        className="w-full h-10 px-3 border rounded-md bg-white text-sm"
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                    >
                        <option value="all">সকল শ্রেণি</option>
                        {Object.values(classesByDept).flat().map((c, i) => (
                            <option key={i} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
                <div className="w-full md:w-auto">
                    <Button variant="outline" onClick={() => { setFilterBranch("all"); setFilterClass("all"); setFilterName(""); }} className="w-full">
                        রিসেট
                    </Button>
                </div>
            </div>

            {/* টেবিল */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>নাম ও আইডি</TableHead>
                            <TableHead>শাখা ও শ্রেণি</TableHead>
                            <TableHead>অভিভাবকের মোবাইল</TableHead>
                            <TableHead>স্ট্যাটাস</TableHead>
                            <TableHead className="text-right">পদক্ষেপ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activeStudents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-gray-400">কোনো শিক্ষার্থী পাওয়া যায়নি</TableCell>
                            </TableRow>
                        ) : (
                            activeStudents.map((student) => (
                                <TableRow key={student.id} className="hover:bg-gray-50">
                                    <TableCell className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden border">
                                            {student.photo_url ? (
                                                <img src={student.photo_url} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold">{student.name_bn[0]}</div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{student.name_bn}</p>
                                            <p className="text-xs text-gray-500 font-mono">Reg: {student.birth_reg_no || "N/A"}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            <span className="font-medium text-gray-700">{student.class_name}</span>
                                            <br />
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 rounded-full">
                                                {student.branch_id === 1 ? "হলিধানী" : "চাঁন্দুয়ালী"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-gray-600">{student.father_mobile}</TableCell>
                                    <TableCell>
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex w-fit items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Active
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/students/${student.id}`}>
                                            <Button size="sm" variant="outline">
                                                <Eye className="w-4 h-4 mr-1" /> বিস্তারিত
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

        {/* --- ৩. অপেক্ষমাণ তালিকা (Pending) --- */}
        <TabsContent value="pending">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2 text-yellow-800 text-sm font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    অনলাইন থেকে আগত আবেদনের তালিকা (যাচাই করে ভর্তি নিশ্চিত করুন)
                </div>
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>নাম</TableHead>
                            <TableHead>আবেদনের শ্রেণি</TableHead>
                            <TableHead>আবেদনের তারিখ</TableHead>
                            <TableHead className="text-right">পদক্ষেপ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pendingStudents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10 text-gray-400">কোনো অপেক্ষমাণ আবেদন নেই</TableCell>
                            </TableRow>
                        ) : (
                            pendingStudents.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-bold">{student.name_bn}</TableCell>
                                    <TableCell>{student.class_name} ({student.branch_id === 1 ? "হলিধানী" : "চাঁন্দুয়ালী"})</TableCell>
                                    <TableCell>{new Date(student.created_at).toLocaleDateString('bn-BD')}</TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/students/${student.id}`}>
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                                যাচাই করুন
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

      </Tabs>
    </div>
  );
}