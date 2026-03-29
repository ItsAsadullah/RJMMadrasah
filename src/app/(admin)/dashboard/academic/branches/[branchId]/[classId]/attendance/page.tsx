"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Save,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type AttendanceStatus = "present" | "absent" | "late" | "leave";

export default function AttendancePage({
  params,
}: {
  params: Promise<{ branchId: string; classId: string }>;
}) {
  const { branchId, classId } = use(params);
  const searchParams = useSearchParams();

  const queryDate = searchParams.get("date");
  const type = searchParams.get("type") || "general";
  const subjectId = searchParams.get("subjectId");
  const isSubjectAttendanceDisabled = type === "subject";

  const [date, setDate] = useState(queryDate || new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [subjectInfo, setSubjectInfo] = useState<any>(null);

  async function fetchData() {
    setLoading(true);

    const { data: cls } = await supabase
      .from("academic_classes")
      .select("name, academic_year")
      .eq("id", classId)
      .single();

    if (cls) {
      setClassInfo(cls);

      const { data: stuData } = await supabase
        .from("students")
        .select("id, student_id, name_bn, roll_no, photo_url")
        .eq("branch_id", parseInt(branchId, 10))
        .eq("class_name", cls.name)
        .eq("academic_year", cls.academic_year)
        .eq("status", "active")
        .order("roll_no", { ascending: true });

      if (stuData) {
        setStudents(stuData);
      }
    }

    if (isSubjectAttendanceDisabled && subjectId) {
      const { data: sub } = await supabase
        .from("academic_subjects")
        .select("name")
        .eq("id", subjectId)
        .single();

      if (sub) {
        setSubjectInfo(sub);
      }

      setAttendance({});
      setRemarks({});
      setLoading(false);
      return;
    }

    const { data: attData } = await supabase
      .from("attendance")
      .select("student_id, status, remark")
      .eq("class_id", classId)
      .eq("date", date)
      .eq("branch_id", parseInt(branchId, 10));

    const nextAttendance: Record<string, AttendanceStatus> = {};
    const nextRemarks: Record<string, string> = {};

    attData?.forEach((item: any) => {
      nextAttendance[item.student_id] = item.status;
      if (item.remark) {
        nextRemarks[item.student_id] = item.remark;
      }
    });

    setAttendance(nextAttendance);
    setRemarks(nextRemarks);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [date, subjectId]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const nextAttendance: Record<string, AttendanceStatus> = {};
    students.forEach((student) => {
      nextAttendance[student.id] = status;
    });
    setAttendance(nextAttendance);
  };

  const handleSave = async () => {
    if (isSubjectAttendanceDisabled) return;

    setSaving(true);

    const payload = students
      .map((student) => ({
        student_id: student.id,
        class_id: classId,
        branch_id: parseInt(branchId, 10),
        date,
        status: attendance[student.id] || null,
        remark: remarks[student.id] || null,
      }))
      .filter((item) => item.status !== null);

    if (payload.length === 0) {
      alert("দয়া করে অন্তত একজনের হাজিরা দিন।");
      setSaving(false);
      return;
    }

    await supabase
      .from("attendance")
      .delete()
      .eq("class_id", classId)
      .eq("date", date);

    const { error } = await supabase.from("attendance").insert(payload);

    if (error) {
      alert("ত্রুটি: " + error.message);
    } else {
      alert("হাজিরা সফলভাবে সংরক্ষিত হয়েছে।");
    }

    setSaving(false);
  };

  const stats = {
    present: Object.values(attendance).filter((status) => status === "present").length,
    absent: Object.values(attendance).filter((status) => status === "absent").length,
    leave: Object.values(attendance).filter((status) => status === "leave").length,
    total: students.length,
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-white p-6 shadow-sm md:flex-row md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/dashboard/attendance" className="flex items-center gap-1 hover:text-green-600">
              <ArrowLeft className="h-3 w-3" /> ড্যাশবোর্ডে ফিরে যান
            </Link>
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            {isSubjectAttendanceDisabled ? (
              <BookOpen className="h-6 w-6 text-purple-600" />
            ) : (
              <GraduationCap className="h-6 w-6 text-green-600" />
            )}
            {classInfo?.name} - {isSubjectAttendanceDisabled ? subjectInfo?.name : "সাধারণ"} উপস্থিতি
          </h1>
          <p className="text-sm text-gray-500">তারিখ: {format(new Date(date), "dd MMMM yyyy")}</p>
        </div>

        <div className="flex items-center gap-3 rounded-lg border bg-gray-50 p-2">
          <CalendarIcon className="h-5 w-5 text-gray-500" />
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="cursor-pointer rounded border bg-white px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm md:col-span-3">
          <div className="flex gap-4 text-sm font-medium">
            <span className="rounded bg-green-50 px-2 py-1 text-green-600">উপস্থিত: {stats.present}</span>
            <span className="rounded bg-red-50 px-2 py-1 text-red-600">অনুপস্থিত: {stats.absent}</span>
            <span className="rounded bg-yellow-50 px-2 py-1 text-yellow-600">ছুটি: {stats.leave}</span>
            <span className="px-2 py-1 text-gray-600">মোট: {stats.total}</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => markAll("present")} className="text-green-600 hover:bg-green-50">
              সবাই P
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAttendance({})} className="text-gray-400">
              রিসেট
            </Button>
          </div>
        </div>
        <div className="md:col-span-1">
          <Button
            onClick={handleSave}
            disabled={saving || isSubjectAttendanceDisabled}
            className="h-full w-full bg-green-600 text-lg font-bold shadow-md hover:bg-green-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />} সংরক্ষণ
          </Button>
        </div>
      </div>

      {isSubjectAttendanceDisabled && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          বিষয়ভিত্তিক হাজিরা এখনো এই database schema-তে সক্রিয় নয়। আপাতত সাধারণ হাজিরা ব্যবহার করুন।
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="p-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-16 text-center">রোল</TableHead>
                <TableHead>শিক্ষার্থী</TableHead>
                <TableHead className="w-[250px] text-center">স্ট্যাটাস</TableHead>
                <TableHead>মন্তব্য</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow
                  key={student.id}
                  className={cn(
                    "transition-colors hover:bg-gray-50",
                    attendance[student.id] === "absent" ? "bg-red-50 hover:bg-red-100" : ""
                  )}
                >
                  <TableCell className="text-center font-mono font-bold text-gray-600">
                    {student.roll_no || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-9 w-9 overflow-hidden rounded-full border bg-gray-100">
                        {student.photo_url ? (
                          <Image src={student.photo_url} alt="" fill sizes="36px" className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-400">
                            {student.name_bn?.[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{student.name_bn}</p>
                        <p className="font-mono text-[10px] text-gray-500">{student.student_id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="mx-auto flex w-fit justify-center gap-1 rounded-lg bg-gray-100 p-1">
                      <button
                        onClick={() => handleStatusChange(student.id, "present")}
                        className={cn(
                          "h-8 w-8 rounded-md text-xs font-bold transition-all",
                          attendance[student.id] === "present"
                            ? "bg-white text-green-600 shadow-sm ring-1 ring-green-200"
                            : "text-gray-400 hover:text-green-600"
                        )}
                        title="উপস্থিত"
                      >
                        P
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, "absent")}
                        className={cn(
                          "h-8 w-8 rounded-md text-xs font-bold transition-all",
                          attendance[student.id] === "absent"
                            ? "bg-white text-red-600 shadow-sm ring-1 ring-red-200"
                            : "text-gray-400 hover:text-red-600"
                        )}
                        title="অনুপস্থিত"
                      >
                        A
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, "late")}
                        className={cn(
                          "h-8 w-8 rounded-md text-xs font-bold transition-all",
                          attendance[student.id] === "late"
                            ? "bg-white text-orange-600 shadow-sm ring-1 ring-orange-200"
                            : "text-gray-400 hover:text-orange-600"
                        )}
                        title="দেরি"
                      >
                        L
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, "leave")}
                        className={cn(
                          "h-8 w-8 rounded-md text-xs font-bold transition-all",
                          attendance[student.id] === "leave"
                            ? "bg-white text-purple-600 shadow-sm ring-1 ring-purple-200"
                            : "text-gray-400 hover:text-purple-600"
                        )}
                        title="ছুটি"
                      >
                        E
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={remarks[student.id] || ""}
                      onChange={(event) =>
                        setRemarks((prev) => ({ ...prev, [student.id]: event.target.value }))
                      }
                      className="h-9 border-gray-200 bg-white text-xs focus:border-green-500"
                      placeholder="কারণ লিখুন..."
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
