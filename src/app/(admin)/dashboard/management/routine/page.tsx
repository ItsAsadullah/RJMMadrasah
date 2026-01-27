"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, ArrowRight, Clock, Calendar, Layers } from "lucide-react";
import Link from "next/link";

export default function RoutineManagementLanding() {
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [classLoading, setClassLoading] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch && selectedYear) {
      fetchClasses();
    } else {
        setClasses([]);
    }
  }, [selectedBranch, selectedYear]);

  const fetchBranches = async () => {
    const { data } = await supabase.from("branches").select("*");
    if (data) {
        setBranches(data);
        if(data.length > 0) setSelectedBranch(data[0].id);
    }
    setLoading(false);
  };

  const fetchClasses = async () => {
    setClassLoading(true);
    const { data } = await supabase
      .from("academic_classes")
      .select("*, academic_subjects(count), routines(count)")
      .eq("branch_id", selectedBranch)
      .eq("academic_year", parseInt(selectedYear))
      .order("name", { ascending: true });
    
    if (data) setClasses(data);
    setClassLoading(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-7 h-7 text-purple-600" /> রুটিন ম্যানেজমেন্ট
        </h1>
        <p className="text-gray-500 mt-1">ক্লাস রুটিন তৈরি বা আপডেট করতে প্রথমে শাখা ও বর্ষ নির্বাচন করুন।</p>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mt-6">
            <div className="w-full md:w-1/3 space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">শাখা</label>
                <select 
                    className="w-full h-11 border rounded-lg px-3 bg-gray-50 focus:bg-white transition-all"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                >
                    <option value="">শাখা নির্বাচন করুন</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            </div>
            <div className="w-full md:w-1/4 space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">শিক্ষাবর্ষ</label>
                <input 
                    type="number" 
                    className="w-full h-11 border rounded-lg px-3 bg-gray-50 focus:bg-white transition-all"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* Class Grid */}
      <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-700 border-b pb-2">ক্লাস তালিকা ({classes.length})</h2>
          
          {loading || classLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-600 w-10 h-10"/></div>
          ) : classes.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed text-gray-400">
                  কোনো ক্লাস পাওয়া যায়নি। অনুগ্রহ করে শাখা বা বছর পরিবর্তন করুন।
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classes.map((cls) => (
                      <Link 
                        key={cls.id} 
                        // Note: Using the specific routine path we created earlier
                        href={`/dashboard/academic/branches/${selectedBranch}/${cls.id}/routine`}
                        className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all flex flex-col justify-between"
                      >
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-purple-700 transition-colors">{cls.name}</h3>
                                  <p className="text-xs text-gray-500 font-medium">{cls.department || "সাধারণ"}</p>
                              </div>
                              <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                                  <Layers className="w-5 h-5" />
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> রুটিন: <strong>{cls.routines?.[0]?.count || 0} টি</strong></span>
                              {/* Subject count removed for simplicity or added if needed */}
                          </div>

                          <div className="flex items-center justify-between text-sm font-bold text-purple-600 mt-auto pt-4 border-t border-gray-100 group-hover:border-purple-100">
                              <span>রুটিন দেখুন</span>
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                      </Link>
                  ))}
              </div>
          )}
      </div>

    </div>
  );
}