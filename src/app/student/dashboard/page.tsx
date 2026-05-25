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
import TranscriptPreviewModal from "@/components/academic/TranscriptPreviewModal";

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
  title: string;
  receipt_no: string;
  payment_date: string;
  status: string;
};

type Result = {
  exam_id: string;
  exam_name: string;
  class_name?: string;
  academic_year: string | number;
  created_at?: string;
  total_full_marks: number;
  total_marks_obtained: number;
  grade: string;
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
  const [historicalResults, setHistoricalResults] = useState<Result[]>([]);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewExamId, setPreviewExamId] = useState<string>("");
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, late: 0, percentage: 0 });
  const [notices, setNotices] = useState<Notice[]>([]);
  
  // Leave Application State
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
  }, [student?.id]);

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
            router.push("/login");
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
            router.push("/login");
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
            totalPaidAmount = paidDataUUID.reduce((sum, item) => sum + item.amount, 0);
        } else {
            const { data: paidDataID } = await supabase.from("payments")
                .select("*")
                .eq("student_id", studentData.student_id)
                .eq("status", "paid")
                .order("payment_date", { ascending: false });
            
            if (paidDataID) {
                paidHistory = paidDataID;
                totalPaidAmount = paidDataID.reduce((sum, item) => sum + item.amount, 0);
            }
        }

        setFinancials({
            due: dueAmount,
            paid: totalPaidAmount,
            history: paidHistory,
            lastPayment: paidHistory.length > 0 ? paidHistory[0].payment_date : null
        });

        // 4. Fetch Academic Results (Aggregated)
        // Similar logic to the Admin Profile result aggregation
        const { data: marksData } = await supabase
            .from("exam_marks")
            .select(`
                exam_id, marks_obtained, 
                exams(id, title, academic_year, created_at),
                academic_subjects(full_marks, academic_classes(name))
            `)
            .eq("student_id", studentData.student_id);

        if (marksData && marksData.length > 0) {
            const resultsByExam: Record<string, any> = {};

            marksData.forEach((mark: any) => {
                const eId = mark.exams?.id;
                if (!eId) return;

                if (!resultsByExam[eId]) {
                    resultsByExam[eId] = {
                        exam_id: eId,
                        exam_name: mark.exams?.title || "অজানা পরীক্ষা",
                        academic_year: mark.exams?.academic_year || "",
                        class_name: mark.academic_subjects?.academic_classes?.name || "",
                        created_at: mark.exams?.created_at,
                        total_obtained: 0,
                        total_full: 0,
                        marks_array: []
                    };
                }

                resultsByExam[eId].total_obtained += (mark.marks_obtained || 0);
                resultsByExam[eId].total_full += (mark.academic_subjects?.full_marks || 100);
                resultsByExam[eId].marks_array.push({ obtained: mark.marks_obtained });
            });

            const aggregatedResults = Object.values(resultsByExam).map((res: any) => {
                const percentage = res.total_full > 0 ? (res.total_obtained / res.total_full) * 100 : 0;
                let grade = 'F';
                if (percentage >= 80) grade = 'A+';
                else if (percentage >= 70) grade = 'A';
                else if (percentage >= 60) grade = 'A-';
                else if (percentage >= 50) grade = 'B';
                else if (percentage >= 40) grade = 'C';
                else if (percentage >= 33) grade = 'D';
                if (res.marks_array.some((m: any) => m.obtained < 33)) grade = 'F';

                return {
                    exam_id: res.exam_id,
                    exam_name: res.exam_name,
                    academic_year: res.academic_year,
                    class_name: res.class_name,
                    created_at: res.created_at,
                    total_marks_obtained: res.total_obtained,
                    total_full_marks: res.total_full,
                    grade: grade
                };
            });
            
            // Sort by recent created_at
            aggregatedResults.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setHistoricalResults(aggregatedResults);
        }

        // 5. Fetch Attendance (Mock logic for now, should query attendance table)
        setAttendanceStats({
            present: 19,
            absent: 4,
            late: 1,
            percentage: 82
        });

        // 6. Fetch Notices (Public and Class Specific)
        const { data: noticeData } = await supabase.from("notices")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5);
        if (noticeData) setNotices(noticeData);

    } catch (error) {
        console.error("Dashboard error:", error);
    } finally {
        setLoading(false);
    }
  };

  const updateLiveStatus = () => {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

      let current = null;
      let next = null;

      for (let i = 0; i < routines.length; i++) {
          const routine = routines[i];
          const [startHour, startMin] = routine.start_time.split(':').map(Number);
          const [endHour, endMin] = routine.end_time.split(':').map(Number);
          
          const startMins = startHour * 60 + startMin;
          const endMins = endHour * 60 + endMin;

          if (currentTime >= startMins && currentTime < endMins) {
              current = routine;
          }
          if (currentTime < startMins && !next) {
              next = routine;
          }
      }
      
      setCurrentActivity(current);
      setNextActivity(next);
  };

  const handleLogout = () => {
      localStorage.removeItem("student_portal_session");
      router.push("/login");
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
      
      {/* 1. Premium Header & Profile */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 overflow-hidden border border-green-200">
                      {student.photo_url ? (
                          <img src={student.photo_url} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                          <img src="/images/default-avatar.png" alt="Profile" className="h-full w-full object-cover" />
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
          
          <Tabs defaultValue="overview" className="w-full">
            {/* Horizontal Scrollable Tab List */}
            <div className="overflow-x-auto pb-2 mb-4 scrollbar-hide">
              <TabsList className="flex w-max min-w-full space-x-2 bg-white p-1 border border-gray-200 rounded-xl shadow-sm">
                  <TabsTrigger value="overview" className="flex-1 gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-lg px-4 py-2.5 transition-all"><LayoutDashboard className="w-4 h-4"/> ওভারভিউ</TabsTrigger>
                  <TabsTrigger value="academic" className="flex-1 gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-lg px-4 py-2.5 transition-all"><BookOpen className="w-4 h-4"/> একাডেমিক</TabsTrigger>
                  <TabsTrigger value="results" className="flex-1 gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-lg px-4 py-2.5 transition-all"><GraduationCap className="w-4 h-4"/> ফলাফল</TabsTrigger>
                  <TabsTrigger value="payments" className="flex-1 gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-lg px-4 py-2.5 transition-all"><CreditCard className="w-4 h-4"/> বেতন ও ফি</TabsTrigger>
                  <TabsTrigger value="leaves" className="flex-1 gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-lg px-4 py-2.5 transition-all"><FileText className="w-4 h-4"/> ছুটির আবেদন</TabsTrigger>
              </TabsList>
            </div>

            {/* 1. OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">
                {/* Live Status Widget */}
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

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-orange-50/50 border-orange-100">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <Calendar className="w-6 h-6 text-orange-500 mb-2"/>
                            <p className="text-2xl font-bold text-gray-800">{toBengaliNumber(attendanceStats.percentage)}%</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">এ মাসে উপস্থিতি</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-50/50 border-red-100">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <CreditCard className="w-6 h-6 text-red-500 mb-2"/>
                            <p className="text-2xl font-bold text-gray-800">৳{toBengaliNumber(financials.due)}</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">মোট বকেয়া</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-50/50 border-blue-100">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <GraduationCap className="w-6 h-6 text-blue-500 mb-2"/>
                            <p className="text-2xl font-bold text-gray-800">{toBengaliNumber(historicalResults.length)}</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">মোট পরীক্ষা</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-purple-50/50 border-purple-100">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <FileText className="w-6 h-6 text-purple-500 mb-2"/>
                            <p className="text-2xl font-bold text-gray-800">{toBengaliNumber(leaveHistory.filter(l => l.status === 'pending').length)}</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">অপেক্ষমান ছুটি</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Notices Overview */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2"><Bell className="w-5 h-5 text-yellow-600"/> সাম্প্রতিক নোটিশ</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {notices.length === 0 ? (
                            <p className="text-center text-gray-400 py-4 text-sm">কোনো নোটিশ নেই</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {notices.slice(0, 4).map((notice) => (
                                    <div key={notice.id} className="p-3 rounded-lg bg-yellow-50 border border-yellow-100 hover:bg-yellow-100 transition-colors cursor-pointer flex justify-between items-start">
                                        <h4 className="font-bold text-gray-800 text-sm line-clamp-2">{notice.title}</h4>
                                        <span className="text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded whitespace-nowrap ml-2 shadow-sm border border-yellow-100">
                                            {format(new Date(notice.created_at), "dd MMM", { locale: bn })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {notices.length > 0 && (
                            <Link href="/notice" className="block text-center text-sm text-blue-600 hover:underline font-bold mt-2">সকল নোটিশ দেখুন</Link>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* 2. ACADEMIC TAB */}
            <TabsContent value="academic" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-orange-600"/> উপস্থিতি (চলতি মাস)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="text-center">
                                <p className="text-4xl font-bold text-gray-800">{toBengaliNumber(attendanceStats.percentage)}%</p>
                                <p className="text-sm text-gray-500">মোট উপস্থিতি</p>
                            </div>
                            <div className="flex-1 w-full">
                                {/* Mini Heatmap Visualization */}
                                <div className="grid grid-cols-10 gap-2 mb-3">
                                    {Array.from({ length: 30 }).map((_, i) => (
                                        <div 
                                          key={i} 
                                          className={`h-4 w-full rounded-sm ${i < attendanceStats.present ? 'bg-green-500' : 'bg-red-200'}`}
                                          title={`Day ${i+1}: ${i < attendanceStats.present ? 'Present' : 'Absent'}`}
                                        ></div>
                                    ))}
                                </div>
                                <div className="flex gap-4 text-sm text-gray-600 font-medium">
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500"></span> উপস্থিত: {toBengaliNumber(attendanceStats.present)} দিন</span>
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-200"></span> অনুপস্থিত: {toBengaliNumber(attendanceStats.absent)} দিন</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-blue-600"/> আজকের ক্লাস রুটিন</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {routines.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg border border-gray-100">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="font-bold text-gray-700 whitespace-nowrap">সময়</TableHead>
                                            <TableHead className="font-bold text-gray-700">বিষয় / কাজ</TableHead>
                                            <TableHead className="font-bold text-gray-700">শিক্ষক</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {routines.map((r) => (
                                            <TableRow key={r.id}>
                                                <TableCell className="whitespace-nowrap font-mono text-sm">
                                                    {format(new Date(`2000-01-01T${r.start_time}`), "hh:mm a")} - {format(new Date(`2000-01-01T${r.end_time}`), "hh:mm a")}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {r.activity_type === 'class' ? r.subject?.name : (
                                                        <span className="text-gray-500 flex items-center gap-1"><Coffee className="w-4 h-4"/> {r.description || 'বিরতি'}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{r.teacher?.name || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <p className="text-center py-6 text-gray-500">আজকের কোনো রুটিন পাওয়া যায়নি।</p>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* 3. RESULTS TAB */}
            <TabsContent value="results" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-blue-600"/> সকল পরীক্ষার ফলাফল</CardTitle>
                        <CardDescription>আপনার অংশগ্রহণকৃত সকল পরীক্ষার তালিকা ও মার্কশিট</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {historicalResults.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg border border-gray-100">
                                <Table>
                                    <TableHeader className="bg-blue-50/50">
                                        <TableRow>
                                            <TableHead className="font-bold text-blue-900 min-w-[150px]">পরীক্ষার নাম</TableHead>
                                            <TableHead className="font-bold text-blue-900 text-center whitespace-nowrap">শ্রেণি</TableHead>
                                            <TableHead className="font-bold text-blue-900 text-center whitespace-nowrap">শিক্ষাবর্ষ</TableHead>
                                            <TableHead className="font-bold text-blue-900 text-center whitespace-nowrap">মোট নম্বর</TableHead>
                                            <TableHead className="font-bold text-blue-900 text-center whitespace-nowrap">প্রাপ্ত নম্বর</TableHead>
                                            <TableHead className="font-bold text-blue-900 text-center">গ্রেড</TableHead>
                                            <TableHead className="font-bold text-blue-900 text-right">অ্যাকশন</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {historicalResults.map((res, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-bold text-gray-800">{res.exam_name}</TableCell>
                                                <TableCell className="text-center font-bold text-gray-800">{res.class_name}</TableCell>
                                                <TableCell className="text-center text-gray-600">{toBengaliNumber(res.academic_year)}</TableCell>
                                                <TableCell className="text-center text-gray-600">{toBengaliNumber(res.total_full_marks)}</TableCell>
                                                <TableCell className="text-center font-bold text-gray-800">{toBengaliNumber(res.total_marks_obtained)}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={res.grade === 'F' ? 'destructive' : 'default'} className="bg-blue-600">
                                                        {res.grade}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="h-8 text-xs px-3 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 whitespace-nowrap"
                                                        onClick={() => {
                                                            setPreviewExamId(res.exam_id);
                                                            setPreviewModalOpen(true);
                                                        }}
                                                    >
                                                        <FileText className="w-4 h-4 mr-1.5"/> মার্কশিট দেখুন
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <GraduationCap className="w-16 h-16 mx-auto mb-3 text-gray-300"/>
                                <p className="text-gray-500 font-medium">এখনও কোনো পরীক্ষার ফলাফল প্রকাশিত হয়নি</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* 4. PAYMENTS TAB */}
            <TabsContent value="payments" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-red-50/50 border-red-200 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-red-600 mb-1">মোট বকেয়া</p>
                                    <h3 className="text-4xl font-bold text-gray-800">৳ {toBengaliNumber(financials.due)}</h3>
                                </div>
                                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                                    <AlertCircle className="w-8 h-8"/>
                                </div>
                            </div>
                            <Button className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-bold h-11">
                                অনলাইনে পেমেন্ট করুন
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50/50 border-green-200 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-green-700 mb-1">মোট পরিশোধিত</p>
                                    <h3 className="text-4xl font-bold text-gray-800">৳ {toBengaliNumber(financials.paid)}</h3>
                                </div>
                                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                    <CheckCircle2 className="w-8 h-8"/>
                                </div>
                            </div>
                            {financials.lastPayment && (
                                <p className="mt-6 text-sm font-medium text-green-800 bg-green-100/50 p-2.5 rounded text-center">
                                    সর্বশেষ পেমেন্ট: {format(new Date(financials.lastPayment), "dd MMMM yyyy", { locale: bn })}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-gray-600"/> লেনদেনের ইতিহাস</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {financials.history.length === 0 ? (
                            <p className="text-center py-10 text-gray-500">কোনো লেনদেনের তথ্য নেই</p>
                        ) : (
                            <div className="overflow-x-auto border border-gray-100 rounded-lg">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="font-bold min-w-[120px]">তারিখ</TableHead>
                                            <TableHead className="font-bold min-w-[200px]">বিবরণ</TableHead>
                                            <TableHead className="font-bold">রসিদ নং</TableHead>
                                            <TableHead className="font-bold text-right">পরিমাণ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {financials.history.map((t: any) => (
                                            <TableRow key={t.id}>
                                                <TableCell className="whitespace-nowrap">{format(new Date(t.payment_date), "dd MMM yyyy", { locale: bn })}</TableCell>
                                                <TableCell className="font-medium text-gray-800">{t.title}</TableCell>
                                                <TableCell className="text-gray-500">{t.receipt_no || '-'}</TableCell>
                                                <TableCell className="text-right font-bold text-green-600">৳ {toBengaliNumber(t.amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* 5. LEAVES TAB */}
            <TabsContent value="leaves" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* New Application Form */}
                    <Card className="lg:col-span-1 border-blue-100 shadow-sm h-fit">
                        <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2 text-blue-800"><FileText className="w-5 h-5"/> নতুন ছুটির আবেদন</CardTitle>
                            <CardDescription className="text-blue-600/80">অসুস্থতা বা জরুরি প্রয়োজনে আবেদন করুন</CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700">হতে (তারিখ)</label>
                                    <Input type="date" className="h-11" value={leaveForm.from} onChange={e => setLeaveForm({...leaveForm, from: e.target.value})} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700">পর্যন্ত (তারিখ)</label>
                                    <Input type="date" className="h-11" value={leaveForm.to} onChange={e => setLeaveForm({...leaveForm, to: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700">কারণ</label>
                                <Textarea 
                                    placeholder="ছুটির কারণ বিস্তারিতভাবে লিখুন..." 
                                    className="min-h-[120px] resize-none"
                                    value={leaveForm.reason} 
                                    onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})}
                                />
                            </div>
                            <Button 
                                onClick={handleLeaveSubmit} 
                                disabled={isSubmittingLeave} 
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-200"
                            >
                                {isSubmittingLeave ? <Loader2 className="animate-spin w-5 h-5"/> : "আবেদন জমা দিন"}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* History */}
                    <Card className="lg:col-span-2 shadow-sm">
                        <CardHeader className="pb-4 border-b border-gray-100">
                            <CardTitle className="text-lg flex items-center gap-2 text-gray-800"><Clock className="w-5 h-5 text-gray-500"/> আবেদনের ইতিহাস</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {leaveHistory.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                                    <p>পূর্বে কোনো ছুটির আবেদন করা হয়নি</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                                    {leaveHistory.map((leave) => (
                                        <div key={leave.id} className="p-5 hover:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-bold text-gray-800">
                                                        {format(new Date(leave.from_date), "dd MMMM", { locale: bn })} হতে {format(new Date(leave.to_date), "dd MMMM yyyy", { locale: bn })}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-1"><span className="font-medium text-gray-700">কারণ:</span> {leave.reason}</p>
                                                </div>
                                                <Badge className={`ml-4 shrink-0 ${
                                                    leave.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' : 
                                                    leave.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' : 
                                                    'bg-yellow-100 text-yellow-800 border-yellow-200'
                                                }`} variant="outline">
                                                    {leave.status === 'approved' ? 'অনুমোদিত' : 
                                                     leave.status === 'rejected' ? 'বাতিল' : 'অপেক্ষমান'}
                                                </Badge>
                                            </div>
                                            {leave.admin_remark && (
                                                <div className="mt-3 text-sm bg-white p-3 rounded-md border border-gray-200 text-gray-700 flex gap-2 items-start shadow-sm">
                                                    <MessageSquare className="w-4 h-4 text-gray-400 shrink-0 mt-0.5"/>
                                                    <p><span className="font-bold text-gray-800">অ্যাডমিন মন্তব্য:</span> {leave.admin_remark}</p>
                                                </div>
                                            )}
                                            <p className="text-[10px] text-gray-400 mt-3 text-right">আবেদনের তারিখ: {format(new Date(leave.created_at), "dd MMM yyyy", { locale: bn })}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

          </Tabs>

      </div>

      {previewModalOpen && student && (
          <TranscriptPreviewModal 
              isOpen={previewModalOpen}
              onClose={() => setPreviewModalOpen(false)}
              studentDbId={student.id}
              examId={previewExamId}
          />
      )}

    </div>
  );
}
