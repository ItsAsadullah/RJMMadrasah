"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { STUDENT_STATUSES, getStudentStatus, type StudentStatus } from "@/lib/studentStatus";
import { supabase } from "@/lib/supabase/client";
import { updateStudentStatus } from "@/lib/updateStudentStatus";

type StatusStudent = { id: string; name_bn: string; status: string };

// Mount with the selected students so every opening starts with fresh form state.
export default function StudentStatusDialog({ students, onClose, onUpdated }: {
  students: StatusStudent[];
  onClose: () => void;
  onUpdated: (rows: { id: string; status: string }[]) => void;
}) {
  const initialStatus = students.length === 1 ? getStudentStatus(students[0].status).value : "";
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const changedStudents = students.filter((student) => student.status !== status);

  async function save() {
    if (submitting.current || !STUDENT_STATUSES.some((option) => option.value === status) || !changedStudents.length) return;
    submitting.current = true;
    setSaving(true);
    setError("");
    try {
      const { updated, complete } = await updateStudentStatus(supabase, changedStudents.map(student => student.id), status as StudentStatus);
      if (updated.length) onUpdated(updated);
      if (!complete) {
        setError(`${updated.length} জনের স্ট্যাটাস পরিবর্তন হয়েছে। বাকি শিক্ষার্থীদের তথ্য বা পরিবর্তনের অনুমতি পাওয়া যায়নি। তালিকা রিফ্রেশ করে আবার চেষ্টা করুন।`);
        return;
      }
      onClose();
    } catch {
      setError("স্ট্যাটাস সংরক্ষণ করা যায়নি। সংযোগ ও পরিবর্তনের অনুমতি যাচাই করে আবার চেষ্টা করুন।");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !submitting.current) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>শিক্ষার্থীর স্ট্যাটাস পরিবর্তন</DialogTitle>
          <DialogDescription>
            {students.length === 1
              ? `${students[0].name_bn} — বর্তমান স্ট্যাটাস: ${getStudentStatus(students[0].status).label}`
              : `${students.length} জন নির্বাচিত শিক্ষার্থীর স্ট্যাটাস পরিবর্তন করুন।`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <label htmlFor="student-status" className="text-sm font-medium">নতুন স্ট্যাটাস</label>
          <select id="student-status" value={status} onChange={(event) => setStatus(event.target.value)} disabled={saving} className="w-full rounded-md border bg-white p-2 text-sm">
            <option value="" disabled>স্ট্যাটাস নির্বাচন করুন</option>
            {!STUDENT_STATUSES.some((option) => option.value === initialStatus) && initialStatus && <option value={initialStatus} disabled>{getStudentStatus(initialStatus).label}</option>}
            {STUDENT_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          {status === "inactive" && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">শিক্ষার্থীকে “নিষ্ক্রিয়” তালিকায় রাখা হবে। পুরোনো তথ্য ও হিসাব সংরক্ষিত থাকবে। ফিরে এলে আবার সক্রিয় করতে পারবেন।</p>}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={onClose}>বাতিল</Button>
          <Button disabled={saving || !status || !changedStudents.length} onClick={save} className="bg-green-600 hover:bg-green-700">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "সংরক্ষণ হচ্ছে..." : "স্ট্যাটাস সংরক্ষণ করুন"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
