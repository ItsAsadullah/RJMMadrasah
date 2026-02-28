"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus, Trash2, Book, Loader2, Edit, Save, CheckCircle2, AlertTriangle,
  Search, X, PlusCircle, RotateCcw, BookOpen, ListPlus,
} from "lucide-react";
import { subjectCodes } from "@/data/bangladesh-data";
import { removeAcademicSubject } from "@/app/(admin)/dashboard/academic/subjects/actions";

// -------------- Types ----------------
type ExistingEditable = {
  name: string;
  code: string;
  full_marks: number;
  pass_marks: number;
  exam_type: string;
  changed: boolean;
  markedForRemove: boolean;
};

type ManualRow = {
  id: number;
  name: string;
  code: string;
  full: number;
  pass: number;
  type: string;
};

// -------------- Component ----------------
export default function ClassSubjectSetup({ branchId, classId }: { branchId: string; classId: string }) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [modalSearch, setModalSearch] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<{
    [code: number]: { selected: boolean; full: number; pass: number; type: string };
  }>({});
  const [editableExisting, setEditableExisting] = useState<{ [id: string]: ExistingEditable }>({});
  const [manualRows, setManualRows] = useState<ManualRow[]>([
    { id: 1, name: "", code: "", full: 100, pass: 33, type: "Written" },
  ]);
  const [manualCounter, setManualCounter] = useState(2);
  const [modalTab, setModalTab] = useState<"edit" | "add">("edit");

  // Inline edit state for main table
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditData, setInlineEditData] = useState<{ name: string; code: string; full_marks: number; pass_marks: number; exam_type: string }>({ name: "", code: "", full_marks: 100, pass_marks: 33, exam_type: "Written" });

  // New subject row state (bottom of table)
  const [newRow, setNewRow] = useState({ name: "", code: "", full: 100, pass: 33, type: "Written" });
  const [isAddingNew, setIsAddingNew] = useState(false);

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
        return { class_id: classId, name: s.subject_name, code, full_marks: Number(s.full_marks ?? 100), pass_marks: Number(s.pass_marks ?? 33), exam_type: "Written" };
      })
      .filter((row: any) => !existingCodes.has(String(row.code)));
    if (toInsert.length === 0) return false;
    const { error: insertError } = await supabase.from("academic_subjects").upsert(toInsert, { onConflict: "class_id, code", ignoreDuplicates: true });
    if (insertError) return false;
    return true;
  };

  useEffect(() => { fetchData(); }, [classId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: cls } = await supabase.from("academic_classes").select("*, branches(name)").eq("id", classId).single();
    if (cls) {
      setClassInfo(cls);
      let subs: any[] = [];
      const { data: subsActive, error: subsActiveError } = await supabase
        .from("academic_subjects").select("*").eq("class_id", classId)
        .or("is_active.eq.true,is_active.is.null").order("code", { ascending: true });
      if (!subsActiveError) {
        subs = subsActive || [];
      } else if (subsActiveError.message.toLowerCase().includes("is_active")) {
        const { data: subsFallback } = await supabase.from("academic_subjects").select("*").eq("class_id", classId).order("code", { ascending: true });
        subs = subsFallback || [];
      }
      const didSync = await syncFromAcademicConfigSubjects(cls, subs);
      if (didSync) {
        let syncedSubs: any[] = [];
        const { data: syncedSubsActive, error: syncedSubsActiveError } = await supabase
          .from("academic_subjects").select("*").eq("class_id", classId)
          .or("is_active.eq.true,is_active.is.null").order("code", { ascending: true });
        if (!syncedSubsActiveError) {
          syncedSubs = syncedSubsActive || [];
        } else {
          const { data: f } = await supabase.from("academic_subjects").select("*").eq("class_id", classId).order("code", { ascending: true });
          syncedSubs = f || [];
        }
        setSubjects(syncedSubs);
        preparePresets(cls.name, syncedSubs);
      } else {
        setSubjects(subs);
        preparePresets(cls.name, subs);
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
      initialSelection[code] = { selected: isRecommended && !isAlreadyAdded, full: 100, pass: 33, type: "Written", name: subjectCodes.common[code], codeStr: code.toString() };
    });
    setSelectedSubjects(initialSelection);
  };

  const openAddModal = () => {
    const map: { [id: string]: ExistingEditable } = {};
    subjects.forEach((s) => {
      map[s.id] = { name: s.name, code: s.code, full_marks: s.full_marks, pass_marks: s.pass_marks, exam_type: s.exam_type || "Written", changed: false, markedForRemove: false };
    });
    setEditableExisting(map);
    setManualRows([{ id: 1, name: "", code: "", full: 100, pass: 33, type: "Written" }]);
    setManualCounter(2);
    setModalSearch("");
    // Default to "edit" tab if subjects exist, otherwise "add" tab
    setModalTab(subjects.length > 0 ? "edit" : "add");
    setIsOpen(true);
  };

  // ── Inline edit handlers ──────────────────────────────────────────
  const startInlineEdit = (sub: any) => {
    setInlineEditId(sub.id);
    setInlineEditData({ name: sub.name, code: sub.code || "", full_marks: sub.full_marks, pass_marks: sub.pass_marks, exam_type: sub.exam_type || "Written" });
  };

  const cancelInlineEdit = () => { setInlineEditId(null); };

  const saveInlineEdit = async () => {
    if (!inlineEditId) return;
    setIsSubmitting(true);
    const { error } = await supabase.from("academic_subjects").update({
      name: inlineEditData.name,
      code: inlineEditData.code,
      full_marks: inlineEditData.full_marks,
      pass_marks: inlineEditData.pass_marks,
      exam_type: inlineEditData.exam_type,
    }).eq("id", inlineEditId);
    if (error) alert("আপডেট করা যায়নি: " + error.message);
    else { setInlineEditId(null); fetchData(); }
    setIsSubmitting(false);
  };

  // ── Quick add new subject row ────────────────────────────────────
  const saveNewRow = async () => {
    if (!newRow.name.trim()) return alert("বিষয়ের নাম দিন।");
    setIsAddingNew(true);
    let finalCode = newRow.code.trim() || `MAN-${Math.floor(1000 + Math.random() * 9000)}`;
    const { error } = await supabase.from("academic_subjects").insert([{
      class_id: classId,
      name: newRow.name.trim(),
      code: finalCode,
      full_marks: Number(newRow.full),
      pass_marks: Number(newRow.pass),
      exam_type: newRow.type,
    }]);
    if (error) alert("যোগ করা যায়নি: " + error.message);
    else { setNewRow({ name: "", code: "", full: 100, pass: 33, type: "Written" }); fetchData(); }
    setIsAddingNew(false);
  };

  const handleCheckboxChange = (code: number, checked: boolean) => {    setSelectedSubjects((prev) => ({ ...prev, [code]: { ...prev[code], selected: checked } }));
  };

  const handleValueChange = (code: number, field: "full" | "pass" | "type" | "name" | "codeStr", value: string | number) => {
    setSelectedSubjects((prev) => ({ ...prev, [code]: { ...prev[code], [field]: value } }));
  };

  const handleExistingChange = (id: string, field: keyof ExistingEditable, value: any) => {
    setEditableExisting((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value, changed: true } }));
  };

  const toggleRemoveExisting = (id: string) => {
    setEditableExisting((prev) => ({ ...prev, [id]: { ...prev[id], markedForRemove: !prev[id].markedForRemove, changed: true } }));
  };

  const addManualRow = () => {
    setManualRows((prev) => [...prev, { id: manualCounter, name: "", code: "", full: 100, pass: 33, type: "Written" }]);
    setManualCounter((c) => c + 1);
  };

  const removeManualRow = (id: number) => {
    setManualRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateManualRow = (id: number, field: keyof ManualRow, value: any) => {
    setManualRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // 1. Newly selected preset subjects
    const subjectsToUpsert: any[] = Object.entries(selectedSubjects)
      .filter(([_, val]) => val.selected)
      .map(([code, val]) => ({
        class_id: classId,
        name: (val as any).name || subjectCodes.common[parseInt(code)],
        code: (val as any).codeStr || code.toString(),
        full_marks: Number(val.full),
        pass_marks: Number(val.pass),
        exam_type: val.type,
      }));
    // 2. Filled manual rows
    manualRows.filter((r) => r.name.trim()).forEach((r) => {
      let finalCode = r.code.trim() || `MAN-${Math.floor(1000 + Math.random() * 9000)}`;
      subjectsToUpsert.push({ class_id: classId, name: r.name.trim(), code: finalCode, full_marks: Number(r.full), pass_marks: Number(r.pass), exam_type: r.type });
    });

    if (subjectsToUpsert.length > 0) {
      const { error } = await supabase.from("academic_subjects").upsert(subjectsToUpsert, { onConflict: "class_id, code" });
      if (error) { alert("বিষয় যোগ করতে সমস্যা: " + error.message); setIsSubmitting(false); return; }
    }

    // 3. Update changed existing subjects
    const toUpdate = Object.entries(editableExisting).filter(([_, v]) => v.changed && !v.markedForRemove);
    for (const [id, v] of toUpdate) {
      await supabase.from("academic_subjects").update({ name: v.name, code: v.code, full_marks: v.full_marks, pass_marks: v.pass_marks, exam_type: v.exam_type }).eq("id", id);
    }

    // 4. Remove marked for removal
    const toRemove = Object.entries(editableExisting).filter(([_, v]) => v.markedForRemove);
    for (const [id] of toRemove) {
      const result = await removeAcademicSubject(id);
      if (!result?.success) await supabase.from("academic_subjects").delete().eq("id", id);
    }

    if (subjectsToUpsert.length === 0 && toUpdate.length === 0 && toRemove.length === 0) {
      alert("কোনো পরিবর্তন করা হয়নি।"); setIsSubmitting(false); return;
    }
    setIsOpen(false);
    fetchData();
    setIsSubmitting(false);
  };

  const handleEditClick = (subject: any) => { setEditingSubject(subject); setIsEditOpen(true); };

  const handleUpdateSubject = async () => {
    if (!editingSubject) return;
    setIsSubmitting(true);
    const { error } = await supabase.from("academic_subjects").update({
      name: editingSubject.name, code: editingSubject.code,
      full_marks: editingSubject.full_marks, pass_marks: editingSubject.pass_marks, exam_type: editingSubject.exam_type,
    }).eq("id", editingSubject.id);
    if (error) alert("আপডেট করা যায়নি!");
    else { setIsEditOpen(false); setEditingSubject(null); fetchData(); }
    setIsSubmitting(false);
  };

  const handleDeleteClick = (id: string) => { setDeleteId(id); setIsDeleteOpen(true); };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    const formatDbError = (err: any) => {
      if (!err) return "";
      return [err.message, err.details && `Details: ${err.details}`, err.hint && `Hint: ${err.hint}`, err.code && `Code: ${err.code}`].filter(Boolean).join("\n");
    };
    const serverResult = await removeAcademicSubject(deleteId);
    if (serverResult?.success) { fetchData(); setIsDeleteOpen(false); setDeleteId(null); setIsSubmitting(false); return; }
    const { error: hardError } = await supabase.from("academic_subjects").delete().eq("id", deleteId);
    if (!hardError) { fetchData(); setIsDeleteOpen(false); setDeleteId(null); setIsSubmitting(false); return; }
    const { error: softError } = await supabase.from("academic_subjects").update({ is_active: false }).eq("id", deleteId);
    if (!softError) { fetchData(); setIsDeleteOpen(false); setDeleteId(null); setIsSubmitting(false); return; }
    const hardText = formatDbError(hardError);
    const softText = formatDbError(softError);
    if ((hardText + softText).toLowerCase().includes("permission denied")) alert("ডিলিট পারমিশন নেই।\n\n" + hardText);
    else if (softText.toLowerCase().includes("is_active")) alert("is_active কলাম যোগ করুন।\n\n" + hardText);
    else alert(hardText || softText);
    setIsSubmitting(false);
  };

  const examTypeLabel = (t: string) => t === "Written" ? "লিখিত" : t === "Oral" ? "মৌখিক" : "ব্যবহারিক";
  const examTypeClass = (t: string) => t === "Written" ? "bg-blue-50 text-blue-600 border-blue-100" : t === "Oral" ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-green-50 text-green-600";

  // Filtered preset codes for modal (exclude already in DB)
  const filteredPresetCodes = Object.keys(selectedSubjects).filter((codeStr) => {
    const isAlreadyInDB = subjects.some((s) => s.code == codeStr);
    if (isAlreadyInDB) return false;
    if (!modalSearch) return true;
    return subjectCodes.common[parseInt(codeStr)]?.toString().toLowerCase().includes(modalSearch.toLowerCase());
  });

  // Filtered existing IDs for modal
  const filteredExistingIds = Object.keys(editableExisting).filter((id) => {
    if (!modalSearch) return true;
    return editableExisting[id].name.toLowerCase().includes(modalSearch.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Book className="w-5 h-5 text-purple-600" /> বিষয় তালিকা ({subjects.length})
        </h3>
        <Button onClick={openAddModal} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
          <ListPlus className="w-4 h-4 mr-2" /> তালিকা থেকে একসাথে যোগ
        </Button>
      </div>

      {/* Inline-editable Subject Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-purple-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-500 font-semibold text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left w-20">কোড</th>
                  <th className="px-4 py-3 text-left">বিষয়ের নাম</th>
                  <th className="px-4 py-3 text-left w-28">ধরণ</th>
                  <th className="px-4 py-3 text-center w-24">পূর্ণ নম্বর</th>
                  <th className="px-4 py-3 text-center w-24">পাস নম্বর</th>
                  <th className="px-4 py-3 text-right w-28">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subjects.map((sub) => {
                  const isEditing = inlineEditId === sub.id;
                  return (
                    <tr key={sub.id} className={isEditing ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50 transition-colors"}>
                      {isEditing ? (
                        <>
                          <td className="px-3 py-2">
                            <Input value={inlineEditData.code} onChange={(e) => setInlineEditData(p => ({ ...p, code: e.target.value }))} className="h-8 text-xs font-mono w-full" placeholder="কোড" />
                          </td>
                          <td className="px-3 py-2">
                            <Input value={inlineEditData.name} onChange={(e) => setInlineEditData(p => ({ ...p, name: e.target.value }))} className="h-8 text-sm font-medium w-full" placeholder="বিষয়ের নাম" autoFocus />
                          </td>
                          <td className="px-3 py-2">
                            <select value={inlineEditData.exam_type} onChange={(e) => setInlineEditData(p => ({ ...p, exam_type: e.target.value }))}
                              className="h-8 px-2 text-xs border rounded bg-white w-full">
                              <option value="Written">লিখিত</option>
                              <option value="Oral">মৌখিক</option>
                              <option value="Practical">ব্যবহারিক</option>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <Input type="number" value={inlineEditData.full_marks} onChange={(e) => setInlineEditData(p => ({ ...p, full_marks: parseInt(e.target.value) }))} className="h-8 text-center w-full" />
                          </td>
                          <td className="px-3 py-2">
                            <Input type="number" value={inlineEditData.pass_marks} onChange={(e) => setInlineEditData(p => ({ ...p, pass_marks: parseInt(e.target.value) }))} className="h-8 text-center w-full text-red-600 font-bold" />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" onClick={saveInlineEdit} disabled={isSubmitting} className="h-8 bg-blue-600 hover:bg-blue-700 text-white px-3">
                                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Save className="w-3 h-3 mr-1" />সেভ</>}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelInlineEdit} className="h-8 px-2 text-gray-500 hover:bg-gray-100">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-mono text-xs text-gray-400">{sub.code || "—"}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{sub.name}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] uppercase px-2 py-1 rounded border font-bold ${examTypeClass(sub.exam_type)}`}>
                              {examTypeLabel(sub.exam_type)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">{sub.full_marks}</td>
                          <td className="px-4 py-3 text-center text-red-600 font-bold">{sub.pass_marks}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => startInlineEdit(sub)} className="text-blue-500 hover:bg-blue-50 h-8 w-8" title="সম্পাদনা">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(sub.id)} className="text-red-400 hover:bg-red-50 h-8 w-8" title="মুছুন">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}

                {/* ── New subject add row ── */}
                <tr className="bg-green-50/60 border-t-2 border-dashed border-green-200">
                  <td className="px-3 py-2">
                    <Input value={newRow.code} onChange={(e) => setNewRow(p => ({ ...p, code: e.target.value }))}
                      placeholder="কোড" className="h-8 text-xs font-mono w-full bg-white" />
                  </td>
                  <td className="px-3 py-2">
                    <Input value={newRow.name} onChange={(e) => setNewRow(p => ({ ...p, name: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && saveNewRow()}
                      placeholder="+ নতুন বিষয়ের নাম লিখুন..." className="h-8 text-sm w-full bg-white" />
                  </td>
                  <td className="px-3 py-2">
                    <select value={newRow.type} onChange={(e) => setNewRow(p => ({ ...p, type: e.target.value }))}
                      className="h-8 px-2 text-xs border rounded bg-white w-full">
                      <option value="Written">লিখিত</option>
                      <option value="Oral">মৌখিক</option>
                      <option value="Practical">ব্যবহারিক</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <Input type="number" value={newRow.full} onChange={(e) => setNewRow(p => ({ ...p, full: parseInt(e.target.value) }))}
                      className="h-8 text-center w-full bg-white" />
                  </td>
                  <td className="px-3 py-2">
                    <Input type="number" value={newRow.pass} onChange={(e) => setNewRow(p => ({ ...p, pass: parseInt(e.target.value) }))}
                      className="h-8 text-center w-full bg-white text-red-600 font-bold" />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" onClick={saveNewRow} disabled={isAddingNew || !newRow.name.trim()}
                      className="h-8 bg-green-600 hover:bg-green-700 text-white px-3">
                      {isAddingNew ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Plus className="w-3 h-3 mr-1" />যোগ</>}
                    </Button>
                  </td>
                </tr>

                {subjects.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400 italic text-sm">
                      নিচের সবুজ ঘরে বিষয়ের নাম লিখে "যোগ" বাটন চাপুন।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          1. ADVANCED Add / Edit Subject Modal
          ══════════════════════════════════════════════ */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[940px] max-h-[92vh] flex flex-col p-0 gap-0">

          {/* Fixed Header */}
          <DialogHeader className="px-6 pt-5 pb-3 border-b bg-white rounded-t-lg shrink-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Book className="w-5 h-5 text-purple-600" /> বিষয় ম্যানেজমেন্ট — {classInfo?.name}
            </DialogTitle>
            <DialogDescription className="sr-only">বিষয় যোগ ও সম্পাদনা</DialogDescription>

            {/* Tab Switcher */}
            <div className="flex gap-1 mt-3 p-1 bg-gray-100 rounded-lg w-fit">
              <button
                onClick={() => { setModalTab("edit"); setModalSearch(""); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  modalTab === "edit"
                    ? "bg-white text-green-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                যুক্ত বিষয় সম্পাদনা
                {Object.keys(editableExisting).length > 0 && (
                  <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${modalTab === "edit" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                    {Object.keys(editableExisting).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setModalTab("add"); setModalSearch(""); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  modalTab === "add"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <ListPlus className="w-4 h-4" />
                নতুন বিষয় যোগ
              </button>
            </div>

            {/* Search bar (shown on add tab and when editing with many subjects) */}
            {(modalTab === "add" || Object.keys(editableExisting).length > 5) && (
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={modalSearch} onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="বিষয়ের নাম দিয়ে খুঁজুন..." className="pl-9 h-9" />
                {modalSearch && (
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setModalSearch("")}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </DialogHeader>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 min-h-0">

            {/* ════ TAB: যুক্ত বিষয় সম্পাদনা ════ */}
            {modalTab === "edit" && (
              <div>
                {Object.keys(editableExisting).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <BookOpen className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">এই ক্লাসে এখনো কোনো বিষয় যোগ করা হয়নি।</p>
                    <p className="text-gray-400 text-sm mt-1">নতুন বিষয় যোগ করতে উপরে <strong>"নতুন বিষয় যোগ"</strong> ট্যাবে যান।</p>
                    <Button onClick={() => setModalTab("add")} className="mt-4 bg-purple-600 hover:bg-purple-700" size="sm">
                      <ListPlus className="w-4 h-4 mr-2" /> নতুন বিষয় যোগ করুন
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="px-4 py-2.5 bg-green-50 border-b flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wide text-green-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ইতিমধ্যে যুক্ত {Object.keys(editableExisting).length}টি বিষয় — সরাসরি সম্পাদনা করুন
                      </p>
                      <span className="text-[10px] text-green-600 bg-green-100 px-2 py-1 rounded font-medium">
                        চেকবক্স আনচেক = মুছে ফেলা
                      </span>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="p-2 w-10 text-center text-gray-500 font-medium text-xs">রাখুন</th>
                          <th className="p-2 text-gray-500 font-medium text-xs text-left">বিষয়ের নাম</th>
                          <th className="p-2 w-20 text-gray-500 font-medium text-xs text-left">কোড</th>
                          <th className="p-2 w-32 text-gray-500 font-medium text-xs text-left">ধরণ</th>
                          <th className="p-2 w-24 text-gray-500 font-medium text-xs text-center">পূর্ণমান</th>
                          <th className="p-2 w-24 text-gray-500 font-medium text-xs text-center">পাস</th>
                          <th className="p-2 w-16 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredExistingIds.map((id) => {
                          const row = editableExisting[id];
                          const isRemoving = row.markedForRemove;
                          return (
                            <tr key={id} className={isRemoving ? "bg-red-50 opacity-60" : row.changed ? "bg-amber-50" : "bg-white hover:bg-gray-50 transition-colors"}>
                              <td className="p-2 text-center">
                                <input type="checkbox" checked={!isRemoving} onChange={() => toggleRemoveExisting(id)} className="w-4 h-4 accent-green-600 cursor-pointer" />
                              </td>
                              <td className="p-2">
                                <Input value={row.name} onChange={(e) => handleExistingChange(id, "name", e.target.value)} disabled={isRemoving} className="h-8 text-sm disabled:bg-gray-50 disabled:text-gray-400" />
                              </td>
                              <td className="p-2">
                                <Input value={row.code} onChange={(e) => handleExistingChange(id, "code", e.target.value)} disabled={isRemoving} className="h-8 text-xs font-mono w-full disabled:bg-gray-50 disabled:text-gray-400" />
                              </td>
                              <td className="p-2">
                                <select value={row.exam_type} onChange={(e) => handleExistingChange(id, "exam_type", e.target.value)} disabled={isRemoving}
                                  className="h-8 px-2 text-xs border rounded bg-white w-full disabled:bg-gray-50 disabled:text-gray-400">
                                  <option value="Written">লিখিত</option>
                                  <option value="Oral">মৌখিক</option>
                                  <option value="Practical">ব্যবহারিক</option>
                                </select>
                              </td>
                              <td className="p-2">
                                <Input type="number" value={row.full_marks} onChange={(e) => handleExistingChange(id, "full_marks", parseInt(e.target.value))} disabled={isRemoving} className="h-8 w-full text-center disabled:bg-gray-50" />
                              </td>
                              <td className="p-2">
                                <Input type="number" value={row.pass_marks} onChange={(e) => handleExistingChange(id, "pass_marks", parseInt(e.target.value))} disabled={isRemoving} className="h-8 w-full text-center text-red-600 font-bold disabled:bg-gray-50" />
                              </td>
                              <td className="p-2 text-center">
                                {isRemoving ? (
                                  <button title="পূর্বাবস্থায়" onClick={() => toggleRemoveExisting(id)} className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50">
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                ) : row.changed ? (
                                  <span className="text-[10px] text-amber-600 font-bold px-1 py-0.5 bg-amber-100 rounded">পরিবর্তিত</span>
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ════ TAB: নতুন বিষয় যোগ ════ */}
            {modalTab === "add" && (
              <div className="space-y-5">
                {/* Section B: Preset list */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-purple-700 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> তালিকা থেকে বেছে নিন
                  </p>
                  <div className="border rounded-lg overflow-hidden shadow-sm">
                    <div className="max-h-[300px] overflow-y-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b sticky top-0 z-10">
                          <tr>
                            <th className="p-3 w-10">#</th>
                            <th className="p-3 w-16">কোড</th>
                            <th className="p-3">বিষয়ের নাম</th>
                            <th className="p-3 w-28">ধরণ</th>
                            <th className="p-3 w-24 text-center">পূর্ণমান</th>
                            <th className="p-3 w-24 text-center">পাস</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredPresetCodes.length === 0 ? (
                            <tr><td colSpan={6} className="p-5 text-center text-gray-400 italic text-xs">
                              {modalSearch ? "অনুসন্ধানে কোনো বিষয় পাওয়া যায়নি।" : "সমস্ত বিষয় ইতিমধ্যে যুক্ত হয়েছে।"}
                            </td></tr>
                          ) : filteredPresetCodes.map((codeStr) => {
                            const code = parseInt(codeStr);
                            const data = selectedSubjects[code];
                            if (!data) return null;
                            return (
                              <tr key={code} className={data.selected ? "bg-purple-50/60" : "hover:bg-gray-50"}>
                                <td className="p-3">
                                  <input type="checkbox" checked={data.selected} onChange={(e) => handleCheckboxChange(code, e.target.checked)} className="w-4 h-4 accent-purple-600 cursor-pointer" />
                                </td>
                                <td className="p-3">
                                  <Input value={data.codeStr ?? code.toString()} onChange={(e) => handleValueChange(code, "codeStr", e.target.value)} disabled={!data.selected} className="h-7 w-16 text-xs font-mono text-center bg-white disabled:bg-gray-100 disabled:text-gray-400" />
                                </td>
                                <td className="p-3">
                                  <Input value={data.name ?? subjectCodes.common[code]} onChange={(e) => handleValueChange(code, "name", e.target.value)} disabled={!data.selected} className="h-7 w-full text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 font-medium" />
                                </td>
                                <td className="p-3">
                                  <select value={data.type} onChange={(e) => handleValueChange(code, "type", e.target.value)} disabled={!data.selected}
                                    className="h-8 px-2 text-xs border rounded bg-white w-full disabled:bg-gray-100">
                                    <option value="Written">লিখিত</option>
                                    <option value="Oral">মৌখিক</option>
                                    <option value="Practical">ব্যবহারিক</option>
                                  </select>
                                </td>
                                <td className="p-3 text-center">
                                  <Input type="number" value={data.full} onChange={(e) => handleValueChange(code, "full", parseInt(e.target.value))} disabled={!data.selected} className="h-8 w-20 text-center bg-white disabled:bg-gray-100" />
                                </td>
                                <td className="p-3 text-center">
                                  <Input type="number" value={data.pass} onChange={(e) => handleValueChange(code, "pass", parseInt(e.target.value))} disabled={!data.selected} className="h-8 w-20 text-center text-red-600 font-bold bg-white disabled:bg-gray-100" />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Section C: Multiple manual subjects */}
                <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                      <PlusCircle className="w-3.5 h-3.5 text-purple-500" />
                      তালিকায় নেই? একাধিক বিষয় একসাথে তৈরি করুন
                    </p>
                    <Button size="sm" variant="outline" onClick={addManualRow}
                      className="h-7 text-xs text-purple-600 border-purple-300 hover:bg-purple-50">
                      <PlusCircle className="w-3.5 h-3.5 mr-1" /> আরো যোগ করুন
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {manualRows.map((row) => (
                      <div key={row.id} className="flex flex-wrap gap-2 items-center bg-white p-2 rounded border">
                        <Input placeholder="বিষয়ের নাম (যেমন: পদার্থ)" value={row.name}
                          onChange={(e) => updateManualRow(row.id, "name", e.target.value)}
                          className="flex-1 min-w-[140px] h-9 text-sm" />
                        <Input placeholder="কোড (ঐচ্ছিক)" value={row.code}
                          onChange={(e) => updateManualRow(row.id, "code", e.target.value)}
                          className="w-24 h-9 text-xs font-mono" />
                        <select value={row.type} onChange={(e) => updateManualRow(row.id, "type", e.target.value)}
                          className="h-9 px-2 text-xs border rounded bg-white w-28">
                          <option value="Written">লিখিত</option>
                          <option value="Oral">মৌখিক</option>
                          <option value="Practical">ব্যবহারিক</option>
                        </select>
                        <Input type="number" placeholder="পূর্ণমান" value={row.full}
                          onChange={(e) => updateManualRow(row.id, "full", parseInt(e.target.value))}
                          className="w-20 h-9 text-center" />
                        <Input type="number" placeholder="পাস" value={row.pass}
                          onChange={(e) => updateManualRow(row.id, "pass", parseInt(e.target.value))}
                          className="w-20 h-9 text-center text-red-600 font-bold" />
                        {manualRows.length > 1 && (
                          <button onClick={() => removeManualRow(row.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <DialogFooter className="px-6 py-4 border-t bg-gray-50 rounded-b-lg shrink-0 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {modalTab === "edit"
                ? "পরিবর্তন করা বিষয়গুলো সংরক্ষণ বাটনে সেভ হবে"
                : "নির্বাচিত ও ম্যানুয়াল বিষয়গুলো সংরক্ষণ বাটনে যোগ হবে"}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setIsOpen(false)} variant="outline">বাতিল</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 font-bold shadow-md">
                {isSubmitting ? <><Loader2 className="animate-spin mr-2" /> সেভ হচ্ছে...</> : <><Save className="w-4 h-4 mr-2" /> সংরক্ষণ করুন</>}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════ 2. Quick Edit Modal ════════════ */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>বিষয় সংশোধন</DialogTitle>
            <DialogDescription>তথ্য পরিবর্তন করে আপডেট করুন</DialogDescription>
          </DialogHeader>
          {editingSubject && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500">নাম</label>
                  <Input value={editingSubject.name} onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })} /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500">কোড</label>
                  <Input value={editingSubject.code} onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value })} /></div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">পরীক্ষার ধরণ</label>
                <select value={editingSubject.exam_type} onChange={(e) => setEditingSubject({ ...editingSubject, exam_type: e.target.value })}
                  className="w-full h-10 px-3 border rounded-md bg-white text-sm">
                  <option value="Written">লিখিত (Written)</option>
                  <option value="Oral">মৌখিক (Oral)</option>
                  <option value="Practical">ব্যবহারিক (Practical)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500">পূর্ণ নম্বর</label>
                  <Input type="number" value={editingSubject.full_marks} onChange={(e) => setEditingSubject({ ...editingSubject, full_marks: e.target.value })} /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500">পাস নম্বর</label>
                  <Input type="number" value={editingSubject.pass_marks} onChange={(e) => setEditingSubject({ ...editingSubject, pass_marks: e.target.value })} className="text-red-600 font-bold" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>বাতিল</Button>
                <Button onClick={handleUpdateSubject} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                  {isSubmitting ? "আপডেট হচ্ছে..." : "আপডেট করুন"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════ 3. Delete Confirmation ════════════ */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="w-5 h-5" /> ডিলিট নিশ্চিতকরণ</DialogTitle>
            <DialogDescription>আপনি কি নিশ্চিত যে এই বিষয়টি মুছে ফেলতে চান?</DialogDescription>
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
