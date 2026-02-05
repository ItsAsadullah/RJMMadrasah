"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CalendarCheck, Loader2, ArrowRight, CheckCircle2, AlertCircle, School, GraduationCap, BookOpen, ChevronDown, ChevronUp
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function AttendanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear().toString());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>({}); // class_id/subject_id -> count

  // Accordion State for subjects
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
        fetchData();
    }
  }, [selectedBranch, currentYear, selectedDate]);

  const fetchBranches = async () => {
    const { data } = await supabase.from("branches").select("*").order("id");
    if (data && data.length > 0) {
        setBranches(data);
        setSelectedBranch(data[0].id.toString());
    }
    setLoading(false);
  };

  const fetchData = async () => {
    setLoading(true);
    
    // ১. ক্লাস এবং বিষয় ফেচ করা
    const { data: clsData } = await supabase
        .from("academic_classes")
        .select("id, name, department")
        .eq("branch_id", selectedBranch)
        .eq("academic_year", parseInt(currentYear))
        .eq("is_active", true)
        .order("name");

    const { data: subData } = await supabase
        .from("academic_subjects")
        .select("id, name, class_id")
        .order("name");

    // ২. নির্বাচিত তারিখের হাজিরা চেক করা
    const { data: attData } = await supabase
        .from("attendance")
        .select("class_id, subject_id")
        .eq("date", selectedDate)
        .eq("branch_id", selectedBranch);

    if (clsData) {
        setClasses(clsData);
        setSubjects(subData || []);
        
        // কাউন্ট করা কোন ক্লাসে/বিষয়ে হাজিরা নেওয়া হয়েছে
        const stats: any = { general: {}, subject: {} };
        
        attData?.forEach((a: any) => {
            if (a.subject_id) {
                // বিষয়ভিত্তিক হাজিরা
                const key = `${a.class_id}-${a.subject_id}`;
                stats.subject[key] = (stats.subject[key] || 0) + 1;
            } else {
                // সাধারণ হাজিরা
                stats.general[a.class_id] = (stats.general[a.class_id] || 0) + 1;
            }
        });
        setAttendanceStats(stats);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 p-4 md:p-6 font-[Kalpurush]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <CalendarCheck className="w-7 h-7 text-green-600" /> হাজিরা ব্যবস্থাপনা
            </h1>
            <p className="text-sm text-gray-500 mt-1">তারিখ অনুযায়ী সাধারণ ও বিষয়ভিত্তিক হাজিরা নিন</p>
        </div>
        
        <div className="flex items-center gap-3">
            <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                className="h-10 border rounded-lg px-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none cursor-pointer font-medium"
            />
            <input 
                type="number" 
                value={currentYear} 
                onChange={(e) => setCurrentYear(e.target.value)} 
                className="w-20 h-10 border rounded-lg px-2 text-center font-bold bg-gray-50 focus:bg-white outline-none"
                placeholder="Year"
            />
        </div>
      </div>

      {/* Branch Selection */}
      <div className="flex justify-center">
          <div className="bg-white p-1 rounded-xl shadow-sm border inline-flex gap-1">
              {branches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBranch(b.id.toString())}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                        selectedBranch === b.id.toString() 
                        ? 'bg-green-600 text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                      <School className="w-4 h-4" /> {b.name}
                  </button>
              ))}
          </div>
      </div>

      {/* Class Grid */}
      {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-green-600"/></div>
      ) : classes.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed text-gray-400">
              <p>এই শাখায় কোনো ক্লাস পাওয়া যায়নি।</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((cls) => {
                  const isGeneralTaken = (attendanceStats.general[cls.id] || 0) > 0;
                  const classSubjects = subjects.filter(s => s.class_id === cls.id);
                  const isExpanded = expandedClass === cls.id;

                  return (
                    <div key={cls.id} className={`bg-white rounded-xl border shadow-sm transition-all group overflow-hidden ${isGeneralTaken ? 'border-green-200' : 'border-gray-200'}`}>
                        
                        {/* Card Header */}
                        <div className="p-5 pb-3">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{cls.name}</h3>
                                    <p className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded w-fit mt-1">{cls.department}</p>
                                </div>
                                <div className={`p-2 rounded-full ${isGeneralTaken ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                            </div>
                            
                            {/* General Attendance Status */}
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                {isGeneralTaken ? (
                                    <span className="text-green-600 font-bold flex items-center gap-1 text-xs">
                                        <CheckCircle2 className="w-3 h-3"/> সাধারণ হাজিরা সম্পন্ন
                                    </span>
                                ) : (
                                    <span className="text-orange-500 font-medium flex items-center gap-1 text-xs">
                                        <AlertCircle className="w-3 h-3"/> সাধারণ হাজিরা বাকি
                                    </span>
                                )}
                            </div>
                            
                            {/* General Attendance Button */}
                            <Link href={`/dashboard/academic/branches/${selectedBranch}/${cls.id}/attendance?date=${selectedDate}&type=general`}>
                                <Button className={`w-full font-bold h-9 text-sm ${isGeneralTaken ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                                    {isGeneralTaken ? "হাজিরা দেখুন" : "সাধারণ হাজিরা নিন"} 
                                </Button>
                            </Link>
                        </div>

                        {/* Subject Wise Toggle */}
                        {classSubjects.length > 0 && (
                            <div className="border-t border-gray-100 bg-gray-50/50">
                                <button 
                                    onClick={() => setExpandedClass(isExpanded ? null : cls.id)}
                                    className="w-full px-5 py-3 flex items-center justify-between text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    <span className="flex items-center gap-2"><BookOpen className="w-3 h-3"/> বিষয়ভিত্তিক হাজিরা</span>
                                    {isExpanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                                </button>
                                
                                {isExpanded && (
                                    <div className="px-3 pb-3 space-y-1 animate-in slide-in-from-top-2">
                                        {classSubjects.map(sub => {
                                            const isSubTaken = (attendanceStats.subject[`${cls.id}-${sub.id}`] || 0) > 0;
                                            return (
                                                <Link 
                                                    key={sub.id} 
                                                    href={`/dashboard/academic/branches/${selectedBranch}/${cls.id}/attendance?date=${selectedDate}&type=subject&subjectId=${sub.id}`}
                                                >
                                                    <div className="flex items-center justify-between p-2 rounded hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all cursor-pointer">
                                                        <span className="text-xs font-medium text-gray-700">{sub.name}</span>
                                                        {isSubTaken ? (
                                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                        ) : (
                                                            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                                                        )}
                                                    </div>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                  );
              })}
          </div>
      )}
    </div>
  );
}
