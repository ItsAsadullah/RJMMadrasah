"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Layers, ArrowRightLeft, BookOpen, CheckCircle2, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import {
  isHifzDepartment,
  normalizeAcademicText,
  toAsciiDigits,
  getTargetClassRollStats,
  assignSequentialRolls,
  saveSecondaryEnrollmentsHybrid,
} from "@/lib/secondaryEnrollment";

const toBengaliNumber = (num: string | number) =>
  String(num).replace(/[0-9]/g, (c) => "০১২৩৪৫৬৭৮৯"[parseInt(c, 10)]);

type BulkMode = "secondary" | "primary";

type BulkClassAssignDialogProps = {
  open: boolean;
  onClose: () => void;
  selectedStudents: any[];
  allStudents: any[];
  branches: any[];
  dbDepartments: any[];
  dbClasses: any[];
  onCompleted: () => void;
};

export default function BulkClassAssignDialog({
  open,
  onClose,
  selectedStudents,
  allStudents,
  branches,
  dbDepartments,
  dbClasses,
  onCompleted,
}: BulkClassAssignDialogProps) {
  const hasAnyHifz = useMemo(
    () => selectedStudents.some((s) => isHifzDepartment(s.department)),
    [selectedStudents]
  );

  const [mode, setMode] = useState<BulkMode>(hasAnyHifz ? "secondary" : "primary");
  const [targetBranchId, setTargetBranchId] = useState<string>("");
  const [targetDepartment, setTargetDepartment] = useState<string>("");
  const [targetClassName, setTargetClassName] = useState<string>("");
  const [targetYear, setTargetYear] = useState<string>("");
  const [customStartRoll, setCustomStartRoll] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || selectedStudents.length === 0) return;
    const first = selectedStudents[0];
    const defaultMode: BulkMode = selectedStudents.some((s) => isHifzDepartment(s.department))
      ? "secondary"
      : "primary";
    setMode(defaultMode);
    const bId = first?.branch_id ? String(first.branch_id) : branches[0]?.id ? String(branches[0].id) : "";
    setTargetBranchId(bId);
    setTargetYear(String(first?.academic_year || new Date().getFullYear()));

    // Pre-select কিতাব department in secondary mode if available for that branch
    const branchDepts = dbDepartments.filter((d) => String(d.branch_id) === bId);
    const kitabDept = branchDepts.find((d) => normalizeAcademicText(d.name).includes("কিতাব"));
    if (defaultMode === "secondary" && kitabDept) {
      setTargetDepartment(kitabDept.name);
    } else {
      setTargetDepartment("");
    }
    setTargetClassName("");
    setCustomStartRoll("");
    setError("");
  }, [open, selectedStudents, branches, dbDepartments]);

  const departmentOptions = useMemo(() => {
    return dbDepartments.filter((d) => {
      if (targetBranchId && String(d.branch_id) !== String(targetBranchId)) return false;
      if (mode === "secondary" && isHifzDepartment(d.name)) return false;
      return true;
    });
  }, [dbDepartments, targetBranchId, mode]);

  const classOptions = useMemo(() => {
    if (!targetDepartment) return [];
    const dept = dbDepartments.find(
      (d) =>
        normalizeAcademicText(d.name) === normalizeAcademicText(targetDepartment) &&
        (!targetBranchId || String(d.branch_id) === String(targetBranchId))
    );
    const seen = new Set<string>();
    return dbClasses.filter((c) => {
      if (targetBranchId && String(c.branch_id) !== String(targetBranchId)) return false;
      if (c.department_id !== dept?.id) return false;
      if (targetYear && c.academic_year && String(c.academic_year) !== String(targetYear)) {
        return false;
      }
      const key = normalizeAcademicText(c.name);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [dbClasses, dbDepartments, targetBranchId, targetDepartment, targetYear]);

  const yearOptions = useMemo(() => {
    const yrs = new Set<string>();
    dbClasses
      .filter((c) => !targetBranchId || String(c.branch_id) === String(targetBranchId))
      .forEach((c) => {
        if (c.academic_year) yrs.add(String(c.academic_year));
      });
    if (targetYear) yrs.add(targetYear);
    yrs.add(String(new Date().getFullYear()));
    return Array.from(yrs).sort((a, b) => Number(b) - Number(a));
  }, [dbClasses, targetBranchId, targetYear]);

  const selectedIdsSet = useMemo(
    () => new Set(selectedStudents.map((s) => String(s.id))),
    [selectedStudents]
  );

  const rollStats = useMemo(() => {
    if (!targetClassName) return { existingCount: 0, maxRoll: 0, nextRoll: 1 };
    return getTargetClassRollStats(
      allStudents,
      {
        name: targetClassName,
        department: targetDepartment,
        branch_id: targetBranchId,
        academic_year: targetYear,
      },
      selectedIdsSet
    );
  }, [allStudents, targetClassName, targetDepartment, targetBranchId, targetYear, selectedIdsSet]);

  useEffect(() => {
    if (targetClassName) {
      setCustomStartRoll(String(rollStats.nextRoll));
    } else {
      setCustomStartRoll("");
    }
  }, [targetClassName, rollStats.nextRoll]);

  const effectiveStartRoll = useMemo(() => {
    const ascii = toAsciiDigits(customStartRoll).replace(/[^0-9]/g, "");
    const parsed = parseInt(ascii, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : rollStats.nextRoll;
  }, [customStartRoll, rollStats.nextRoll]);

  const previewAssignments = useMemo(() => {
    if (!targetClassName) return [];
    return assignSequentialRolls(selectedStudents, effectiveStartRoll);
  }, [selectedStudents, targetClassName, effectiveStartRoll]);

  const anyHasExistingSecondary = useMemo(
    () => selectedStudents.some((s) => Boolean(normalizeAcademicText(s.secondary_class_name))),
    [selectedStudents]
  );

  const handleBulkSave = async () => {
    if (!targetBranchId || !targetDepartment || !targetClassName) {
      setError("অনুগ্রহ করে শাখা, বিভাগ এবং শ্রেণি নির্বাচন করুন।");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (mode === "secondary") {
        await saveSecondaryEnrollmentsHybrid(
          supabase,
          previewAssignments.map(({ student, assignedRoll }) => ({
            id: String(student.id),
            student_id: student.student_id,
            secondary_department: targetDepartment,
            secondary_class_name: targetClassName,
            secondary_roll_number: assignedRoll,
          }))
        );
      } else {
        const results = await Promise.all(
          previewAssignments.map(({ student, assignedRoll }) =>
            supabase
              .from("students")
              .update({
                branch_id: Number(targetBranchId),
                department: targetDepartment,
                class_name: targetClassName,
                roll_number: assignedRoll,
                roll_no: assignedRoll,
                ...(targetYear ? { academic_year: Number(targetYear) } : {}),
              })
              .eq("id", student.id)
          )
        );
        const failed = results.find((r) => r.error);
        if (failed?.error) throw failed.error;
      }

      onCompleted();
      onClose();
    } catch (err: any) {
      console.error("Bulk class assign error:", err);
      setError("সংরক্ষণ করা যায়নি: " + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleBulkClearSecondary = async () => {
    if (!confirm(`নির্বাচিত ${selectedStudents.length} জন শিক্ষার্থীর অতিরিক্ত শ্রেণি মুছে ফেলতে চান?`)) {
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveSecondaryEnrollmentsHybrid(
        supabase,
        selectedStudents.map((s) => ({
          id: String(s.id),
          student_id: s.student_id,
          secondary_department: null,
          secondary_class_name: null,
          secondary_roll_number: null,
        }))
      );
      onCompleted();
      onClose();
    } catch (err: any) {
      setError("মুছে ফেলা যায়নি: " + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && !next && onClose()}>
      <DialogContent className="sm:max-w-[680px] max-h-[92vh] overflow-y-auto font-[Kalpurush]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <Layers className="w-5 h-5 text-green-600" />
            একসাথে শ্রেণিতে যুক্ত / স্থানান্তর ({toBengaliNumber(selectedStudents.length)} জন নির্বাচিত)
          </DialogTitle>
          <DialogDescription>
            নির্বাচিত শিক্ষার্থীদের একসাথে নতুন শ্রেণিতে যুক্ত করুন; ওই শ্রেণির বর্তমান শেষ রোলের পরের সিরিয়াল থেকে স্বয়ংক্রিয়ভাবে রোল নম্বর বসে যাবে।
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setMode("secondary");
                if (isHifzDepartment(targetDepartment)) {
                  setTargetDepartment("");
                  setTargetClassName("");
                }
              }}
              className={`text-left p-3.5 rounded-xl border-2 transition-all ${
                mode === "secondary"
                  ? "border-purple-600 bg-purple-50/70 shadow-sm"
                  : "border-gray-200 bg-white hover:border-purple-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  অতিরিক্ত শ্রেণিতে যুক্ত করুন (হেফজ + কিতাব)
                </span>
                {mode === "secondary" && <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />}
              </div>
              <p className="text-[11px] text-gray-600 leading-snug">
                মূল বিভাগ (যেমন হেফজখানা) ঠিক রেখে কিতাব বা অন্য শ্রেণির ক্লাস তালিকা ও পরীক্ষায় যুক্ত করবে।
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode("primary")}
              className={`text-left p-3.5 rounded-xl border-2 transition-all ${
                mode === "primary"
                  ? "border-green-600 bg-green-50/70 shadow-sm"
                  : "border-gray-200 bg-white hover:border-green-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-green-900 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-green-600" />
                  সরাসরি নতুন শ্রেণিতে স্থানান্তর
                </span>
                {mode === "primary" && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
              </div>
              <p className="text-[11px] text-gray-600 leading-snug">
                শিক্ষার্থীদের মূল বিভাগ ও মূল শ্রেণি পরিবর্তন করে সরাসরি নির্বাচিত শ্রেণিতে নিয়ে যাবে।
              </p>
            </button>
          </div>

          {/* Target Class Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">শাখা *</Label>
              <select
                value={targetBranchId}
                onChange={(e) => {
                  setTargetBranchId(e.target.value);
                  setTargetDepartment("");
                  setTargetClassName("");
                }}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">নির্বাচন করুন</option>
                {branches.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">শিক্ষাবর্ষ *</Label>
              <select
                value={targetYear}
                onChange={(e) => {
                  setTargetYear(e.target.value);
                  setTargetClassName("");
                }}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {toBengaliNumber(y)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">বিভাগ *</Label>
              <select
                value={targetDepartment}
                onChange={(e) => {
                  setTargetDepartment(e.target.value);
                  setTargetClassName("");
                }}
                disabled={!targetBranchId}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
              >
                <option value="">বিভাগ নির্বাচন</option>
                {departmentOptions.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name.trim()}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">শ্রেণি *</Label>
              <select
                value={targetClassName}
                onChange={(e) => setTargetClassName(e.target.value)}
                disabled={!targetDepartment}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
              >
                <option value="">{targetDepartment ? "শ্রেণি নির্বাচন" : "আগে বিভাগ দিন"}</option>
                {classOptions.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name.trim()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Serial Roll Summary & Preview */}
          {targetClassName && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs text-emerald-950 space-y-0.5">
                  <p className="font-bold text-sm text-emerald-900">
                    {targetDepartment.trim()} — {targetClassName.trim()} শ্রেণির বর্তমান অবস্থা:
                  </p>
                  <p>
                    বিদ্যমান শিক্ষার্থী: <strong>{toBengaliNumber(rollStats.existingCount)} জন</strong> | বর্তমান সর্বোচ্চ রোল:{" "}
                    <strong>{rollStats.maxRoll > 0 ? toBengaliNumber(rollStats.maxRoll) : "নেই (০)"}</strong>
                  </p>
                  <p className="text-emerald-800 font-semibold">
                    নতুন সিরিয়াল রোল বসবে: {toBengaliNumber(effectiveStartRoll)} থেকে{" "}
                    {toBengaliNumber(effectiveStartRoll + selectedStudents.length - 1)} পর্যন্ত
                  </p>
                </div>

                <div className="w-full sm:w-36 shrink-0">
                  <Label className="text-[11px] font-bold text-emerald-900">শুরুর রোল নম্বর</Label>
                  <Input
                    value={customStartRoll}
                    onChange={(e) => setCustomStartRoll(e.target.value)}
                    className="h-9 bg-white text-center font-bold border-emerald-300"
                    placeholder={String(rollStats.nextRoll)}
                  />
                </div>
              </div>

              {/* Preview Table */}
              <div className="max-h-48 overflow-y-auto rounded-lg border border-emerald-200 bg-white">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-emerald-100/70 text-emerald-900 sticky top-0">
                    <tr>
                      <th className="p-2 border-b">আইডি</th>
                      <th className="p-2 border-b">শিক্ষার্থীর নাম</th>
                      <th className="p-2 border-b">বর্তমান শ্রেণি (রোল)</th>
                      <th className="p-2 border-b text-center">নতুন সিরিয়াল রোল</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewAssignments.map(({ student, assignedRoll }) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="p-2 font-mono text-gray-600">{toBengaliNumber(student.student_id || "-")}</td>
                        <td className="p-2 font-semibold text-gray-800">{student.name_bn}</td>
                        <td className="p-2 text-gray-600">
                          {student.class_name?.trim() || "—"} ({toBengaliNumber(student.roll_number ?? student.roll_no ?? "—")})
                        </td>
                        <td className="p-2 text-center">
                          <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                            রোল: {toBengaliNumber(assignedRoll)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-2">
          <div>
            {mode === "secondary" && anyHasExistingSecondary && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={handleBulkClearSecondary}
                className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> অতিরিক্ত শ্রেণি সরান
              </Button>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              বাতিল
            </Button>
            <Button
              type="button"
              onClick={handleBulkSave}
              disabled={saving || !targetClassName}
              className={
                mode === "secondary"
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> সংরক্ষণ হচ্ছে...
                </>
              ) : (
                `নিশ্চিত করুন (${toBengaliNumber(selectedStudents.length)} জন)`
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
