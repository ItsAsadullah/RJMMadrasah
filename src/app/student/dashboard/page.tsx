"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { 
  Bell, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Download, 
  FileText, 
  GraduationCap, 
  LayoutDashboard, 
  Loader2, 
  LogOut, 
  Menu, 
  MessageSquare, 
  Moon, 
  Sun, 
  User, 
  X,
  AlertCircle,
  Coffee,
  Gamepad2
} from "lucide-react";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- Types ---
type Student = {
  id: string;
  student_id: string;
  name_bn: string;
  class_name: string;
  roll_no: string;
  branch_id: number;
  photo_url: string;
  father_name_bn: string;
};

type Routine = {
  id: string;
  start_time: string;
  end_time: string;
  activity_type: string;
  description: string;
  subject?: { name: string };
  teacher?: { name: string };
};

type Notice = {
  id: string;
  title: string;
  created_at: string;
  type: string;
};

type Transaction = {
  id: string;
  amount: number;
  description: string;
  transaction_date: string;
  status: string;
};

type Result = {
  exam_name: string;
  marks: number;
  total_marks: number;
  grade: string;
  subject_name: string;
};

// --- Helper Functions ---
const toBengaliNumber = (num: string | number) => {
  if (!num && num !== 0) return "";
  const english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const bengali = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (char) => bengali[parseInt(char)]);
};

const getHijriDate = () => {
    return "১৪৪৬ হিজরি"; 
};

export default function StudentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Feature States
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [currentActivity, setCurrentActivity] = useState<Routine | null>(null);
  const [nextActivity, setNextActivity] = useState<Routine | null>(null);
  
  const [financials, setFinancials] = useState({ due: 0, paid: 0, lastPayment: null as string | null, history: [] as Transaction[] });
  const [latestResult, setLatestResult] = useState<Result[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, late: 0, percentage: 0 });
  const [notices, setNotices] = useState<Notice[]>([]);
  
  // Leave Application Modal
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ from: "", to: "", reason: "" });
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchStudentData();
  }, []);

  useEffect(() => {
    if (student?.id) {
        fetchLeaveHistory();
    }
  }, [student?.id, isLeaveModalOpen]);

  const fetchLeaveHistory = async () => {
      if (!student?.id) return;
      const { data } = await supabase.from("leave_applications")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false });
      if (data) setLeaveHistory(data);
  };

  // Live Status Timer
  useEffect(() => {
    if (routines.length > 0) {
      updateLiveStatus();
      const interval = setInterval(updateLiveStatus, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [routines]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
        // 1. Identify Student
        // Check local storage session first
        const sessionStr = localStorage.getItem("student_portal_session");
        let studentIdToFetch = null;

        if (sessionStr) {
            const session = JSON.parse(sessionStr);
            studentIdToFetch = session.id;
        } else {
            // Fallback to Supabase Auth (for Admins testing as student)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                 const { data } = await supabase.from("students").select("id").eq("id", user.id).single();
                 if(data) studentIdToFetch = data.id;
            }
        }

        if (!studentIdToFetch) {
            // If no session found, redirect to login
            router.push("/student/login");
            return;
        }

        // Fetch Full Student Data
        const { data: studentData, error } = await supabase
            .from("students")
            .select("*")
            .eq("id", studentIdToFetch)
            .single();

        if (error || !studentData) {
            console.error("Student not found", error);
            // If ID is invalid (maybe deleted), clear session
            localStorage.removeItem("student_portal_session");
            router.push("/student/login");
            return;
        }

        setStudent(studentData);

        // 2. Fetch Routines (For Today)
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const today = days[new Date().getDay()];
        
        const { data: classData } = await supabase.from("academic_classes")
            .select("id")
            .eq("name", studentData.class_name)
            .eq("branch_id", studentData.branch_id)
            .single();
        
        if (classData) {
            const { data: rData } = await supabase.from("routines")
                .select(`
                    id, start_time, end_time, activity_type, description,
                    academic_subjects (name),
                    teachers (name)
                `)
                .eq("class_id", classData.id)
                .eq("day_of_week", today)
                .order("start_time", { ascending: true });
            
            if (rData) {
                const formattedRoutines = rData.map((r: any) => ({
                    id: r.id,
                    start_time: r.start_time,
                    end_time: r.end_time,
                    activity_type: r.activity_type,
                    description: r.description,
                    subject: r.academic_subjects,
                    teacher: r.teachers
                }));
                setRoutines(formattedRoutines);
            }
        }

        // 3. Fetch Financials
        // Dues - Try with UUID first, then fallback to Student ID
        let dueAmount = 0;
        let paidHistory: any[] = [];
        let totalPaidAmount = 0;

        // Try fetching by UUID
        const { data: dueDataUUID } = await supabase.from("payments")
            .select("amount")
            .eq("student_id", studentData.id)
            .eq("status", "due");
        
        if (dueDataUUID && dueDataUUID.length > 0) {
            dueAmount = dueDataUUID.reduce((sum, item) => sum + item.amount, 0);
        } else {
             // Fallback to Readable ID
             const { data: dueDataID } = await supabase.from("payments")
                .select("amount")
                .eq("student_id", studentData.student_id)
                .eq("status", "due");
             dueAmount = dueDataID?.reduce((sum, item) => sum + item.amount, 0) || 0;
        }

        // Paid History
        const { data: paidDataUUID } = await supabase.from("payments")
            .select("*")
            .eq("student_id", studentData.id)
            .eq("status", "paid")
            .order("payment_date", { ascending: false });

        if (paidDataUUID && paidDataUUID.length > 0) {
            paidHistory = paidDataUUID;
        } else {
            const { data: paidDataID } = await supabase.from("payments")
                .select("*")
                .eq("student_id", studentData.student_id)
                .eq("status", "paid")
                .order("payment_date", { ascending: false });
            paidHistory = paidDataID || [];
        }
        
        // Total Paid
        totalPaidAmount = paidHistory.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

        setFinancials({
            due: dueAmount,
            paid: totalPaidAmount,
            lastPayment: paidHistory.length > 0 ? paidHistory[0].payment_date : null,
            history: paidHistory.slice(0, 5)
        });

        // 4. Fetch Results (Latest Exam)
        const { data: examData } = await supabase.from("exams").select("title").order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (examData) {
            const { data: resData } = await supabase.from("results")
                .select("*")
                .eq("student_id", studentData.id) 
                .eq("exam_name", examData.title);
            
            if (!resData || resData.length === 0) {
                 const { data: resData2 } = await supabase.from("results")
                .select("*")
                .eq("student_id", studentData.student_id)
                .eq("exam_name", examData.title);
                if(resData2) setLatestResult(resData2);
            } else {
                setLatestResult(resData);
            }
        }

        // 5. Fetch Attendance (Current Month)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const { data: attData } = await supabase.from("attendance")
            .select("status")
            .eq("student_id", studentData.id)
            .gte("date", startOfMonth);
        
        const totalDays = 26; // Approx working days
        const presentCount = attData?.length || 0; 
        setAttendanceStats({
            present: presentCount,
            absent: Math.max(0, totalDays - presentCount),
            late: 0,
            percentage: Math.round((presentCount / totalDays) * 100)
        });

        // 6. Fetch Notices
        const { data: noticeData } = await supabase.from("notices")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(3);
        if (noticeData) setNotices(noticeData);

    } catch (err) {
        console.error("Error fetching dashboard data:", err);
    } finally {
        setLoading(false);
    }
  };

  const updateLiveStatus = () => {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

      let current = null;
      let next = null;

      for (const routine of routines) {
          const [startH, startM] = routine.start_time.split(':').map(Number);
          const [endH, endM] = routine.end_time.split(':').map(Number);
          
          const start = startH * 60 + startM;
          const end = endH * 60 + endM;

          if (currentTime >= start && currentTime < end) {
              current = routine;
          } else if (currentTime < start && !next) {
              next = routine;
          }
      }
      
      setCurrentActivity(current);
      setNextActivity(next);
  };

  const handleLogout = () => {
      localStorage.removeItem("student_portal_session");
      router.push("/student/login");
  };

  const handleLeaveSubmit = async () => {
      if(!leaveForm.from || !leaveForm.to || !leaveForm.reason) return alert("সব তথ্য পূরণ করুন");
      setIsSubmittingLeave(true);
      
      const { error } = await supabase.from("leave_applications").insert([{
          student_id: student?.id,
          from_date: leaveForm.from,
          to_date: leaveForm.to,
          reason: leaveForm.reason
      }]);

      if (error) {
          alert("আবেদন জমা দেওয়া যায়নি: " + error.message);
      } else {
          alert("আবেদন সফলভাবে জমা হয়েছে!");
          setLeaveForm({ from: "", to: "", reason: "" });
          fetchLeaveHistory();
          // Keep modal open to show history or close it? Let's keep open and switch tab if possible, or just close.
          // User might want to check status immediately.
      }
      setIsSubmittingLeave(false);
  };

  // --- Components ---

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-10 h-10 text-green-600 animate-spin" /></div>;
  }

  if (!student) {
      return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 font-[Kalpurush] pb-20">
      
      {/* 1. Header & Profile */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 overflow-hidden border border-green-200">
                      {student.photo_url ? (
                          <img src={student.photo_url} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                          <div className="h-full w-full flex items-center justify-center text-green-700 font-bold">{student.name_bn[0]}</div>
                      )}
                  </div>
                  <div>
                      <h1 className="text-lg font-bold text-gray-800 leading-tight">{student.name_bn}</h1>
                      <p className="text-xs text-gray-500">ID: {toBengaliNumber(student.student_id)} | Class: {student.class_name}</p>
                  </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-green-700">{format(new Date(), "dd MMMM yyyy", { locale: bn })}</p>
                    <p className="text-xs text-gray-500">{getHijriDate()}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500 hover:bg-red-50" title="লগআউট">
                    <LogOut className="w-5 h-5" />
                </Button>
              </div>
          </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          
          {/* 2. Live Status Widget (CRITICAL) */}
          <Card className="border-none shadow-md bg-gradient-to-r from-green-600 to-green-700 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Clock className="w-32 h-32" />
              </div>
              <CardContent className="p-6 relative z-10">
                  <div className="flex justify-between items-start">
                      <div>
                          <div className="flex items-center gap-2 mb-2">
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                              </span>
                              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">Live Now</span>
                          </div>
                          
                          {currentActivity ? (
                              <div className="space-y-1">
                                  <h2 className="text-2xl md:text-3xl font-bold">
                                      {currentActivity.activity_type === 'class' ? currentActivity.subject?.name : currentActivity.description || "বিরতি"}
                                  </h2>
                                  <p className="text-green-100 text-sm md:text-base flex items-center gap-2">
                                      <Clock className="w-4 h-4" /> 
                                      {format(new Date(`2000-01-01T${currentActivity.start_time}`), "hh:mm a")} - {format(new Date(`2000-01-01T${currentActivity.end_time}`), "hh:mm a")}
                                  </p>
                                  {currentActivity.teacher && (
                                      <p className="text-xs text-green-200 mt-1">শিক্ষক: {currentActivity.teacher.name}</p>
                                  )}
                              </div>
                          ) : (
                              <div>
                                  <h2 className="text-2xl font-bold">এখন কোনো ক্লাস নেই</h2>
                                  <p className="text-green-100">বিরতি বা ছুটির সময়</p>
                              </div>
                          )}
                      </div>

                      {nextActivity && (
                          <div className="text-right hidden md:block bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                              <p className="text-xs text-green-200 uppercase mb-1">পরবর্তী ক্লাস</p>
                              <p className="font-bold">{nextActivity.activity_type === 'class' ? nextActivity.subject?.name : nextActivity.description}</p>
                              <p className="text-xs">{format(new Date(`2000-01-01T${nextActivity.start_time}`), "hh:mm a")}</p>
                          </div>
                      )}
                  </div>
              </CardContent>
          </Card>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* 3. Financials */}
              <Card>
                  <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="w-5 h-5 text-purple-600"/> ফিন্যান্সিয়াল অবস্থা</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-center">
                              <p className="text-xs text-gray-500">মোট বকেয়া</p>
                              <p className="text-xl font-bold text-red-600">৳ {toBengaliNumber(financials.due)}</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center">
                              <p className="text-xs text-gray-500">মোট পরিশোধ</p>
                              <p className="text-xl font-bold text-green-600">৳ {toBengaliNumber(financials.paid)}</p>
                          </div>
                      </div>
                      
                      <div>
                          <p className="text-xs font-bold text-gray-500 mb-2 uppercase">সর্বশেষ লেনদেন</p>
                          <div className="space-y-2">
                              {financials.history.length === 0 ? (
                                  <p className="text-xs text-gray-400 text-center py-2">কোনো লেনদেন পাওয়া যায়নি</p>
                              ) : (
                                  financials.history.slice(0, 3).map((t: any) => (
                                      <div key={t.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 last:border-0">
                                          <div>
                                              <p className="font-medium text-gray-700">{t.title}</p>
                                              <p className="text-[10px] text-gray-400">{format(new Date(t.payment_date), "dd MMM yyyy", { locale: bn })}</p>
                                          </div>
                                          <span className="font-bold text-green-600">+৳{toBengaliNumber(t.amount)}</span>
                                      </div>
                                  ))
                              )}
                          </div>
                      </div>

                      <Button className="w-full bg-purple-600 hover:bg-purple-700 h-9 text-sm">পেমেন্ট করুন</Button>
                  </CardContent>
              </Card>

              {/* 4. Academic Result */}
              <Card>
                  <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2"><GraduationCap className="w-5 h-5 text-blue-600"/> পরীক্ষার ফলাফল</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      {latestResult.length > 0 ? (
                          <>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                                <p className="text-sm font-bold text-blue-800">{latestResult[0].exam_name}</p>
                                <div className="flex justify-center items-end gap-2 mt-2">
                                    <span className="text-4xl font-black text-blue-600">
                                        {((latestResult.reduce((a, b) => a + b.marks, 0) / latestResult.reduce((a, b) => a + b.total_marks, 0)) * 5).toFixed(2)}
                                    </span>
                                    <span className="text-sm text-gray-500 mb-1 font-bold">GPA</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">মোট প্রাপ্ত নম্বর: {toBengaliNumber(latestResult.reduce((a, b) => a + b.marks, 0))}</p>
                            </div>
                            
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-500 mb-2 uppercase">বিষয়ভিত্তিক গ্রেড</p>
                                {latestResult.slice(0, 3).map((res, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                                        <span className="text-gray-700">{res.subject_name}</span>
                                        <Badge variant={res.grade === 'F' ? 'destructive' : 'default'} className="h-5 text-[10px]">{res.grade}</Badge>
                                    </div>
                                ))}
                            </div>
                            
                            <Link href="/result" className="block">
                                <Button variant="outline" className="w-full h-9 text-sm border-blue-200 text-blue-700 hover:bg-blue-50">
                                    <Download className="w-4 h-4 mr-2"/> মার্কশিট ডাউনলোড
                                </Button>
                            </Link>
                          </>
                      ) : (
                          <div className="text-center py-10 text-gray-400">
                              <FileText className="w-12 h-12 mx-auto mb-2 opacity-20"/>
                              <p>কোনো ফলাফল পাওয়া যায়নি</p>
                          </div>
                      )}
                  </CardContent>
              </Card>

              {/* 5. Attendance */}
              <Card>
                  <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-orange-600"/> উপস্থিতি</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="flex items-center justify-between mb-4">
                          <div>
                              <p className="text-3xl font-bold text-gray-800">{toBengaliNumber(attendanceStats.percentage)}%</p>
                              <p className="text-xs text-gray-500">এই মাসে উপস্থিতি</p>
                          </div>
                          <div className="h-16 w-16 relative">
                              {/* Simple Circular Progress Placeholder */}
                              <svg className="w-full h-full transform -rotate-90">
                                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-orange-500" strokeDasharray={175} strokeDashoffset={175 - (175 * attendanceStats.percentage) / 100} strokeLinecap="round" />
                              </svg>
                          </div>
                      </div>
                      
                      {/* Mini Heatmap Visualization */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                          {Array.from({ length: 30 }).map((_, i) => (
                              <div 
                                key={i} 
                                className={`h-2 w-2 rounded-full ${i < attendanceStats.present ? 'bg-green-500' : 'bg-red-200'}`}
                                title={`Day ${i+1}: ${i < attendanceStats.present ? 'Present' : 'Absent'}`}
                              ></div>
                          ))}
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500 justify-center">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> উপস্থিত ({toBengaliNumber(attendanceStats.present)})</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-200"></span> অনুপস্থিত ({toBengaliNumber(attendanceStats.absent)})</span>
                      </div>
                  </CardContent>
              </Card>

              {/* 6. Notice Board */}
              <Card className="md:col-span-2 lg:col-span-1">
                  <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2"><Bell className="w-5 h-5 text-yellow-600"/> নোটিশ বোর্ড</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                      {notices.length === 0 ? (
                          <p className="text-center text-gray-400 py-4">কোনো নোটিশ নেই</p>
                      ) : (
                          notices.map((notice) => (
                              <div key={notice.id} className="p-3 rounded-lg bg-yellow-50 border border-yellow-100 hover:bg-yellow-100 transition-colors cursor-pointer">
                                  <div className="flex justify-between items-start">
                                      <h4 className="font-bold text-gray-800 text-sm line-clamp-2">{notice.title}</h4>
                                      <span className="text-[10px] text-gray-500 bg-white px-1 rounded whitespace-nowrap ml-2">
                                          {format(new Date(notice.created_at), "dd MMM", { locale: bn })}
                                      </span>
                                  </div>
                              </div>
                          ))
                      )}
                      <Link href="/notice" className="block text-center text-xs text-blue-600 hover:underline font-bold mt-2">
                          সকল নোটিশ দেখুন
                      </Link>
                  </CardContent>
              </Card>
              
              {/* 7. Leave Application Action */}
              <Card className="md:col-span-2 lg:col-span-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none">
                  <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div>
                          <h3 className="text-xl font-bold">ছুটির আবেদন করবেন?</h3>
                          <p className="text-blue-100 text-sm">অসুস্থতা বা জরুরি প্রয়োজনে অনলাইনে ছুটির আবেদন করুন।</p>
                      </div>
                      <Button onClick={() => setIsLeaveModalOpen(true)} className="bg-white text-blue-600 hover:bg-blue-50 font-bold shadow-lg">
                          <FileText className="w-4 h-4 mr-2"/> আবেদন করুন
                      </Button>
                  </CardContent>
              </Card>

          </div>
      </div>

      {/* Leave Application Modal */}
      <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                  <DialogTitle>ছুটির আবেদন</DialogTitle>
                  <DialogDescription>নতুন আবেদন করুন অথবা পূর্বের আবেদনের অবস্থা দেখুন।</DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="apply" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="apply">নতুন আবেদন</TabsTrigger>
                    <TabsTrigger value="history">আবেদনের ইতিহাস</TabsTrigger>
                </TabsList>
                
                <TabsContent value="apply" className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-bold">হতে</label>
                            <Input type="date" value={leaveForm.from} onChange={e => setLeaveForm({...leaveForm, from: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-bold">পর্যন্ত</label>
                            <Input type="date" value={leaveForm.to} onChange={e => setLeaveForm({...leaveForm, to: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-bold">কারণ</label>
                        <Textarea 
                            placeholder="ছুটির কারণ বিস্তারিত লিখুন..." 
                            value={leaveForm.reason} 
                            onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})}
                        />
                    </div>
                    <div className="pt-2 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsLeaveModalOpen(false)}>বন্ধ করুন</Button>
                        <Button onClick={handleLeaveSubmit} disabled={isSubmittingLeave} className="bg-blue-600 hover:bg-blue-700">
                            {isSubmittingLeave ? <Loader2 className="animate-spin w-4 h-4"/> : "জমা দিন"}
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="max-h-[300px] overflow-y-auto">
                    {leaveHistory.length === 0 ? (
                        <p className="text-center text-gray-400 py-10">কোনো আবেদনের ইতিহাস নেই</p>
                    ) : (
                        <div className="space-y-3">
                            {leaveHistory.map((leave) => (
                                <div key={leave.id} className="border p-3 rounded-lg bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-sm">
                                                {format(new Date(leave.from_date), "dd MMM")} - {format(new Date(leave.to_date), "dd MMM yyyy")}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">{leave.reason}</p>
                                        </div>
                                        <Badge className={
                                            leave.status === 'approved' ? 'bg-green-600' : 
                                            leave.status === 'rejected' ? 'bg-red-600' : 'bg-yellow-500 text-black'
                                        }>
                                            {leave.status === 'approved' ? 'অনুমোদিত' : 
                                             leave.status === 'rejected' ? 'বাতিল' : 'অপেক্ষমান'}
                                        </Badge>
                                    </div>
                                    {leave.admin_remark && (
                                        <div className="mt-2 text-xs bg-white p-2 rounded border">
                                            <span className="font-bold text-gray-600">অ্যাডমিন মন্তব্য: </span>
                                            {leave.admin_remark}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
              </Tabs>
          </DialogContent>
      </Dialog>

    </div>
  );
}
