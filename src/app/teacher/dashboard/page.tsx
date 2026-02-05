"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { 
  LogOut, 
  Clock,
  Loader2,
  Save,
  CheckCircle2,
  Calendar,
  BookOpen,
  GraduationCap
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

function TeacherDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [routines, setRoutines] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, { status: string, remark: string }>>({}); 
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const [attendanceExists, setAttendanceExists] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Tab State Controlled - Initialize from URL query param or default to 'routine'
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "routine");

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (teacher) {
        fetchRoutine();
        fetchClasses();
    }
  }, [teacher]);

  // Sync activeTab with URL
  const handleTabChange = (value: string) => {
      setActiveTab(value);
      router.push(`?tab=${value}`, { scroll: false });
  };

  // Fetch Students when Class Changes
  useEffect(() => {
      if (selectedClass) {
          fetchStudents(selectedClass);
      }
  }, [selectedClass]);

  const checkSession = async () => {
      if (typeof window !== 'undefined') {
          const sessionStr = localStorage.getItem("teacher_portal_session");
          if (!sessionStr) {
            router.push("/login");
            return;
          }
          try {
            setTeacher(JSON.parse(sessionStr));
          } catch (e) {
            console.error("Session parse error", e);
            router.push("/login");
          }
          setLoading(false);
      }
  };

  const handleLogout = () => {
      localStorage.removeItem("teacher_portal_session");
      router.push("/login");
  };

  const fetchRoutine = async () => {
      if (!teacher?.id) return;
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const today = days[new Date().getDay()];

      const { data, error } = await supabase
          .from("routines")
          .select(`
              *,
              academic_classes(name),
              academic_subjects(name)
          `)
          .eq("teacher_id", teacher.id)
          .eq("day_of_week", today)
          .order("start_time", { ascending: true });

      if (data) setRoutines(data);
  };

  const fetchClasses = async () => {
      if (!teacher?.id) return;
      
      const { data: routineData } = await supabase
          .from("routines")
          .select("class_id")
          .eq("teacher_id", teacher.id);
      
      if (routineData && routineData.length > 0) {
          const classIds = Array.from(new Set(routineData.map((r: any) => r.class_id)));
          
          if (classIds.length > 0) {
              const { data } = await supabase
                  .from("academic_classes")
                  .select("id, name, branch_id") 
                  .in("id", classIds);
              
              if (data) setClasses(data);
          }
      } else {
          setClasses([]);
      }
  };

  const fetchStudents = async (classId: string) => {
      const cls = classes.find(c => c.id === classId);
      if (!cls) return;

      const { data: studentData, error } = await supabase
          .from("students")
          .select("id, student_id, name_bn, roll_no, photo_url")
          .eq("class_name", cls.name)
          .eq("branch_id", cls.branch_id)
          .eq("status", "active")
          .order("roll_no", { ascending: true });

      if (studentData) {
          setStudents(studentData);
          
          // Check if attendance already exists for today
          const date = new Date().toISOString().split('T')[0];
          
          const { data: existingAttendance, error: attError } = await supabase
              .from("attendance")
              .select("student_id, status, remark")
              .eq("class_id", classId)
              .eq("date", date);
          
          if (attError) console.error("Error fetching attendance:", attError);

          if (existingAttendance && existingAttendance.length > 0) {
              setAttendanceExists(true);
              const attRecord: Record<string, { status: string, remark: string }> = {};
              existingAttendance.forEach((att: any) => {
                  attRecord[att.student_id] = { status: att.status, remark: att.remark || '' };
              });
              
              // Fill missing students with default
              studentData.forEach((s: any) => {
                  if (!attRecord[s.id]) attRecord[s.id] = { status: 'present', remark: '' };
              });
              
              setAttendance(attRecord);
          } else {
              setAttendanceExists(false);
              const initialAtt: Record<string, { status: string, remark: string }> = {};
              studentData.forEach((s: any) => initialAtt[s.id] = { status: 'present', remark: '' });
              setAttendance(initialAtt);
          }
      }
  };

  const updateAttendance = (studentId: string, field: 'status' | 'remark', value: string) => {
      setAttendance(prev => ({
          ...prev,
          [studentId]: {
              ...prev[studentId],
              [field]: value
          }
      }));
  };

  const submitAttendance = async () => {
      if (!selectedClass || students.length === 0) return;
      setIsSubmittingAttendance(true);

      const date = new Date().toISOString().split('T')[0];
      const cls = classes.find(c => c.id === selectedClass);
      
      const inserts = students.map(student => ({
          student_id: student.id,
          class_id: selectedClass,
          branch_id: cls?.branch_id, 
          date: date,
          status: attendance[student.id]?.status || 'absent',
          // remark: attendance[student.id]?.remark || '', // Uncomment if you have remark column in DB
          marked_by: teacher.id
      }));

      const { error } = await supabase.from("attendance").upsert(inserts, { onConflict: 'student_id, date' });

      if (error) {
          alert("ত্রুটি: " + error.message);
      } else {
          setShowSuccessModal(true);
          setAttendanceExists(true);
      }
      setIsSubmittingAttendance(false);
  };

  const formatTime = (time: string) => {
      try {
        const [h, m] = time.split(':');
        const d = new Date();
        d.setHours(parseInt(h), parseInt(m));
        return format(d, 'h:mm a');
      } catch (e) {
        return time;
      }
  };

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <Loader2 className="animate-spin h-8 w-8 text-green-600" />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-[Kalpurush]">
      
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center border border-green-200 text-green-700 font-bold text-lg">
                      {teacher?.name?.[0]}
                  </div>
                  <div>
                      <h1 className="text-lg font-bold text-gray-800 leading-tight">{teacher?.name}</h1>
                      <p className="text-xs text-gray-500">{teacher?.designation || 'সহকারী শিক্ষক'}</p>
                  </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:bg-red-50 hover:text-red-600 gap-2">
                  <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">লগ আউট</span>
              </Button>
          </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              
              <div className="flex justify-center">
                  <TabsList className="grid w-full max-w-md grid-cols-3 bg-white border shadow-sm h-12 p-1">
                      <TabsTrigger value="routine" className="data-[state=active]:bg-green-600 data-[state=active]:text-white font-bold">রুটিন</TabsTrigger>
                      <TabsTrigger value="attendance" className="data-[state=active]:bg-green-600 data-[state=active]:text-white font-bold">হাজিরা</TabsTrigger>
                      <TabsTrigger value="exams" className="data-[state=active]:bg-green-600 data-[state=active]:text-white font-bold">পরীক্ষা</TabsTrigger>
                  </TabsList>
              </div>

              {/* --- ROUTINE TAB --- */}
              <TabsContent value="routine" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Card>
                      <CardHeader className="bg-blue-50/50 pb-4">
                          <CardTitle className="flex items-center gap-2 text-blue-700">
                              <Clock className="w-5 h-5"/> আজকের ক্লাস রুটিন
                          </CardTitle>
                          <CardDescription>{format(new Date(), "EEEE, dd MMMM yyyy")}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                          {routines.length === 0 ? (
                              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                                  <p className="text-gray-500 font-medium">আজকে আপনার কোনো ক্লাস নেই</p>
                              </div>
                          ) : (
                              <div className="grid gap-4 md:grid-cols-2">
                                  {routines.map((routine: any) => (
                                      <div key={routine.id} className="flex items-start p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-blue-200 group">
                                          <div className="h-14 w-14 bg-blue-100 rounded-xl flex flex-col items-center justify-center text-blue-700 font-bold mr-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                              <span className="text-sm">{formatTime(routine.start_time)}</span>
                                          </div>
                                          <div className="flex-1">
                                              <h3 className="font-bold text-gray-800 text-lg">{routine.academic_subjects?.name || routine.description}</h3>
                                              <div className="flex items-center gap-2 mt-1">
                                                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                                                      ক্লাস: {routine.academic_classes?.name}
                                                  </Badge>
                                                  <span className="text-xs text-gray-400">•</span>
                                                  <span className="text-xs text-gray-500 font-medium">
                                                      {routine.activity_type === 'class' ? 'নিয়মিত ক্লাস' : routine.activity_type}
                                                  </span>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </CardContent>
                  </Card>
              </TabsContent>

              {/* --- ATTENDANCE TAB --- */}
              <TabsContent value="attendance" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid md:grid-cols-12 gap-6">
                      
                      {/* Left: Class Selection */}
                      <div className="md:col-span-4 space-y-4">
                          <Card className="border-t-4 border-t-green-600">
                              <CardHeader>
                                  <CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="w-5 h-5 text-green-600"/> ক্লাস নির্বাচন করুন</CardTitle>
                              </CardHeader>
                              <CardContent>
                                  <div className="space-y-4">
                                      <div className="space-y-2">
                                          <label className="text-sm font-medium text-gray-600">আপনার নির্ধারিত ক্লাসসমূহ</label>
                                          <Select value={selectedClass} onValueChange={setSelectedClass}>
                                              <SelectTrigger className="bg-white">
                                                  <SelectValue placeholder="ক্লাস সিলেক্ট করুন" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                  {classes.map((cls: any) => (
                                                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                                                  ))}
                                              </SelectContent>
                                          </Select>
                                      </div>
                                      
                                      {selectedClass && (
                                          <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
                                              <p className="text-sm text-green-800 font-bold">মোট শিক্ষার্থী</p>
                                              <p className="text-3xl font-bold text-green-600">{students.length}</p>
                                              {attendanceExists && (
                                                  <p className="text-xs text-blue-600 mt-2 font-medium">আজকের হাজিরা সম্পন্ন হয়েছে</p>
                                              )}
                                          </div>
                                      )}
                                  </div>
                              </CardContent>
                          </Card>
                      </div>

                      {/* Right: Student List */}
                      <div className="md:col-span-8">
                          <Card>
                              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                                  <div>
                                      <CardTitle>হাজিরা খাতা</CardTitle>
                                      <CardDescription>তারিখ: {format(new Date(), "dd MMMM yyyy")}</CardDescription>
                                  </div>
                                  {students.length > 0 && (
                                      <div className="flex gap-2">
                                          <Button size="sm" variant="outline" onClick={() => {
                                              const newAtt = {...attendance};
                                              students.forEach(s => newAtt[s.id] = { status: 'present', remark: newAtt[s.id]?.remark || '' });
                                              setAttendance(newAtt);
                                          }}>সবাই উপস্থিত</Button>
                                      </div>
                                  )}
                              </CardHeader>
                              
                              <CardContent className="p-0">
                                  {!selectedClass ? (
                                      <div className="p-12 text-center flex flex-col items-center text-gray-400">
                                          <GraduationCap className="w-12 h-12 mb-3 opacity-20"/>
                                          <p>হাজিরা নিতে বাম পাশ থেকে একটি ক্লাস নির্বাচন করুন</p>
                                      </div>
                                  ) : students.length === 0 ? (
                                      <div className="p-12 text-center text-gray-400">এই ক্লাসে কোনো শিক্ষার্থী নেই</div>
                                  ) : (
                                      <>
                                          <div className="max-h-[500px] overflow-y-auto">
                                              <Table>
                                                  <TableHeader className="bg-gray-50 sticky top-0 z-10">
                                                      <TableRow>
                                                          <TableHead className="w-[80px] text-center">রোল</TableHead>
                                                          <TableHead>শিক্ষার্থী</TableHead>
                                                          <TableHead className="text-right pr-8">স্ট্যাটাস</TableHead>
                                                          <TableHead className="w-[150px]">মন্তব্য</TableHead>
                                                      </TableRow>
                                                  </TableHeader>
                                                  <TableBody>
                                                      {students.map((student) => (
                                                          <TableRow key={student.id} className="hover:bg-gray-50">
                                                              <TableCell className="text-center font-bold text-gray-600">{student.roll_no || '-'}</TableCell>
                                                              <TableCell>
                                                                  <div>
                                                                      <p className="font-bold text-gray-800">{student.name_bn}</p>
                                                                      <p className="text-xs text-gray-500 font-mono">{student.student_id}</p>
                                                                  </div>
                                                              </TableCell>
                                                              <TableCell className="text-right">
                                                                  <div className="flex justify-end gap-1">
                                                                      <button 
                                                                          onClick={() => updateAttendance(student.id, 'status', 'present')}
                                                                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${attendance[student.id]?.status === 'present' ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                                      >
                                                                          উপস্থিত
                                                                      </button>
                                                                      <button 
                                                                          onClick={() => updateAttendance(student.id, 'status', 'absent')}
                                                                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${attendance[student.id]?.status === 'absent' ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                                      >
                                                                          অনুপস্থিত
                                                                      </button>
                                                                      <button 
                                                                          onClick={() => updateAttendance(student.id, 'status', 'leave')}
                                                                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${attendance[student.id]?.status === 'leave' ? 'bg-yellow-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                                      >
                                                                          ছুটি
                                                                      </button>
                                                                  </div>
                                                              </TableCell>
                                                              <TableCell>
                                                                  <Input 
                                                                      value={attendance[student.id]?.remark || ''}
                                                                      onChange={(e) => updateAttendance(student.id, 'remark', e.target.value)}
                                                                      placeholder="মন্তব্য..."
                                                                      className="h-8 text-xs"
                                                                  />
                                                              </TableCell>
                                                          </TableRow>
                                                      ))}
                                                  </TableBody>
                                              </Table>
                                          </div>
                                          <div className="p-4 border-t bg-gray-50 flex justify-end">
                                              <Button onClick={submitAttendance} disabled={isSubmittingAttendance} className="bg-green-700 hover:bg-green-800 px-8 font-bold">
                                                  {isSubmittingAttendance ? <Loader2 className="animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>}
                                                  সংরক্ষণ করুন
                                              </Button>
                                          </div>
                                      </>
                                  )}
                              </CardContent>
                          </Card>
                      </div>
                  </div>
              </TabsContent>

              {/* --- EXAMS TAB --- */}
              <TabsContent value="exams" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Card>
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-600"/> পরীক্ষার তথ্য</CardTitle>
                          <CardDescription>আসন্ন পরীক্ষার সময়সূচি</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                              <p className="text-gray-500">বর্তমানে কোনো পরীক্ষার তথ্য নেই</p>
                          </div>
                      </CardContent>
                  </Card>
              </TabsContent>

          </Tabs>
      </div>
      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md text-center">
            <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
            </div>
            <DialogHeader>
                <DialogTitle className="text-center text-xl text-green-700">সফল!</DialogTitle>
                <DialogDescription className="text-center">
                    উক্ত ক্লাসের হাজিরা সফলভাবে সম্পন্ন হয়েছে।
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
                <Button onClick={() => setShowSuccessModal(false)} className="bg-green-600 hover:bg-green-700 px-8">
                    ঠিক আছে
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TeacherDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin h-8 w-8 text-green-600" /></div>}>
      <TeacherDashboardContent />
    </Suspense>
  );
}