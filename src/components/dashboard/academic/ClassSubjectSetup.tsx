"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Book, Loader2, Edit, Save, CheckCircle2, AlertTriangle } from "lucide-react";
import { subjectCodes } from "@/data/bangladesh-data";
import { removeAcademicSubject } from "@/app/(admin)/dashboard/academic/subjects/actions";

export default function ClassSubjectSetup({ branchId, classId }: { branchId: string, classId: string }) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modals State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // স্মার্ট সিলেকশন স্টেট
  const [selectedSubjects, setSelectedSubjects] = useState<{ 
    [code: number]: { selected: boolean, full: number, pass: number, type: string } 
  }>({});

  // ম্যানুয়াল ইনপুট স্টেট
  const [manualSubject, setManualSubject] = useState({ name: "", code: "", full: 100, pass: 33, type: "Written" });

  const normalizeSubjectName = (value: string) => value.replace(/\s+/g, " ").trim();

  const getCodeFromCommonSubjects = (subjectName: string) => {
    const normalized = normalizeSubjectName(subjectName);
    for (const [code, name] of Object.entries(subjectCodes.common)) {
      if (normalizeSubjectName(String(name)) === normalized) return String(code);
    }
    return null;
  };

  const syncFromAcademicConfigSubjects = async (cls: any, existingSubjects: any[]) => {
    const existingCodes = new Set((existingSubjects || []).map((s: any) => String(s.code)));

    let query = supabase
      .from("subjects")
      .select("id, class_name, subject_name, full_marks, pass_marks, department_id")
      .eq("class_name", cls.name);

    if (cls.department_id) {
      query = query.or(`department_id.eq.${cls.department_id},department_id.is.null`);
    }

    const { data: configSubjects, error } = await query.order("subject_name", { ascending: true });
    if (error || !configSubjects || configSubjects.length === 0) return false;

    const toInsert = configSubjects
      .map((s: any) => {
        const codeFromCommon = getCodeFromCommonSubjects(s.subject_name);
        const code = codeFromCommon || `CFG-${s.id}`;
        return {
          class_id: classId,
          name: s.subject_name,
          code,
          full_marks: Number(s.full_marks ?? 100),
          pass_marks: Number(s.pass_marks ?? 33),
          exam_type: "Written"
        };
      })
      .filter((row: any) => !existingCodes.has(String(row.code)));

    if (toInsert.length === 0) return false;

    const { error: insertError } = await supabase
      .from("academic_subjects")
      .upsert(toInsert, { onConflict: "class_id, code", ignoreDuplicates: true });

    if (insertError) return false;
    return true;
  };

  useEffect(() => {
    fetchData();
  }, [classId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: cls } = await supabase.from("academic_classes").select("*, branches(name)").eq("id", classId).single();
    if (cls) {
        setClassInfo(cls);
        let subs: any[] = [];
        const { data: subsActive, error: subsActiveError } = await supabase
          .from("academic_subjects")
          .select("*")
          .eq("class_id", classId)
          .or("is_active.eq.true,is_active.is.null")
          .order("code", { ascending: true });

        if (!subsActiveError) {
          subs = subsActive || [];
        } else if (subsActiveError.message.toLowerCase().includes("is_active")) {
          const { data: subsFallback } = await supabase
            .from("academic_subjects")
            .select("*")
            .eq("class_id", classId)
            .order("code", { ascending: true });
          subs = subsFallback || [];
        }

        const existingSubjects = subs || [];

        const didSync = await syncFromAcademicConfigSubjects(cls, existingSubjects);
        if (didSync) {
          let syncedSubs: any[] = [];
          const { data: syncedSubsActive, error: syncedSubsActiveError } = await supabase
            .from("academic_subjects")
            .select("*")
            .eq("class_id", classId)
            .or("is_active.eq.true,is_active.is.null")
            .order("code", { ascending: true });

          if (!syncedSubsActiveError) {
            syncedSubs = syncedSubsActive || [];
          } else if (syncedSubsActiveError.message.toLowerCase().includes("is_active")) {
            const { data: syncedSubsFallback } = await supabase
              .from("academic_subjects")
              .select("*")
              .eq("class_id", classId)
              .order("code", { ascending: true });
            syncedSubs = syncedSubsFallback || [];
          }

          setSubjects(syncedSubs);
          preparePresets(cls.name, syncedSubs);
        } else {
          setSubjects(existingSubjects);
          preparePresets(cls.name, existingSubjects);
        }
    }
    setLoading(false);
  };

  const preparePresets = (className: string, existingSubjects: any[]) => {
      const presetCodes = subjectCodes.class_wise[className as keyof typeof subjectCodes.class_wise] || [];
      const initialSelection: any = {};
      const existingCodes = new Set(existingSubjects.map((sub: any) => sub.code));

      Object.keys(subjectCodes.common).forEach((codeStr: string) => {
          const code = parseInt(codeStr);
          const isAlreadyAdded = existingCodes.has(code.toString());
          const isRecommended = presetCodes.includes(code);
          
          initialSelection[code] = { 
              selected: isRecommended && !isAlreadyAdded, 
              full: 100, 
              pass: 33,
              type: "Written"
          };
      });
      setSelectedSubjects(initialSelection);
  };

  const handleCheckboxChange = (code: number, checked: boolean) => {
      setSelectedSubjects(prev => ({ ...prev, [code]: { ...prev[code], selected: checked } }));
  };

  const handleValueChange = (code: number, field: 'full' | 'pass' | 'type', value: string | number) => {
      setSelectedSubjects(prev => ({ ...prev, [code]: { ...prev[code], [field]: value } }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const subjectsToInsert = Object.entries(selectedSubjects)
        .filter(([_, val]) => val.selected)
        .map(([code, val]) => ({
            class_id: classId,
            name: subjectCodes.common[parseInt(code)],
            code: code.toString(),
            full_marks: Number(val.full),
            pass_marks: Number(val.pass),
            exam_type: val.type
        }));

    if (manualSubject.name) {
        let finalCode = manualSubject.code;
        if (!finalCode) finalCode = `MAN-${Math.floor(1000 + Math.random() * 9000)}`;
        
        subjectsToInsert.push({
            class_id: classId,
            name: manualSubject.name,
            code: finalCode,
            full_marks: Number(manualSubject.full),
            pass_marks: Number(manualSubject.pass),
            exam_type: manualSubject.type
        });
    }

    if (subjectsToInsert.length === 0) {
        alert("অন্তত একটি বিষয় সিলেক্ট করুন।");
        setIsSubmitting(false);
        return;
    }

    const { error } = await supabase
        .from("academic_subjects")
        .upsert(subjectsToInsert, { onConflict: 'class_id, code' });

    if (error) {
      alert("সমস্যা হয়েছে: " + error.message);
    } else {
      setIsOpen(false);
      setManualSubject({ name: "", code: "", full: 100, pass: 33, type: "Written" });
      fetchData(); 
    }
    setIsSubmitting(false);
  };

  const handleEditClick = (subject: any) => {
      setEditingSubject(subject);
      setIsEditOpen(true);
  };

  const handleUpdateSubject = async () => {
      if (!editingSubject) return;
      setIsSubmitting(true);
      const { error } = await supabase.from("academic_subjects").update({
          name: editingSubject.name,
          code: editingSubject.code,
          full_marks: editingSubject.full_marks,
          pass_marks: editingSubject.pass_marks,
          exam_type: editingSubject.exam_type
      }).eq("id", editingSubject.id);

      if (error) alert("আপডেট করা যায়নি!");
      else {
          setIsEditOpen(false);
          setEditingSubject(null);
          fetchData();
      }
      setIsSubmitting(false);
  };

  // --- Delete Handler (Open Modal) ---
  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  // --- Confirm Delete ---
  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    const formatDbError = (err: any) => {
      if (!err) return "";
      const message = String(err.message || "");
      const details = err.details ? `\nDetails: ${err.details}` : "";
      const hint = err.hint ? `\nHint: ${err.hint}` : "";
      const code = err.code ? `\nCode: ${err.code}` : "";
      return `${message}${details}${hint}${code}`.trim();
    };

    const serverResult = await removeAcademicSubject(deleteId);
    if (serverResult?.success) {
      fetchData();
      setIsDeleteOpen(false);
      setDeleteId(null);
      setIsSubmitting(false);
      return;
    }
    if (serverResult && "error" in serverResult && serverResult.error) {
      const serverText = formatDbError(serverResult.error);
      if (serverText) {
        alert("রিমুভ করা যায়নি (সার্ভার):\n\n" + serverText);
      }
    }

    const { error: hardError } = await supabase.from("academic_subjects").delete().eq("id", deleteId);
    if (!hardError) {
      fetchData();
      setIsDeleteOpen(false);
      setDeleteId(null);
      setIsSubmitting(false);
      return;
    }

    const { error: softError } = await supabase
      .from("academic_subjects")
      .update({ is_active: false })
      .eq("id", deleteId);

    if (!softError) {
      fetchData();
      setIsDeleteOpen(false);
      setDeleteId(null);
      setIsSubmitting(false);
      return;
    }

    const hardText = formatDbError(hardError);
    const softText = formatDbError(softError);
    const softMissingColumn = softText.toLowerCase().includes("is_active");
    const permissionDenied = (hardText + " " + softText).toLowerCase().includes("permission denied");

    if (permissionDenied) {
      alert("ডিলিট করার পারমিশন নেই। (Supabase RLS/Policy বা লগইন সেশন চেক করুন)\n\n" + hardText + "\n\n" + softText);
    } else if (softMissingColumn) {
      alert("এই ফিচারটি চালাতে ডাটাবেসে academic_subjects টেবিলে is_active কলাম যোগ করতে হবে। Supabase migrations রান করুন।\n\n" + hardText + "\n\n" + softText);
    } else {
      alert(hardText || softText);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Book className="w-5 h-5 text-purple-600" /> বিষয় তালিকা ({subjects.length})
        </h3>
        <Button onClick={() => setIsOpen(true)} className="bg-purple-600 hover:bg-purple-700 shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> নতুন বিষয় যোগ
        </Button>
      </div>

      {/* Subject List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-purple-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-white">
                <TableRow>
                    <TableHead>কোড</TableHead>
                    <TableHead>বিষয়ের নাম</TableHead>
                    <TableHead>ধরণ</TableHead>
                    <TableHead>পূর্ণ নম্বর</TableHead>
                    <TableHead>পাস নম্বর</TableHead>
                    <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {subjects.map((sub) => (
                    <TableRow key={sub.id} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-xs text-gray-500">{sub.code || "-"}</TableCell>
                    <TableCell className="font-bold text-gray-700">{sub.name}</TableCell>
                    <TableCell>
                        <span className={`text-[10px] uppercase px-2 py-1 rounded border font-bold ${sub.exam_type === 'Written' ? 'bg-blue-50 text-blue-600 border-blue-100' : sub.exam_type === 'Oral' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600'}`}>
                            {sub.exam_type === 'Written' ? 'লিখিত' : sub.exam_type === 'Oral' ? 'মৌখিক' : 'ব্যবহারিক'}
                        </span>
                    </TableCell>
                    <TableCell>{sub.full_marks}</TableCell>
                    <TableCell className="text-red-600 font-bold">{sub.pass_marks}</TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(sub)} className="text-blue-500 hover:bg-blue-50 h-8 w-8">
                                <Edit className="w-4 h-4" />
                            </Button>
                            {/* ডিলিট বাটন ক্লিক করলে এখন মডাল ওপেন হবে */}
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(sub.id)} className="text-red-400 hover:bg-red-50 h-8 w-8">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </TableCell>
                    </TableRow>
                ))}
                {subjects.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-gray-400 italic">এখনো কোনো বিষয় যোগ করা হয়নি।</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* 1. Add Subject Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Book className="w-5 h-5 text-purple-600" /> বিষয় নির্বাচন করুন ({classInfo?.name})
            </DialogTitle>
            <DialogDescription>
                নিচের তালিকা থেকে প্রয়োজনীয় বিষয়গুলোতে টিক দিন। ইতিমধ্যে যুক্ত থাকা বিষয়গুলো অটোমেটিক চেক করা হবে।
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-2">
            {/* Preset List */}
            <div className="border rounded-lg overflow-hidden shadow-sm">
                <div className="max-h-[300px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b sticky top-0 z-10">
                            <tr>
                                <th className="p-3 w-10">#</th>
                                <th className="p-3 w-16">কোড</th>
                                <th className="p-3">বিষয়ের নাম</th>
                                <th className="p-3 w-28">ধরণ</th>
                                <th className="p-3 w-24 text-center">পূর্ণমান</th>
                                <th className="p-3 w-24 text-center">পাস</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {Object.keys(selectedSubjects).map((codeStr) => {
                                const code = parseInt(codeStr);
                                const data = selectedSubjects[code];
                                const isAlreadyInDB = subjects.some(s => s.code == code.toString());

                                return (
                                    <tr key={code} className={isAlreadyInDB ? "bg-gray-100 opacity-60" : (data.selected ? "bg-purple-50/50" : "hover:bg-gray-50")}>
                                        <td className="p-3">
                                            {isAlreadyInDB ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <input 
                                                    type="checkbox" 
                                                    checked={data.selected} 
                                                    onChange={(e) => handleCheckboxChange(code, e.target.checked)}
                                                    className="w-4 h-4 accent-purple-600 cursor-pointer"
                                                />
                                            )}
                                        </td>
                                        <td className="p-3 font-mono text-xs text-gray-500">{code}</td>
                                        <td className="p-3 font-medium text-gray-800">
                                            {subjectCodes.common[code]}
                                            {isAlreadyInDB && <span className="ml-2 text-[10px] text-green-600 font-bold border border-green-200 px-1 rounded bg-white">যুক্ত আছে</span>}
                                        </td>
                                        <td className="p-3">
                                            <select 
                                                value={data.type} onChange={(e) => handleValueChange(code, 'type', e.target.value)} 
                                                disabled={!data.selected || isAlreadyInDB}
                                                className="h-8 px-2 text-xs border rounded bg-white w-full disabled:bg-gray-100"
                                            >
                                                <option value="Written">লিখিত</option>
                                                <option value="Oral">মৌখিক</option>
                                                <option value="Practical">ব্যবহারিক</option>
                                            </select>
                                        </td>
                                        <td className="p-3 text-center">
                                            <Input type="number" value={data.full} onChange={(e) => handleValueChange(code, 'full', parseInt(e.target.value))} disabled={!data.selected || isAlreadyInDB} className="h-8 w-20 text-center bg-white disabled:bg-gray-100" />
                                        </td>
                                        <td className="p-3 text-center">
                                            <Input type="number" value={data.pass} onChange={(e) => handleValueChange(code, 'pass', parseInt(e.target.value))} disabled={!data.selected || isAlreadyInDB} className="h-8 w-20 text-center text-red-600 font-bold bg-white disabled:bg-gray-100" />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Manual Subject */}
            <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">তালিকায় নেই? ম্যানুয়ালি যোগ করুন</p>
                <div className="flex flex-col md:flex-row gap-2">
                    <Input placeholder="নাম (উদাঃ পদার্থ)" value={manualSubject.name} onChange={(e) => setManualSubject({...manualSubject, name: e.target.value})} className="flex-1 h-9 bg-white" />
                    <Input placeholder="কোড (ঐচ্ছিক)" value={manualSubject.code} onChange={(e) => setManualSubject({...manualSubject, code: e.target.value})} className="w-20 h-9 bg-white" />
                    <select value={manualSubject.type} onChange={(e) => setManualSubject({...manualSubject, type: e.target.value})} className="h-9 px-2 text-xs border rounded bg-white w-24">
                        <option value="Written">লিখিত</option>
                        <option value="Oral">মৌখিক</option>
                        <option value="Practical">ব্যবহারিক</option>
                    </select>
                    <div className="flex gap-2">
                        <Input type="number" placeholder="Total" value={manualSubject.full} onChange={(e) => setManualSubject({...manualSubject, full: parseInt(e.target.value)})} className="w-20 h-9 bg-white" />
                        <Input type="number" placeholder="Pass" value={manualSubject.pass} onChange={(e) => setManualSubject({...manualSubject, pass: parseInt(e.target.value)})} className="w-20 h-9 bg-white text-red-600 font-bold" />
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button onClick={() => setIsOpen(false)} variant="outline">বাতিল</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 font-bold shadow-md">
                    {isSubmitting ? <><Loader2 className="animate-spin mr-2" /> সেভ হচ্ছে...</> : "সংরক্ষণ করুন"}
                </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Edit Subject Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[500px]">
              <DialogHeader><DialogTitle>বিষয় সংশোধন</DialogTitle><DialogDescription>তথ্য পরিবর্তন করে আপডেট করুন</DialogDescription></DialogHeader>
              {editingSubject && (
                  <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1"><label className="text-xs font-bold text-gray-500">নাম</label><Input value={editingSubject.name} onChange={(e) => setEditingSubject({...editingSubject, name: e.target.value})} /></div>
                          <div className="space-y-1"><label className="text-xs font-bold text-gray-500">কোড</label><Input value={editingSubject.code} onChange={(e) => setEditingSubject({...editingSubject, code: e.target.value})} /></div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500">পরীক্ষার ধরণ</label>
                          <select value={editingSubject.exam_type} onChange={(e) => setEditingSubject({...editingSubject, exam_type: e.target.value})} className="w-full h-10 px-3 border rounded-md bg-white text-sm">
                              <option value="Written">লিখিত (Written)</option>
                              <option value="Oral">মৌখিক (Oral)</option>
                              <option value="Practical">ব্যবহারিক (Practical)</option>
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1"><label className="text-xs font-bold text-gray-500">পূর্ণ নম্বর</label><Input type="number" value={editingSubject.full_marks} onChange={(e) => setEditingSubject({...editingSubject, full_marks: e.target.value})} /></div>
                          <div className="space-y-1"><label className="text-xs font-bold text-gray-500">পাস নম্বর</label><Input type="number" value={editingSubject.pass_marks} onChange={(e) => setEditingSubject({...editingSubject, pass_marks: e.target.value})} className="text-red-600 font-bold" /></div>
                      </div>
                      <DialogFooter>
                          <Button variant="outline" onClick={() => setIsEditOpen(false)}>বাতিল</Button>
                          <Button onClick={handleUpdateSubject} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">{isSubmitting ? "আপডেট হচ্ছে..." : "আপডেট করুন"}</Button>
                      </DialogFooter>
                  </div>
              )}
          </DialogContent>
      </Dialog>

      {/* 3. Delete Confirmation Modal (NEW) */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-sm">
             <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="w-5 h-5"/> ডিলিট নিশ্চিতকরণ</DialogTitle>
                <DialogDescription>আপনি কি নিশ্চিত যে আপনি এই বিষয়টি তালিকা থেকে মুছে ফেলতে চান?</DialogDescription>
             </DialogHeader>
             <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>না, বাতিল</Button>
                <Button variant="destructive" onClick={confirmDelete} disabled={isSubmitting}>
                   {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <><Trash2 className="w-4 h-4 mr-2" /> হ্যাঁ, ডিলিট</>}
                </Button>
             </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
