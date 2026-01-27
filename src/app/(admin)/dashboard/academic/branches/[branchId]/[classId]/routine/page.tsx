"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { 
  Plus, Trash2, Clock, Calendar, User, BookOpen, Sun, Moon, Coffee, Gamepad2, Loader2, Save, Download, Copy, Edit, CheckCircle2, XCircle, AlertTriangle, Timer
} from "lucide-react";

const days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const activityTypes = [
    { value: "class", label: "ক্লাস / পড়াশোনা", icon: BookOpen, color: "bg-blue-50 border-blue-200 text-blue-700" },
    { value: "meal", label: "খাবার বিরতি", icon: Coffee, color: "bg-orange-50 border-orange-200 text-orange-700" },
    { value: "prayer", label: "নামাজ / ইবাদত", icon: Sun, color: "bg-green-50 border-green-200 text-green-700" },
    { value: "sleep", label: "ঘুম / বিশ্রাম", icon: Moon, color: "bg-purple-50 border-purple-200 text-purple-700" },
    { value: "personal", label: "ব্যক্তিগত / খেলাধুলা", icon: Gamepad2, color: "bg-gray-50 border-gray-200 text-gray-700" },
];

const defaultMadrasaRoutine = [
  { start: "05:15", end: "06:10", title: "ফজর ও আমল", description: "ইস্তেঞ্জা, ওজু, সালাতুল ফজর ও আমল", type: "prayer" },
  { start: "06:10", end: "07:00", title: "কুরআন তিলাওয়াত", description: "কুরআন তিলাওয়াত করা", type: "class" },
  { start: "07:00", end: "07:10", title: "সকালের নাস্তা", description: "নাস্তা", type: "meal" },
  { start: "07:10", end: "08:10", title: "পড়া শোনানো", description: "পড়া শোনানো", type: "class" },
  { start: "08:10", end: "08:40", title: "সকালের খাবার", description: "ভারী খাবার গ্রহণ", type: "meal" },
  { start: "08:40", end: "09:30", title: "ক্লাস প্রস্তুতি", description: "পড়া প্রস্তুত ও ক্লাসের জন্য প্রস্তুতি", type: "personal" },
  { start: "09:30", end: "13:00", title: "মাদ্রাসার ক্লাস", description: "ক্লাস (শিশু - পঞ্চম)", type: "class" },
  { start: "13:00", end: "14:00", title: "জোহর ও তিলাওয়াত", description: "গোসল, সালাতুল জোহর ও তিলাওয়াত", type: "prayer" },
  { start: "14:00", end: "14:30", title: "দুপুরের খাবার", description: "দুপুরের খাবার গ্রহণ", type: "meal" },
  { start: "14:30", end: "15:50", title: "দুপুরের ঘুম (বিশ্রাম)", description: "সতর্কতা: এই সময় ডাকাডাকি কিংবা ফোন করা নিষিদ্ধ", type: "sleep" },
  { start: "15:50", end: "16:10", title: "আসর ও তিলাওয়াত", description: "ইস্তেঞ্জা, ওজু, সালাতুল আসর ও তিলাওয়াত", type: "prayer" },
  { start: "16:10", end: "16:50", title: "ব্যক্তিগত কাজ", description: "ব্যক্তিগত প্রয়োজনীয় কাজ", type: "personal" },
  { start: "16:50", end: "17:20", title: "ইস্তেগফার ও মোনাজাত", description: "ইস্তেঞ্জা, ওজু, ইস্তেগফার পাঠ ও মোনাজাত", type: "prayer" },
  { start: "17:20", end: "17:45", title: "মাগরিব ও ওয়াকিয়া", description: "সালাতুল মাগরিব ও ওয়াকিয়া তিলাওয়াত", type: "prayer" },
  { start: "17:45", end: "18:35", title: "কুরআন তিলাওয়াত", description: "সন্ধ্যার কুরআন তিলাওয়াত", type: "class" },
  { start: "18:35", end: "21:30", title: "কিতাব পড়া (হোমওয়ার্ক)", description: "বাংলা, ইংরেজি ও অন্যান্য কিতাব পড়া", type: "class" },
  { start: "21:30", end: "22:00", title: "রাতের খাবার", description: "রাতের খাবার গ্রহণ", type: "meal" },
  { start: "22:00", end: "05:15", title: "রাতের ঘুম", description: "ঘুম ও বিশ্রাম", type: "sleep" },
];

// --- Helper Functions ---
const formatTime = (time: string) => {
  if (!time) return "";
  const [hours, minutes] = time.split(':');
  let h = parseInt(hours);
  const m = parseInt(minutes);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; 
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const getTimePeriod = (time: string) => {
  if (!time) return "";
  const hours = parseInt(time.split(':')[0]);
  
  if (hours >= 4 && hours < 12) return "সকাল";
  if (hours >= 12 && hours < 16) return "দুপুর";
  if (hours >= 16 && hours < 18) return "বিকাল";
  if (hours >= 18 && hours < 20) return "সন্ধ্যা";
  return "রাত";
};

// ক্যালকুলেট ডিউরেশন ফাংশন (নতুন যুক্ত করা হয়েছে)
const calculateDuration = (start: string, end: string) => {
  if (!start || !end) return "";
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  let startDate = new Date(0, 0, 0, startH, startM, 0);
  let endDate = new Date(0, 0, 0, endH, endM, 0);

  let diff = endDate.getTime() - startDate.getTime();
  if (diff < 0) {
    // যদি মাঝরাতে দিন পরিবর্তন হয় (যেমন রাত ১০টা থেকে ভোর ৫টা)
    endDate = new Date(0, 0, 1, endH, endM, 0);
    diff = endDate.getTime() - startDate.getTime();
  }

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours} ঘণ্টা ${remainingMinutes > 0 ? remainingMinutes + " মি." : ""}`;
  }
  return `${minutes} মিনিট`;
};

export default function ClassRoutinePage({ params }: { params: Promise<{ branchId: string, classId: string }> }) {
  const { branchId, classId } = use(params);
  
  const [routines, setRoutines] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modals
  const [isOpen, setIsOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isLoadTemplateOpen, setIsLoadTemplateOpen] = useState(false);
  
  // Load Confirmation State
  const [isLoadConfirmOpen, setIsLoadConfirmOpen] = useState(false);
  const [pendingTemplateSlots, setPendingTemplateSlots] = useState<any[]>([]);
  
  // Confirmation & Message Modals
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [messageModal, setMessageModal] = useState<{ open: boolean, title: string, message: string, type: 'success' | 'error' }>({ open: false, title: "", message: "", type: "success" });

  // Filters & Form
  const [selectedDay, setSelectedDay] = useState("Saturday");
  const [templateName, setTemplateName] = useState("");
  const [formData, setFormData] = useState({
      id: "",
      start_time: "",
      end_time: "",
      activity_type: "class",
      subject_id: "",
      teacher_id: "",
      description: "",
      student_type: "both"
  });

  useEffect(() => {
    fetchData();
    fetchTemplates();
  }, [classId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: rData } = await supabase
        .from("routines")
        .select(`*, academic_subjects(name), teachers(name)`)
        .eq("class_id", classId)
        .order("start_time", { ascending: true });
    if(rData) setRoutines(rData);

    const { data: sData } = await supabase.from("academic_subjects").select("id, name, code").eq("class_id", classId);
    if(sData) setSubjects(sData);
    
    const { data: tData } = await supabase.from("teachers").select("id, name");
    if(tData) setTeachers(tData);

    setLoading(false);
  };

  const fetchTemplates = async () => {
      const { data } = await supabase.from("routine_templates").select("*").eq("branch_id", branchId);
      if(data) setTemplates(data);
  };

  // --- CRUD Operations ---
  const handleSaveRoutine = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      const payload = {
          class_id: classId,
          day_of_week: selectedDay,
          start_time: formData.start_time,
          end_time: formData.end_time,
          activity_type: formData.activity_type,
          student_type: formData.student_type,
          subject_id: formData.activity_type === 'class' ? formData.subject_id : null,
          teacher_id: formData.activity_type === 'class' ? formData.teacher_id : null,
          description: formData.description 
      };

      let error;
      if(formData.id) {
          const { error: err } = await supabase.from("routines").update(payload).eq("id", formData.id);
          error = err;
      } else {
          const { error: err } = await supabase.from("routines").insert([payload]);
          error = err;
      }

      if (error) {
          setMessageModal({ open: true, title: "ত্রুটি!", message: error.message, type: "error" });
      } else {
          setIsOpen(false);
          resetForm();
          fetchData();
          setMessageModal({ open: true, title: "সফল!", message: "রুটিন সফলভাবে সেভ হয়েছে।", type: "success" });
      }
      setIsSubmitting(false);
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
      if(!deleteId) return;
      setIsSubmitting(true);
      const { error } = await supabase.from("routines").delete().eq("id", deleteId);
      if(error) {
        setMessageModal({ open: true, title: "ত্রুটি!", message: "রুটিন ডিলিট করা যায়নি।", type: "error" });
      } else {
        fetchData();
        setIsDeleteModalOpen(false);
      }
      setIsSubmitting(false);
  };

  const handleEdit = (routine: any) => {
      setFormData({
          id: routine.id,
          start_time: routine.start_time,
          end_time: routine.end_time,
          activity_type: routine.activity_type,
          subject_id: routine.subject_id || "",
          teacher_id: routine.teacher_id || "",
          description: routine.description || "",
          student_type: routine.student_type
      });
      setIsOpen(true);
  };

  const resetForm = () => {
      setFormData({ id: "", start_time: "", end_time: "", activity_type: "class", subject_id: "", teacher_id: "", description: "", student_type: "both" });
  };

  // --- Template Logic ---
  const handleSaveTemplate = async () => {
      if(!templateName) return alert("টেমপ্লেটের নাম দিন");
      
      const currentDayRoutines = routines.filter(r => r.day_of_week === selectedDay);
      if(currentDayRoutines.length === 0) {
        setMessageModal({ open: true, title: "সতর্কতা", message: "এই দিনে সেভ করার মতো কোনো রুটিন নেই", type: "error" });
        return;
      }

      const { error } = await supabase.from("routine_templates").insert([{
          name: templateName,
          branch_id: branchId,
          slots: currentDayRoutines
      }]);

      if(error) {
         setMessageModal({ open: true, title: "ত্রুটি", message: "টেমপ্লেট সেভ হয়নি", type: "error" });
      } else {
          setMessageModal({ open: true, title: "সফল", message: "টেমপ্লেট সফলভাবে সেভ হয়েছে!", type: "success" });
          setIsTemplateModalOpen(false);
          setTemplateName("");
          fetchTemplates();
      }
  };

  const handleLoadTemplateRequest = (slots: any[]) => {
    setPendingTemplateSlots(slots);
    setIsLoadTemplateOpen(false); // তালিকা মডাল বন্ধ
    setIsLoadConfirmOpen(true); // কনফার্ম মডাল ওপেন
  };

  const confirmLoadTemplate = async () => {
      setIsSubmitting(true);

      await supabase.from("routines").delete().eq("class_id", classId).eq("day_of_week", selectedDay);

      const newRoutines = pendingTemplateSlots.map(s => ({
          class_id: classId,
          day_of_week: selectedDay,
          start_time: s.start_time || s.start, 
          end_time: s.end_time || s.end,
          activity_type: s.activity_type || s.type, 
          description: s.description || s.title, 
          student_type: s.student_type || "both",
          subject_id: s.subject_id || null, 
          teacher_id: s.teacher_id || null
      }));

      const { error } = await supabase.from("routines").insert(newRoutines);
      
      if(error) setMessageModal({ open: true, title: "ত্রুটি", message: error.message, type: "error" });
      else {
          fetchData();
          setIsLoadConfirmOpen(false);
          setMessageModal({ open: true, title: "সফল", message: "টেমপ্লেট সফলভাবে লোড হয়েছে!", type: "success" });
      }
      setIsSubmitting(false);
  };

  const loadDefaultRoutine = () => {
      const formatted = defaultMadrasaRoutine.map(r => ({
          ...r,
          activity_type: r.type, 
          description: `${r.title} - ${r.description}` 
      }));
      handleLoadTemplateRequest(formatted);
  };

  const filteredRoutines = routines.filter(r => r.day_of_week === selectedDay);

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4">
          <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Clock className="w-6 h-6 text-purple-600"/> ক্লাস রুটিন</h1>
              <p className="text-sm text-gray-500">২৪ ঘন্টার সময়সূচি তৈরি ও নিয়ন্ত্রণ করুন</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="outline" onClick={() => setIsLoadTemplateOpen(true)} className="gap-2"><Download className="w-4 h-4"/> টেমপ্লেট লোড</Button>
              <Button variant="outline" onClick={() => setIsTemplateModalOpen(true)} className="gap-2"><Save className="w-4 h-4"/> টেমপ্লেট সেভ</Button>
              <Button onClick={() => { resetForm(); setIsOpen(true); }} className="bg-purple-600 hover:bg-purple-700 gap-2"><Plus className="w-4 h-4"/> স্লট যোগ করুন</Button>
          </div>
      </div>

      {/* Day Tabs */}
      <div className="bg-white rounded-xl border shadow-sm p-2 sticky top-0 z-10 overflow-hidden">
          <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 scrollbar-hide">
              {days.map(day => (
                  <button 
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${selectedDay === day ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                      {day}
                  </button>
              ))}
          </div>
      </div>

      {/* Routine Timeline */}
      <div className="space-y-3">
          {loading ? <div className="text-center py-20"><Loader2 className="animate-spin w-8 h-8 text-purple-600 mx-auto"/></div> : 
           filteredRoutines.length === 0 ? (
               <div className="text-center py-20 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed flex flex-col items-center gap-4">
                   <p>এই বারে কোনো রুটিন নেই</p>
                   <Button variant="outline" onClick={loadDefaultRoutine} className="text-green-600 border-green-200 hover:bg-green-50">
                       <Copy className="w-4 h-4 mr-2"/> ডিফল্ট মাদ্রাসা রুটিন লোড করুন
                   </Button>
               </div>
           ) :
           filteredRoutines.map((routine) => {
               const typeConfig = activityTypes.find(t => t.value === routine.activity_type) || activityTypes[4];
               const Icon = typeConfig.icon;
               const period = getTimePeriod(routine.start_time);
               const duration = calculateDuration(routine.start_time, routine.end_time);

               return (
                  <div key={routine.id} className={`p-4 rounded-xl border shadow-sm flex flex-col md:flex-row items-center gap-4 transition-all group ${typeConfig.color} bg-opacity-10 border-opacity-50 hover:shadow-md`}>
                      
                      {/* Time & Icon */}
                      <div className="flex items-center gap-4 min-w-[220px]">
                          <div className={`p-3 rounded-full ${typeConfig.color} bg-opacity-20`}>
                              <Icon className="w-6 h-6" />
                          </div>
                          <div>
                              <p className="text-lg font-black">{formatTime(routine.start_time)} - {formatTime(routine.end_time)}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 bg-white px-2 py-0.5 rounded border border-current">{period}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 flex items-center gap-1">
                                    <Timer className="w-3 h-3" /> {duration}
                                </span>
                              </div>
                          </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 w-full text-center md:text-left border-t md:border-t-0 md:border-l border-gray-200 pt-2 md:pt-0 md:pl-6">
                          {routine.activity_type === 'class' ? (
                              <div>
                                  <h3 className="text-lg font-bold">{routine.academic_subjects?.name || "বিষয় নির্ধারণ করা হয়নি"}</h3>
                                  <p className="text-sm opacity-80 flex items-center justify-center md:justify-start gap-2 mt-1">
                                      <User className="w-4 h-4"/> {routine.teachers?.name || "শিক্ষক নেই"}
                                  </p>
                              </div>
                          ) : (
                              <div>
                                  <h3 className="text-lg font-bold">{routine.description || typeConfig.label}</h3>
                              </div>
                          )}
                          <div className="mt-2">
                             <span className={`text-[10px] px-2 py-0.5 rounded border ${routine.student_type === 'both' ? 'bg-white border-gray-300' : 'bg-yellow-100 border-yellow-300 text-yellow-800'}`}>
                                {routine.student_type === 'both' ? 'সবার জন্য' : routine.student_type === 'residential' ? 'শুধুমাত্র আবাসিক' : 'শুধুমাত্র অনাবাসিক'}
                             </span>
                          </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(routine)} className="hover:bg-white/50"><Edit className="w-4 h-4"/></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteRequest(routine.id)} className="text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4"/></Button>
                      </div>
                  </div>
               )
           })}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[500px]">
              <DialogHeader><DialogTitle>{formData.id ? "রুটিন আপডেট" : `নতুন রুটিন (${selectedDay})`}</DialogTitle></DialogHeader>
              <form onSubmit={handleSaveRoutine} className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><label className="text-xs font-bold text-gray-500">শুরু</label><Input type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} required/></div>
                      <div className="space-y-1"><label className="text-xs font-bold text-gray-500">শেষ</label><Input type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} required/></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500">কার্যক্রমের ধরণ</label>
                          <select className="w-full h-10 border rounded px-3 text-sm bg-white" value={formData.activity_type} onChange={e => setFormData({...formData, activity_type: e.target.value})}>
                              {activityTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                          </select>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500">শিক্ষার্থী</label>
                          <select className="w-full h-10 border rounded px-3 text-sm bg-white" value={formData.student_type} onChange={e => setFormData({...formData, student_type: e.target.value})}>
                              <option value="both">সবার জন্য</option>
                              <option value="residential">আবাসিক</option>
                              <option value="non_residential">অনাবাসিক</option>
                          </select>
                      </div>
                  </div>

                  {formData.activity_type === 'class' ? (
                      <div className="space-y-4 pt-2 border-t">
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-500">বিষয়</label>
                              <select className="w-full h-10 border rounded px-3 text-sm bg-white" value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})} required>
                                  <option value="">বিষয় নির্বাচন করুন</option>
                                  {subjects.map(s => (
                                    <option key={s.id} value={s.id}>
                                      {s.name} {s.code ? `(${s.code})` : ''}
                                    </option>
                                  ))}
                              </select>
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-500">শিক্ষক</label>
                              <select className="w-full h-10 border rounded px-3 text-sm bg-white" value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})}>
                                  <option value="">শিক্ষক নির্বাচন করুন</option>
                                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                              </select>
                          </div>
                      </div>
                  ) : (
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500">বিবরণ (ঐচ্ছিক)</label>
                          <Input placeholder="যেমন: গোসল, খেলাধুলা..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                      </div>
                  )}

                  <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>বাতিল</Button>
                      <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">{isSubmitting ? <Loader2 className="animate-spin"/> : "সেভ করুন"}</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>

      {/* Save Template Modal */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
          <DialogContent>
             <DialogHeader><DialogTitle>টেমপ্লেট হিসেবে সেভ করুন</DialogTitle><DialogDescription>বর্তমান দিনের ({selectedDay}) রুটিনটি ভবিষ্যতের জন্য সেভ করে রাখুন।</DialogDescription></DialogHeader>
             <Input placeholder="টেমপ্লেটের নাম (যেমন: শীতকালীন রুটিন)" value={templateName} onChange={e => setTemplateName(e.target.value)} />
             <DialogFooter><Button onClick={handleSaveTemplate} className="bg-green-600">সেভ করুন</Button></DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Load Template List Modal */}
      <Dialog open={isLoadTemplateOpen} onOpenChange={setIsLoadTemplateOpen}>
          <DialogContent>
             <DialogHeader><DialogTitle>টেমপ্লেট লোড করুন</DialogTitle></DialogHeader>
             <div className="space-y-2 max-h-60 overflow-y-auto">
                 {templates.length === 0 ? <p className="text-center text-gray-400 py-4">কোনো সেভ করা টেমপ্লেট নেই</p> : 
                   templates.map(t => (
                       <div key={t.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                           <span className="font-medium">{t.name}</span>
                           <Button size="sm" onClick={() => handleLoadTemplateRequest(t.slots)}>লোড করুন</Button>
                       </div>
                   ))
                 }
                 <div className="border-t pt-2 mt-2">
                     <p className="text-xs text-gray-500 mb-2">সিস্টেম ডিফল্ট:</p>
                     <Button variant="outline" size="sm" onClick={loadDefaultRoutine} className="w-full">স্ট্যান্ডার্ড মাদ্রাসা রুটিন</Button>
                 </div>
             </div>
          </DialogContent>
      </Dialog>

      {/* Load Confirmation Modal */}
      <Dialog open={isLoadConfirmOpen} onOpenChange={setIsLoadConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
             <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-orange-600"><AlertTriangle className="w-5 h-5"/> নিশ্চিতকরণ</DialogTitle>
                <DialogDescription>
                    সতর্কতা: বর্তমান দিনের ({selectedDay}) আগের সব রুটিন মুছে যাবে এবং নির্বাচিত টেমপ্লেটটি বসবে। আপনি কি নিশ্চিত?
                </DialogDescription>
             </DialogHeader>
             <DialogFooter>
                <Button variant="outline" onClick={() => setIsLoadConfirmOpen(false)}>না, বাতিল</Button>
                <Button className="bg-orange-600 hover:bg-orange-700" onClick={confirmLoadTemplate} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin w-4 h-4"/> : "হ্যাঁ, লোড করুন"}
                </Button>
             </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Modal (Success/Error) */}
      <Dialog open={messageModal.open} onOpenChange={(open) => setMessageModal(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-sm text-center">
            <div className={`mx-auto p-3 rounded-full w-fit ${messageModal.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                {messageModal.type === 'success' ? <CheckCircle2 className="w-8 h-8 text-green-600"/> : <AlertTriangle className="w-8 h-8 text-red-600"/>}
            </div>
            <DialogTitle className="text-center text-xl mt-2">{messageModal.title}</DialogTitle>
            <DialogDescription className="text-center">{messageModal.message}</DialogDescription>
            <Button className="mt-4 w-full" onClick={() => setMessageModal(prev => ({ ...prev, open: false }))}>ঠিক আছে</Button>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-sm">
             <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600"><Trash2 className="w-5 h-5"/> নিশ্চিতকরণ</DialogTitle>
                <DialogDescription>আপনি কি নিশ্চিত যে আপনি এই রুটিনটি মুছে ফেলতে চান?</DialogDescription>
             </DialogHeader>
             <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>না, বাতিল</Button>
                <Button variant="destructive" onClick={confirmDelete} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin w-4 h-4"/> : "হ্যাঁ, ডিলিট"}
                </Button>
             </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}