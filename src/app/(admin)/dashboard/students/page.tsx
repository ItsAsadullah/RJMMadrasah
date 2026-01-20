"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"; // Shadcn টেবিল (যদি না থাকে, সাধারণ ডিভ ব্যবহার করা হবে)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, CheckCircle, XCircle, Loader2, Phone, Calendar } from "lucide-react";
import Link from "next/link";

// টাইপ ডেফিনিশন (ডাটাবেসের সাথে মিল রেখে)
type Student = {
  id: string;
  name_bn: string;
  class_name: string;
  father_mobile: string;
  status: string;
  created_at: string;
  branch_id: number;
  photo_url: string;
};

export default function StudentListPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // ১. ডাটা লোড করা
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("id, name_bn, class_name, father_mobile, status, created_at, branch_id, photo_url")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching students:", error);
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  };

  // ২. সার্চ ফিল্টার
  const filteredStudents = students.filter(student => 
    student.name_bn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.father_mobile.includes(searchTerm)
  );

  // ৩. লোডিং স্টেট
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* হেডার এবং সার্চ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">শিক্ষার্থী তালিকা</h1>
          <p className="text-sm text-gray-500">মোট আবেদন: {students.length} জন</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* মোবাইল ভিউ (কার্ড সিস্টেম - অ্যাপের মতো) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredStudents.map((student) => (
          <div key={student.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            {/* ছবি */}
            <div className="h-14 w-14 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
              {student.photo_url ? (
                <img src={student.photo_url} alt={student.name_bn} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">ছবি নেই</div>
              )}
            </div>

            {/* তথ্য */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-800 truncate">{student.name_bn}</h3>
              <p className="text-sm text-gray-500">{student.class_name} | {student.branch_id === 1 ? 'হলিধানী' : 'চাঁন্দুয়ালী'}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  student.status === 'active' ? 'bg-green-100 text-green-700' : 
                  student.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {student.status === 'active' ? 'ভর্তি সম্পন্ন' : student.status === 'pending' ? 'অপেক্ষমাণ' : 'বাতিল'}
                </span>
              </div>
            </div>

            {/* অ্যাকশন বাটন */}
            <Link href={`/dashboard/students/${student.id}`}>
              <Button size="icon" variant="ghost" className="text-gray-500 hover:text-green-600">
                <Eye className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        ))}
      </div>

      {/* ডেস্কটপ ভিউ (টেবিল সিস্টেম) */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-600">শিক্ষার্থী</th>
              <th className="p-4 text-sm font-semibold text-gray-600">ক্লাস ও শাখা</th>
              <th className="p-4 text-sm font-semibold text-gray-600">অভিভাবকের মোবাইল</th>
              <th className="p-4 text-sm font-semibold text-gray-600">আবেদনের তারিখ</th>
              <th className="p-4 text-sm font-semibold text-gray-600">স্ট্যাটাস</th>
              <th className="p-4 text-sm font-semibold text-gray-600 text-right">পদক্ষেপ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden">
                    {student.photo_url ? (
                      <img src={student.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                        {student.name_bn[0]}
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">{student.name_bn}</span>
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {student.class_name} <br />
                  <span className="text-xs text-gray-400">{student.branch_id === 1 ? 'হলিধানী শাখা' : 'চাঁন্দুয়ালী শাখা'}</span>
                </td>
                <td className="p-4 text-sm text-gray-600 font-mono">
                  {student.father_mobile}
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {new Date(student.created_at).toLocaleDateString('bn-BD')}
                </td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    student.status === 'active' ? 'bg-green-100 text-green-700' : 
                    student.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {student.status === 'active' ? 'ভর্তি সম্পন্ন' : student.status === 'pending' ? 'অপেক্ষমাণ' : 'বাতিল'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Link href={`/dashboard/students/${student.id}`}>
                    <Button variant="outline" size="sm" className="hover:bg-green-50 hover:text-green-600 border-gray-200">
                      <Eye className="h-4 w-4 mr-2" /> বিস্তারিত
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredStudents.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            কোনো শিক্ষার্থী পাওয়া যায়নি।
          </div>
        )}
      </div>
    </div>
  );
}