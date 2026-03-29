"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  GraduationCap,
  Loader2,
  School,
} from "lucide-react";
import Link from "next/link";

export default function AttendanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear().toString());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [classes, setClasses] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<Record<string, number>>({});

  async function fetchBranches() {
    const { data } = await supabase.from("branches").select("*").order("id");
    if (data && data.length > 0) {
      setBranches(data);
      setSelectedBranch((prev) => prev || String(data[0].id));
    }
    setLoading(false);
  }

  async function fetchData() {
    if (!selectedBranch) return;
    setLoading(true);

    const { data: classData } = await supabase
      .from("academic_classes")
      .select("id, name, department")
      .eq("branch_id", selectedBranch)
      .eq("academic_year", parseInt(currentYear, 10))
      .eq("is_active", true)
      .order("name");

    const { data: attendanceData } = await supabase
      .from("attendance")
      .select("class_id")
      .eq("date", selectedDate)
      .eq("branch_id", selectedBranch);

    setClasses(classData || []);

    const nextStats: Record<string, number> = {};
    attendanceData?.forEach((item: any) => {
      nextStats[item.class_id] = (nextStats[item.class_id] || 0) + 1;
    });
    setAttendanceStats(nextStats);
    setLoading(false);
  }

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedBranch, currentYear, selectedDate]);

  return (
    <div className="space-y-8 p-4 font-[Kalpurush] md:p-6">
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-white p-6 shadow-sm md:flex-row md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            <CalendarCheck className="h-7 w-7 text-green-600" /> হাজিরা ব্যবস্থাপনা
          </h1>
          <p className="mt-1 text-sm text-gray-500">তারিখ অনুযায়ী সাধারণ হাজিরা নিন</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="h-10 cursor-pointer rounded-lg border bg-gray-50 px-3 font-medium outline-none focus:bg-white focus:ring-2 focus:ring-green-500"
          />
          <input
            type="number"
            value={currentYear}
            onChange={(event) => setCurrentYear(event.target.value)}
            className="h-10 w-20 rounded-lg border bg-gray-50 px-2 text-center font-bold outline-none focus:bg-white"
            placeholder="Year"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex gap-1 rounded-xl border bg-white p-1 shadow-sm">
          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => setSelectedBranch(String(branch.id))}
              className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold transition-all ${
                selectedBranch === String(branch.id)
                  ? "bg-green-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <School className="h-4 w-4" /> {branch.name}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        বিষয়ভিত্তিক হাজিরা এখনো এই database schema-তে সক্রিয় নয়। আপাতত সাধারণ হাজিরা ব্যবহার করুন।
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-green-600" />
        </div>
      ) : classes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed bg-gray-50 py-20 text-center text-gray-400">
          <p>এই শাখায় কোনো ক্লাস পাওয়া যায়নি।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => {
            const isAttendanceTaken = (attendanceStats[cls.id] || 0) > 0;

            return (
              <div
                key={cls.id}
                className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-all ${
                  isAttendanceTaken ? "border-green-200" : "border-gray-200"
                }`}
              >
                <div className="p-5 pb-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{cls.name}</h3>
                      <p className="mt-1 w-fit rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        {cls.department}
                      </p>
                    </div>
                    <div
                      className={`rounded-full p-2 ${
                        isAttendanceTaken ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <GraduationCap className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
                    {isAttendanceTaken ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                        <CheckCircle2 className="h-3 w-3" /> সাধারণ হাজিরা সম্পন্ন
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-orange-500">
                        <AlertCircle className="h-3 w-3" /> সাধারণ হাজিরা বাকি
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/academic/branches/${selectedBranch}/${cls.id}/attendance?date=${selectedDate}&type=general`}
                  >
                    <Button
                      className={`h-9 w-full text-sm font-bold ${
                        isAttendanceTaken
                          ? "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {isAttendanceTaken ? "হাজিরা দেখুন" : "সাধারণ হাজিরা নিন"}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
