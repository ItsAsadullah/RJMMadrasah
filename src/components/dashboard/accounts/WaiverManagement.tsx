"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyableId } from "@/components/ui/copyable-id";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Search, ShieldOff, UserMinus, GraduationCap, Edit, X, UserRound } from "lucide-react";
import { sortClassNames } from "@/lib/classOrder";

// ─────────────────────────────────────────────
// TypeScript Interfaces
// ─────────────────────────────────────────────

interface Branch {
    id: number;
    name: string;
}

interface FeeType {
    id: string;
    name_bn: string;
    is_active: boolean;
    is_default: boolean;
}

interface Student {
    student_id: string;
    name_bn: string;
    roll_number?: string | number;
    roll_no?: string | number;
    class_name: string;
    department: string;
    branch_id: number;
    guardian_name?: string;
    guardian_mobile?: string;
    father_mobile?: string;
    photo_url?: string | null;
}

interface Waiver {
    id: string;
    student_id: string;
    fee_type_id: string;
    waiver_type: "full" | "percentage" | "fixed_amount";
    waiver_value: number;
    reason?: string;
    start_date?: string;
    end_date?: string;
    fee_types?: { name_bn: string };
    students?: { name_bn: string; class_name: string };
}

interface WaiverForm {
    student_id: string;
    student_name: string;
    fee_type_id: string;
    waiver_type: string;
    waiver_value: string;
    reason: string;
    start_date: string;
    end_date: string;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const WAIVER_TYPE_LABELS: Record<string, string> = {
    full: "পূর্ণ মওকুফ",
    percentage: "শতকরা ছাড়",
    fixed_amount: "নির্দিষ্ট পরিমাণ ছাড়",
};

const WAIVER_REASONS = [
    "এতীম",
    "দরিদ্র / অসচ্ছল",
    "মেধাবৃত্তি",
    "কর্মচারী সন্তান",
    "হাফেজ ছাড়",
    "বিশেষ ছাড়",
    "অন্যান্য",
];

const DEFAULT_FORM: WaiverForm = {
    student_id: "",
    student_name: "",
    fee_type_id: "",
    waiver_type: "full",
    waiver_value: "100",
    reason: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
};

// ─────────────────────────────────────────────
// Pure Helper Functions (module-level, no re-creation)
// ─────────────────────────────────────────────

const toBengaliNumber = (num: string | number): string =>
    String(num).replace(/[0-9]/g, (c) => "০১২৩৪৫৬৭৮৯"[parseInt(c)]);

/**
 * Comprehensive text normalization.
 *
 * Key insight: NFD FIRST decomposes all composed chars so that any
 * hidden invisible chars embedded inside a glyph get separated and
 * can then be stripped. After stripping we NFC-recompose cleanly.
 *
 * Also strips Variation Selectors (U+FE00-FE0F) which are invisible
 * and often cause identical-looking strings to compare as unequal.
 */
function normalizeText(value: unknown): string {
    return String(value ?? "")
        // STEP 1 – NFD decompose so hidden chars inside composed glyphs are exposed
        .normalize("NFD")
        // STEP 2 – Strip all zero-width / format / invisible characters
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") // C0 controls
        .replace(/[\u0080-\u009F]/g, "")          // C1 controls
        .replace(/\u00AD/g, "")                    // Soft hyphen
        .replace(/[\u200B-\u200F]/g, "")           // ZWSP, ZWNJ, ZWJ, LRM, RLM
        .replace(/[\u202A-\u202E]/g, "")           // Bidi embedding/override marks
        .replace(/[\u2060-\u2064\u206A-\u206F]/g, "") // Word joiner, inhibit chars
        .replace(/[\uFE00-\uFE0F]/g, "")           // Variation Selectors 1-16 ← key fix!
        .replace(/\uFEFF/g, "")                    // BOM
        // STEP 3 – Normalise all Unicode space variants → ASCII space
        .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\t]/g, " ")
        // STEP 4 – Collapse runs and trim
        .replace(/\s+/g, " ")
        .trim()
        // STEP 5 – NFC recompose canonically
        .normalize("NFC")
        // STEP 6 – Bengali-specific combining fixes
        .replace(/\u09AF\u09BC/g, "\u09DF") // য + ় → য়
        .replace(/\u09AF\u09CC/g, "\u09CC"); // ya + au-sign artefact
}

/**
 * Lowercase key for deduplication ONLY — never shown in UI.
 */
const dedupeKey = (value: unknown): string => normalizeText(value).toLowerCase();

function getWaiverValueLabel(w: Waiver): string {
    if (w.waiver_type === "full") return "পূর্ণ";
    if (w.waiver_type === "percentage") return `${toBengaliNumber(w.waiver_value)}%`;
    return `৳ ${toBengaliNumber(w.waiver_value)}`;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function WaiverManagement() {
    // ── Global data ──
    const [waivers, setWaivers] = useState<Waiver[]>([]);
    const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Dropdown options (already normalized + unique at fetch time) ──
    const [departments, setDepartments] = useState<string[]>([]);
    const [classes, setClasses] = useState<string[]>([]);
    /**
     * Maps each normalized display-dept string → all raw DB variants.
     * Used in filtering: when user picks a dept, we OR-query all its variants
     * so students stored with ANY encoding of that dept name are found.
     */
    const [deptVariants, setDeptVariants] = useState<Record<string, string[]>>({});
    const [allStudentsData, setAllStudentsData] = useState<Record<string, Partial<Student>>>({});

    // ── Edit Modal state ──
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState<WaiverForm & { id?: string }>(DEFAULT_FORM);

    // ── Modal state ──
    const [modalOpen, setModalOpen] = useState(false);
    const [waiverStudents, setWaiverStudents] = useState<Student[]>([]);
    const [waiverSearching, setWaiverSearching] = useState(false);
    const [studentWaiversById, setStudentWaiversById] = useState<Record<string, Waiver[]>>({});
    const [monthlyFeeByStudentId, setMonthlyFeeByStudentId] = useState<Record<string, number>>({});
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // ── Filters ──
    const [filterBranch, setFilterBranch] = useState("all");
    const [filterDepartment, setFilterDepartment] = useState("all");
    const [filterClass, setFilterClass] = useState("all");
    const [filterSearch, setFilterSearch] = useState("");
    const [filterType, setFilterType] = useState("all");

    // ── Form ──
    const [form, setForm] = useState<WaiverForm>(DEFAULT_FORM);
    const [saving, setSaving] = useState(false);

    // FIX #1 (part): ref so fetchMonthlyFees doesn't rebuild on every feeTypes change
    const feeTypesRef = useRef<FeeType[]>([]);
    useEffect(() => { feeTypesRef.current = feeTypes; }, [feeTypes]);

    // ─────────────────────────────────────────
    // FIX #4 – O(1) branch lookup via useMemo
    // ─────────────────────────────────────────
    const branchMap = useMemo<Record<string, string>>(
        () => Object.fromEntries(branches.map((b) => [String(b.id), b.name])),
        [branches],
    );

    // ─────────────────────────────────────────
    // FIX #6 – Memoised filtered waivers
    // ─────────────────────────────────────────
    const filteredWaivers = useMemo(
        () => (filterType === "all" ? waivers : waivers.filter((w) => w.waiver_type === filterType)),
        [waivers, filterType],
    );

    // ─────────────────────────────────────────
    // fetchAll – loads global data
    // ─────────────────────────────────────────
    const fetchAll = useCallback(async () => {
        setLoading(true);
        const [ftRes, wvRes, brRes, stRes] = await Promise.all([
            supabase.from("fee_types").select("*").eq("is_active", true).order("is_default", { ascending: false }),
            supabase.from("student_waivers")
                .select("*, fee_types(name_bn)")
                .eq("is_active", true)
                .order("created_at", { ascending: false }),
            supabase.from("branches").select("id, name"),
            supabase.from("students").select("student_id, name_bn, class_name, department, branch_id, roll_number, roll_no, guardian_name, guardian_mobile, father_mobile").eq("status", "active"),
        ]);

        if (ftRes.data) setFeeTypes(ftRes.data as FeeType[]);
        if (wvRes.data) setWaivers(wvRes.data as Waiver[]);
        if (brRes.data) setBranches(brRes.data as Branch[]);

        // FIX #1 & #2 – Dedup departments and classes AT FETCH TIME
        if (stRes.data) {
            // dept: key=dedupeKey → { display, rawVariants }
            const deptMap = new Map<string, { display: string; rawVariants: Set<string> }>();
            const classMap = new Map<string, string>();
            const studentMap: Record<string, Partial<Student>> = {};

            for (const s of stRes.data) {
                if (s.student_id) studentMap[String(s.student_id)] = s as Partial<Student>;
                // ── Department ──
                const rawDept = String(s?.department ?? "");
                const normDept = normalizeText(rawDept);
                const dKey    = normDept.toLowerCase();
                if (dKey) {
                    if (!deptMap.has(dKey)) {
                        deptMap.set(dKey, { display: normDept, rawVariants: new Set() });
                    }
                    // Always add raw value so all DB variants are tracked
                    if (rawDept) deptMap.get(dKey)!.rawVariants.add(rawDept);
                }

                // ── Class ──
                const cRaw = normalizeText(s?.class_name);
                const cKey = cRaw.toLowerCase();
                if (cKey && !classMap.has(cKey)) classMap.set(cKey, cRaw);
            }

            // Build display list (unique, sorted)
            setDepartments(
                Array.from(deptMap.values())
                    .map((v) => v.display)
                    .sort((a, b) => a.localeCompare(b, "bn")),
            );

            // Build variants lookup: display → [raw1, raw2, ...]
            const variantsRecord: Record<string, string[]> = {};
            deptMap.forEach(({ display, rawVariants }) => {
                variantsRecord[display] = Array.from(rawVariants);
            });
            setDeptVariants(variantsRecord);

            setClasses(sortClassNames(Array.from(classMap.values())));
            setAllStudentsData(studentMap);
        }

        setLoading(false);
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ─────────────────────────────────────────
    // Student waiver summary (memoised per call via inline)
    // ─────────────────────────────────────────
    const getStudentWaiverSummary = useCallback(
        (studentId: string): { text: string; tone: "none" | "has" } => {
            const items = studentWaiversById[studentId] ?? [];
            if (items.length === 0) return { text: "মওকুফ নেই", tone: "none" };

            const hasFull = items.some((w) => w.waiver_type === "full");
            const pctItems = items.filter((w) => w.waiver_type === "percentage");
            const fixedTotal = items
                .filter((w) => w.waiver_type === "fixed_amount")
                .reduce((s, w) => s + (Number(w.waiver_value) || 0), 0);

            const parts: string[] = [];
            if (hasFull) parts.push("পূর্ণ");
            if (pctItems.length > 0) {
                const maxPct = Math.max(...pctItems.map((w) => Number(w.waiver_value) || 0));
                parts.push(`${toBengaliNumber(maxPct)}%`);
            }
            if (fixedTotal > 0) parts.push(`৳ ${toBengaliNumber(fixedTotal)}`);

            const suffix = items.length > 1 ? ` (${toBengaliNumber(items.length)}টি)` : "";
            return { text: parts.join(" + ") + suffix, tone: "has" };
        },
        [studentWaiversById],
    );

    // ─────────────────────────────────────────
    // Fetch waivers for a student list
    // ─────────────────────────────────────────
    const fetchWaiversForStudents = useCallback(async (studentIds: string[]) => {
        const ids = [...new Set(studentIds.filter(Boolean))];
        if (!ids.length) { setStudentWaiversById({}); return; }

        const { data, error } = await supabase
            .from("student_waivers")
            .select("id, student_id, fee_type_id, waiver_type, waiver_value, reason, start_date, end_date, fee_types(name_bn)")
            .eq("is_active", true)
            .in("student_id", ids);

        if (error) { console.error("fetchWaiversForStudents:", error); setStudentWaiversById({}); return; }

        const map: Record<string, Waiver[]> = {};
        for (const w of (data ?? []) as unknown as Waiver[]) {
            const key = String(w.student_id);
            if (!key) continue;
            (map[key] ??= []).push(w);
        }
        setStudentWaiversById(map);
    }, []);

    // ─────────────────────────────────────────
    // Fetch monthly fees for a student list
    // ─────────────────────────────────────────
    const fetchMonthlyFeesForStudents = useCallback(async (students: Student[]) => {
        const currentFeeTypes = feeTypesRef.current;
        const defaultFt = currentFeeTypes.find((ft) => ft.is_default) ?? currentFeeTypes[0];
        if (!defaultFt?.id) { setMonthlyFeeByStudentId({}); return; }

        const branchIds = [...new Set(students.map((s) => s.branch_id).filter((v) => v != null))];
        if (!branchIds.length) { setMonthlyFeeByStudentId({}); return; }

        const { data, error } = await supabase
            .from("fee_structures")
            .select("branch_id, class_name, amount")
            .eq("is_active", true)
            .eq("fee_type_id", defaultFt.id)
            .eq("frequency", "monthly")
            .in("branch_id", branchIds);

        if (error) { console.error("fetchMonthlyFeesForStudents:", error); setMonthlyFeeByStudentId({}); return; }

        // Build (branchId__classKey) → amount map
        const structureMap = new Map<string, number>();
        for (const row of data ?? []) {
            const b = String(row.branch_id ?? "");
            const c = row.class_name ? normalizeText(row.class_name).toLowerCase() : "all";
            const key = `${b}__${c}`;
            if (c !== "all") {
                structureMap.set(key, Number(row.amount) || 0);
            } else if (!structureMap.has(key)) {
                structureMap.set(key, Number(row.amount) || 0);
            }
        }

        const result: Record<string, number> = {};
        for (const s of students) {
            const sid = String(s.student_id);
            const bid = String(s.branch_id ?? "");
            if (!sid || !bid) continue;
            const cls = normalizeText(s.class_name).toLowerCase();
            const amount =
                structureMap.get(`${bid}__${cls}`) ??
                structureMap.get(`${bid}__all`) ??
                0;
            if (amount > 0) result[sid] = amount;
        }
        setMonthlyFeeByStudentId(result);
    }, []);

    // ─────────────────────────────────────────
    // FIX #5 – Student search: eq() for exact dropdown values
    // ─────────────────────────────────────────
    const handleSearchStudents = useCallback(async () => {
        setWaiverSearching(true);

        let query = supabase
            .from("students")
            .select("student_id, name_bn, roll_number, roll_no, class_name, department, branch_id, guardian_name, guardian_mobile, father_mobile, photo_url")
            .eq("status", "active");

        if (filterBranch !== "all") query = query.eq("branch_id", parseInt(filterBranch));

        if (filterDepartment !== "all") {
            // Use ALL raw DB variants for this normalized dept name so
            // students stored with any Unicode encoding are included.
            const variants = deptVariants[filterDepartment] ?? [filterDepartment];
            if (variants.length === 1) {
                query = query.eq("department", variants[0]);
            } else {
                // OR across every raw variant: department.eq.A,department.eq.B,...
                const orClause = variants.map((v) => `department.eq.${v}`).join(",");
                query = query.or(orClause);
            }
        }
        if (filterClass !== "all") query = query.eq("class_name", filterClass);

        if (filterSearch.trim()) {
            query = query.or(
                `name_bn.ilike.%${filterSearch.trim()}%,student_id.ilike.%${filterSearch.trim()}%`,
            );
        }

        const { data, error } = await query.limit(50);

        if (error) {
            console.error("handleSearchStudents:", error);
            setWaiverStudents([]);
            setStudentWaiversById({});
            setMonthlyFeeByStudentId({});
            setWaiverSearching(false);
            return;
        }

        const students = (data ?? []) as Student[];
        setWaiverStudents(students);

        const ids = students.map((s) => String(s.student_id));
        await Promise.all([
            fetchWaiversForStudents(ids),
            fetchMonthlyFeesForStudents(students),
        ]);

        setWaiverSearching(false);
    }, [filterBranch, filterDepartment, filterClass, filterSearch, deptVariants, fetchWaiversForStudents, fetchMonthlyFeesForStudents]);

    // Debounced search whenever modal or filters change
    useEffect(() => {
        if (!modalOpen) return;
        const t = setTimeout(handleSearchStudents, 300);
        return () => clearTimeout(t);
    }, [modalOpen, filterBranch, filterDepartment, filterClass, filterSearch, handleSearchStudents]);

    // ─────────────────────────────────────────
    // Handlers
    // ─────────────────────────────────────────
    const handleSelectStudent = useCallback((s: Student) => {
        setForm((prev) => ({ ...prev, student_id: s.student_id, student_name: s.name_bn }));
        setSelectedStudent(s);
    }, []);

    const handleSave = useCallback(async () => {
        if (!form.student_id || !form.fee_type_id) {
            alert("শিক্ষার্থী ও ফি টাইপ সিলেক্ট করুন");
            return;
        }
        setSaving(true);
        const { error } = await supabase.from("student_waivers").insert({
            student_id: form.student_id,
            fee_type_id: form.fee_type_id,
            waiver_type: form.waiver_type,
            waiver_value: parseFloat(form.waiver_value) || 0,
            reason: form.reason || null,
            start_date: form.start_date || null,
            end_date: form.end_date || null,
        });
        if (error) { alert("ত্রুটি: " + error.message); }
        else { setModalOpen(false); resetForm(); fetchAll(); }
        setSaving(false);
    }, [form, fetchAll]);

    const handleEdit = (w: Waiver) => {
        setEditForm({
            id: w.id,
            student_id: w.student_id,
            student_name: allStudentsData[w.student_id]?.name_bn || "",
            fee_type_id: w.fee_type_id,
            waiver_type: w.waiver_type,
            waiver_value: String(w.waiver_value),
            reason: w.reason || "",
            start_date: w.start_date || "",
            end_date: w.end_date || ""
        });
        setEditModalOpen(true);
    };

    const handleUpdate = async () => {
        if (!editForm.id || !editForm.fee_type_id) {
            alert("ত্রুটি: আইডি বা ফি টাইপ পাওয়া যায়নি");
            return;
        }
        setSaving(true);
        const { error } = await supabase.from("student_waivers").update({
            fee_type_id: editForm.fee_type_id,
            waiver_type: editForm.waiver_type,
            waiver_value: parseFloat(editForm.waiver_value) || 0,
            reason: editForm.reason || null,
            start_date: editForm.start_date || null,
            end_date: editForm.end_date || null,
        }).eq("id", editForm.id);

        if (error) { alert("ত্রুটি: " + error.message); }
        else { setEditModalOpen(false); fetchAll(); }
        setSaving(false);
    };

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm("এই ওয়েভার মুছে ফেলতে চান?")) return;
        await supabase.from("student_waivers").update({ is_active: false }).eq("id", id);
        fetchAll();
    }, [fetchAll]);

    const resetForm = useCallback(() => {
        setForm({ ...DEFAULT_FORM, start_date: new Date().toISOString().split("T")[0] });
        setSelectedStudent(null);
        setWaiverStudents([]);
        setStudentWaiversById({});
        setMonthlyFeeByStudentId({});
        setFilterSearch("");
        setFilterBranch("all");
        setFilterDepartment("all");
        setFilterClass("all");
    }, []);

    const handleModalOpenChange = useCallback((open: boolean) => {
        setModalOpen(open);
        if (!open) resetForm();
    }, [resetForm]);

    // ─────────────────────────────────────────
    // Loading state
    // ─────────────────────────────────────────
    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 className="animate-spin w-8 h-8 text-purple-600" />
        </div>
    );

    // ─────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────
    return (
        <div className="space-y-6">

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                        <ShieldOff className="w-5 h-5 text-purple-600" /> বেতন ছাড় ও মওকুফ
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">নির্দিষ্ট শিক্ষার্থীদের বেতন মওকুফ বা ছাড় দিন</p>
                </div>
                <div className="flex gap-2">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="h-9 w-40 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">সব ধরন</SelectItem>
                            <SelectItem value="full">পূর্ণ মওকুফ</SelectItem>
                            <SelectItem value="percentage">শতকরা ছাড়</SelectItem>
                            <SelectItem value="fixed_amount">নির্দিষ্ট ছাড়</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-purple-600 hover:bg-purple-700 shadow-md">
                        <Plus className="w-4 h-4 mr-2" /> নতুন ছাড়
                    </Button>
                </div>
            </div>

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                    { label: "মোট ওয়েভার", count: waivers.length, color: "purple" },
                    { label: "পূর্ণ মওকুফ", count: waivers.filter((w) => w.waiver_type === "full").length, color: "indigo" },
                    { label: "আংশিক ছাড়", count: waivers.filter((w) => w.waiver_type !== "full").length, color: "pink" },
                ].map(({ label, count, color }) => (
                    <Card key={label} className={`border-l-[3px] border-l-${color}-500 py-0 gap-0 rounded-2xl shadow-sm`}>
                        <CardContent className="p-2.5 sm:p-3">
                            <p className="text-[9px] sm:text-[11px] font-bold text-gray-500">{label}</p>
                            <h3 className={`text-sm sm:text-2xl font-bold text-${color}-700`}>{toBengaliNumber(count)} টি</h3>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Waiver List ── */}
            {filteredWaivers.length === 0 ? (
                <Card className="rounded-2xl">
                    <CardContent className="text-center py-12 text-gray-400">
                        <UserMinus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="font-bold">কোনো ওয়েভার/ছাড় নেই</p>
                        <p className="text-sm mt-1">নতুন ছাড় যুক্ত করতে উপরের বাটনে ক্লিক করুন</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Mobile */}
                    <div className="md:hidden space-y-2.5">
                        {filteredWaivers.map((w) => {
                            const studentInfo = allStudentsData[w.student_id];
                            const branchName = studentInfo ? (branchMap[String(studentInfo.branch_id)] ?? "-") : "-";
                            const roll = studentInfo ? (studentInfo.roll_number ?? studentInfo.roll_no) : "-";

                            return (
                            <Card key={w.id} className="border-l-[3px] border-l-purple-400 shadow-sm rounded-xl">
                                <CardContent className="p-2.5 space-y-2">
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                                            {studentInfo?.photo_url ? (
                                                <img src={studentInfo.photo_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <UserRound className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div className="truncate pr-2">
                                                    <h4 className="font-bold text-gray-800 text-sm truncate">
                                                        {studentInfo?.name_bn || "-"}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                                                        <CopyableId id={w.student_id} className="font-mono text-purple-600 font-semibold" />
                                                        <span>• রোল: {roll && roll !== "-" ? toBengaliNumber(String(roll)) : "-"}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[9px] px-1.5 py-0.5 font-semibold leading-none h-4">
                                                        {WAIVER_TYPE_LABELS[w.waiver_type]}
                                                    </Badge>
                                                    <span className="text-[11px] font-bold text-gray-700">
                                                        {w.waiver_type === "full" ? "১০০%" : w.waiver_type === "percentage" ? `${toBengaliNumber(w.waiver_value)}%` : `৳ ${toBengaliNumber(w.waiver_value)}`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-1 flex flex-wrap gap-1.5">
                                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-normal text-gray-600">{studentInfo?.class_name || "-"}</Badge>
                                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-gray-500 bg-gray-50">{branchName}</Badge>
                                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-purple-600 bg-purple-50 border-purple-200">{w.fee_types?.name_bn}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t mt-1 text-xs text-gray-500">
                                        <div className="truncate pr-2">
                                            <span className="text-gray-500">কারণ: </span>
                                            <span className="font-medium text-gray-700">{w.reason || "-"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleEdit(w)}>
                                                এডিট
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-6 w-6 p-0 text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleDelete(w.id)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            );
                        })}
                    </div>

                    {/* Desktop */}
                    <div className="hidden md:block">
                        <Card className="rounded-2xl shadow-sm">
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="font-bold">শিক্ষার্থীর তথ্য</TableHead>
                                            <TableHead className="font-bold">শাখা ও শ্রেণি</TableHead>
                                            <TableHead className="font-bold">ফি টাইপ</TableHead>
                                            <TableHead className="font-bold">ছাড়ের বিবরণ</TableHead>
                                            <TableHead className="font-bold">কারণ ও সময়কাল</TableHead>
                                            <TableHead className="font-bold text-right">অ্যাকশন</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredWaivers.map((w) => {
                                            const studentInfo = allStudentsData[w.student_id];
                                            const branchName = studentInfo ? (branchMap[String(studentInfo.branch_id)] ?? "-") : "-";
                                            const roll = studentInfo ? (studentInfo.roll_number ?? studentInfo.roll_no) : "-";
                                            return (
                                                <TableRow key={w.id} className="hover:bg-purple-50/30">
                                                    <TableCell>
                                                        <div className="font-bold text-gray-900">{studentInfo?.name_bn || "-"}</div>
                                                        <div className="font-mono text-xs text-purple-600 font-semibold"><CopyableId id={w.student_id} /></div>
                                                        <div className="text-xs text-gray-500">রোল: {roll && roll !== "-" ? toBengaliNumber(String(roll)) : "-"}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-gray-800">{branchName}</div>
                                                        <div className="text-xs text-gray-500">{studentInfo?.department ? `${studentInfo.department} | ` : ""}{studentInfo?.class_name || "-"}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded-md text-xs">{w.fee_types?.name_bn}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Badge className={`${w.waiver_type === "full" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"} text-xs shrink-0`}>
                                                                {WAIVER_TYPE_LABELS[w.waiver_type]}
                                                            </Badge>
                                                            <span className="font-bold text-gray-800">
                                                                {w.waiver_type === "full" ? "১০০%" : w.waiver_type === "percentage" ? `${toBengaliNumber(w.waiver_value)}%` : `৳ ${toBengaliNumber(w.waiver_value)}`}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        <div className="text-gray-800 font-medium">{w.reason || "-"}</div>
                                                        {(w.start_date || w.end_date) && (
                                                            <div className="text-[11px] text-gray-400 mt-0.5">
                                                                {w.start_date ? new Date(w.start_date).toLocaleDateString("bn-BD") : ""} - {w.end_date ? new Date(w.end_date).toLocaleDateString("bn-BD") : "চলমান"}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(w)}>
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50" onClick={() => handleDelete(w.id)}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            {/* ══════════════════════════════════════ */}
            {/* Add Waiver Modal                       */}
            {/* ══════════════════════════════════════ */}
            <Dialog open={modalOpen} onOpenChange={handleModalOpenChange}>
                <DialogContent className="w-full max-w-full md:max-w-[98vw] h-[100dvh] md:h-[92vh] md:rounded-xl rounded-none overflow-hidden p-0 flex flex-col gap-0">

                    {/* Header */}
                    <DialogHeader className="px-4 py-3 md:px-5 md:py-3 border-b bg-gray-50 shrink-0 flex flex-row items-center justify-between">
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-800 m-0">
                            {/* On mobile, if a student is selected, show a back button to go back to the list */}
                            {form.student_id && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden mr-1 text-gray-600" onClick={() => { setForm((p) => ({ ...p, student_id: "", student_name: "" })); setSelectedStudent(null); }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                </Button>
                            )}
                            <ShieldOff className="w-4 h-4 text-purple-600" /> নতুন ছাড়/মওকুফ
                        </DialogTitle>
                        <DialogDescription className="sr-only">শিক্ষার্থীদের জন্য নতুন ছাড় বা মওকুফ যুক্ত করার ফর্ম</DialogDescription>
                    </DialogHeader>

                    {/* Body */}
                    <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">

                        {/* ═══ LEFT: filter bar + student table ═══ */}
                        <div className={`flex-col lg:flex-1 lg:overflow-hidden lg:border-r p-2.5 sm:p-3 gap-2 min-h-[400px] lg:min-h-0 shrink-0 ${form.student_id ? 'hidden lg:flex' : 'flex'}`}>

                            {/* Filter bar */}
                            <div className="shrink-0 bg-gray-50 rounded-lg border border-gray-200 p-3 space-y-2.5">
                                <p className="text-sm font-bold text-gray-600 flex items-center gap-1.5">
                                    <GraduationCap className="w-4 h-4 text-purple-600" /> শিক্ষার্থী তালিকা (ফিল্টার সহ)
                                </p>

                                {/* FIX #7: departments/classes already unique in state – no render-time dedup needed */}
                                <div className="grid grid-cols-3 gap-2">
                                    <Select value={filterBranch} onValueChange={setFilterBranch}>
                                        <SelectTrigger className="h-9 text-sm bg-white"><SelectValue placeholder="সকল শাখা" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">সকল শাখা</SelectItem>
                                            {branches.map((b) => (
                                                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                                        <SelectTrigger className="h-9 text-sm bg-white"><SelectValue placeholder="সকল বিভাগ" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">সকল বিভাগ</SelectItem>
                                            {/* FIX #1: departments are already unique – no extra dedup here */}
                                            {departments.map((d) => (
                                                <SelectItem key={dedupeKey(d)} value={d}>{d}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={filterClass} onValueChange={setFilterClass}>
                                        <SelectTrigger className="h-9 text-sm bg-white"><SelectValue placeholder="সকল শ্রেণি" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">সকল শ্রেণি</SelectItem>
                                            {/* FIX #2: classes already unique in state */}
                                            {classes.map((c) => (
                                                <SelectItem key={dedupeKey(c)} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <Input
                                        className="pl-9 h-9 text-sm bg-white"
                                        placeholder="নাম বা আইডি দিয়ে খুঁজুন..."
                                        value={filterSearch}
                                        onChange={(e) => setFilterSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Student table */}
                            <div className="flex-1 overflow-hidden flex flex-col rounded-lg border bg-white">
                                <div className="shrink-0 px-3 py-2 border-b bg-gray-50 text-sm text-gray-500 flex justify-between">
                                    <span>মোট: <span className="font-bold text-gray-700">{toBengaliNumber(waiverStudents.length)}</span> জন</span>
                                    <span>ডান পাশে সেট করতে <span className="font-bold">অ্যাকশন</span> চাপুন</span>
                                </div>

                                <div className="flex-1 overflow-auto">
                                    {waiverSearching ? (
                                        <div className="flex justify-center items-center py-12 text-purple-600">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        </div>
                                    ) : waiverStudents.length === 0 ? (
                                        <div className="flex flex-col items-center py-12 text-gray-400">
                                            <UserMinus className="w-8 h-8 mb-2 opacity-40" />
                                            <p className="text-sm">কোনো শিক্ষার্থী পাওয়া যায়নি</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Mobile View - Modern Compact Cards */}
                                            <div className="md:hidden flex flex-col gap-2 p-2">
                                                {waiverStudents.map((s) => {
                                                    const sid = String(s.student_id);
                                                    const isSelected = form.student_id === sid;
                                                    const summary = getStudentWaiverSummary(sid);
                                                    const branchName = branchMap[String(s.branch_id)] ?? "-";
                                                    const roll = (s.roll_number ?? s.roll_no) ? String(s.roll_number ?? s.roll_no) : "-";
                                                    const guardianName = String(s.guardian_name ?? "").trim() || "-";
                                                    const mobile = String(s.guardian_mobile ?? s.father_mobile ?? "").trim() || "-";
                                                    const monthly = monthlyFeeByStudentId[sid];

                                                    return (
                                                        <Card key={sid} className={`cursor-pointer transition-colors shadow-sm border overflow-hidden p-0 py-0 gap-0 ${isSelected ? "border-purple-500 bg-purple-50" : "hover:bg-purple-50/30"}`} onClick={() => handleSelectStudent(s)}>
                                                            <div className="p-2.5">
                                                                {/* Top part: Photo + Info */}
                                                                <div className="flex items-start gap-2.5">
                                                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                                                                        {s.photo_url ? (
                                                                            <img src={s.photo_url} alt="" className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <UserRound className="w-4 h-4 text-gray-400" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex justify-between items-start">
                                                                            <div className="truncate pr-2">
                                                                                <h4 className="font-bold text-gray-800 text-sm truncate flex items-center gap-1.5">
                                                                                    {s.name_bn || "-"}
                                                                                    {summary.tone === "has" && (
                                                                                        <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-700 border-purple-200 px-1 py-0 h-3.5 leading-none shrink-0">মওকুফ</Badge>
                                                                                    )}
                                                                                </h4>
                                                                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                                                                                    <span className="font-mono text-purple-600 font-semibold">{sid}</span>
                                                                                    <span>• রোল: {roll === "-" ? "-" : toBengaliNumber(roll)}</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-right shrink-0">
                                                                                <span className="font-bold text-green-700 text-sm">{monthly ? `৳ ${toBengaliNumber(monthly)}` : "-"}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-normal text-gray-600">{s.class_name || "-"}</Badge>
                                                                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-gray-500 bg-gray-50">{branchName}</Badge>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Bottom part: Guardian + Action button */}
                                                                <div className="mt-2.5 pt-2 border-t flex justify-between items-center text-xs text-gray-500">
                                                                    <div className="truncate pr-2">
                                                                        {guardianName} - {mobile === "-" ? "-" : <a href={`tel:${mobile}`} onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:underline">{toBengaliNumber(mobile)}</a>}
                                                                    </div>
                                                                    <Button size="sm" onClick={(e) => { e.stopPropagation(); handleSelectStudent(s); }} className={`h-6 px-2.5 text-[10px] ${isSelected ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                                                                        {isSelected ? "সিলেক্টেড" : "অ্যাকশন"}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    );
                                                })}
                                            </div>

                                            {/* Desktop View - Table */}
                                            <div className="hidden md:block">
                                                <Table>
                                                    <TableHeader className="bg-gray-50 sticky top-0 z-10">
                                                        <TableRow>
                                                            <TableHead className="font-bold text-sm py-2.5">শিক্ষার্থী</TableHead>
                                                            <TableHead className="font-bold text-sm py-2.5">শ্রেণি</TableHead>
                                                            <TableHead className="font-bold text-sm py-2.5">শাখা</TableHead>
                                                            <TableHead className="font-bold text-sm py-2.5">মাসিক</TableHead>
                                                            <TableHead className="font-bold text-sm py-2.5">অভিভাবক</TableHead>
                                                            <TableHead className="font-bold text-sm py-2.5">মোবাইল</TableHead>
                                                            <TableHead className="font-bold text-sm py-2.5 text-right">অ্যাকশন</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {waiverStudents.map((s) => {
                                                            const sid = String(s.student_id);
                                                            const isSelected = form.student_id === sid;
                                                            const summary = getStudentWaiverSummary(sid);
                                                            const branchName = branchMap[String(s.branch_id)] ?? "-";
                                                            const roll = (s.roll_number ?? s.roll_no) ? String(s.roll_number ?? s.roll_no) : "-";
                                                            const guardianName = String(s.guardian_name ?? "").trim() || "-";
                                                            const mobile = String(s.guardian_mobile ?? s.father_mobile ?? "").trim() || "-";
                                                            const monthly = monthlyFeeByStudentId[sid];

                                                            return (
                                                                <TableRow key={sid} className={isSelected ? "bg-purple-50" : "hover:bg-purple-50/30"}>
                                                                    <TableCell className="py-2">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                                                                                {s.photo_url ? (
                                                                                    <img src={s.photo_url} alt="" className="w-full h-full object-cover" />
                                                                                ) : (
                                                                                    <UserRound className="w-5 h-5 text-gray-400" />
                                                                                )}
                                                                            </div>
                                                                            <div>
                                                                                <p className="font-medium text-sm text-gray-800 truncate max-w-[150px]">{s.name_bn || "-"}</p>
                                                                                <div className="text-xs text-gray-400 mt-0.5">
                                                                                    <span className="font-mono text-purple-600 font-semibold">{sid}</span>
                                                                                    {roll !== "-" && <span> • রোল: {toBengaliNumber(roll)}</span>}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="text-sm whitespace-nowrap py-2 text-gray-600">
                                                                        {s.department ? `${s.department} | ` : ""}{s.class_name || "-"}
                                                                    </TableCell>
                                                                    <TableCell className="text-sm whitespace-nowrap py-2">{branchName}</TableCell>
                                                                    <TableCell className="text-sm whitespace-nowrap py-2">
                                                                        <div className="font-semibold text-green-700">{monthly ? `৳ ${toBengaliNumber(monthly)}` : "-"}</div>
                                                                        <div className="text-xs text-gray-400">{summary.text}</div>
                                                                    </TableCell>
                                                                    <TableCell className="text-sm whitespace-nowrap py-2">{guardianName}</TableCell>
                                                                    <TableCell className="text-sm whitespace-nowrap py-2">{mobile === "-" ? "-" : <a href={`tel:${mobile}`} onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:underline">{toBengaliNumber(mobile)}</a>}</TableCell>
                                                                    <TableCell className="text-right whitespace-nowrap py-2">
                                                                        <Button size="sm" onClick={() => handleSelectStudent(s)}
                                                                            className="bg-purple-600 hover:bg-purple-700 h-8 px-4 text-sm">
                                                                            {isSelected ? "সিলেক্টেড" : "অ্যাকশন"}
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ═══ RIGHT: student info + waiver form ═══ */}
                        <div className={`w-full lg:w-[450px] xl:w-[600px] shrink-0 overflow-y-auto bg-gray-50/60 p-2.5 sm:p-3 space-y-2.5 ${!form.student_id ? 'hidden lg:block' : 'block'}`}>
                            {!form.student_id ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16 text-center">
                                    <GraduationCap className="w-12 h-12 mb-3 opacity-30" />
                                    <p className="font-bold text-base text-gray-600">শিক্ষার্থী নির্বাচন করুন</p>
                                    <p className="text-sm mt-1">বাম পাশ থেকে <span className="font-bold text-purple-600">অ্যাকশন</span> চাপুন</p>
                                </div>
                            ) : (
                                <>
                                    {/* Selected student header */}
                                    <div className="flex items-center gap-2.5 bg-white px-3 py-2.5 rounded-xl border border-purple-200 shadow-sm">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-base shrink-0">
                                            {String(form.student_name || "-").charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-base text-gray-900 truncate">{form.student_name}</p>
                                            <div className="text-sm text-gray-400 flex items-center gap-1">ID: <CopyableId id={form.student_id} className="font-mono" /></div>
                                        </div>
                                        <Button size="sm" variant="outline" className="h-8 text-sm px-3 shrink-0"
                                            onClick={() => { setForm((p) => ({ ...p, student_id: "", student_name: "" })); setSelectedStudent(null); }}>
                                            পরিবর্তন
                                        </Button>
                                    </div>

                                    {/* Student info grid */}
                                    {selectedStudent && (
                                        <div className="bg-white rounded-xl border px-3 py-2.5">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">শিক্ষার্থীর তথ্য</p>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                                {([
                                                    { label: "রোল", value: (selectedStudent.roll_number ?? selectedStudent.roll_no) ? toBengaliNumber(String(selectedStudent.roll_number ?? selectedStudent.roll_no)) : "-" },
                                                    { label: "শাখা", value: branchMap[String(selectedStudent.branch_id)] ?? "-" },
                                                    { label: "বিভাগ", value: selectedStudent.department || "-" },
                                                    { label: "শ্রেণি", value: selectedStudent.class_name || "-" },
                                                    { label: "অভিভাবক", value: String(selectedStudent.guardian_name ?? "").trim() || "-" },
                                                    { label: "মোবাইল", value: toBengaliNumber(String(selectedStudent.guardian_mobile ?? selectedStudent.father_mobile ?? "-")) },
                                                ] as { label: string; value: string }[]).map(({ label, value }) => (
                                                    <div key={label}>
                                                        <span className="text-xs text-gray-400">{label}</span>
                                                        <p className="font-semibold text-sm text-gray-800 truncate">{value}</p>
                                                    </div>
                                                ))}
                                                <div className="col-span-2 pt-2 border-t mt-0.5">
                                                    <span className="text-xs text-gray-400">মাসিক ফি (ডিফল্ট)</span>
                                                    <p className="font-bold text-base text-green-700">
                                                        {monthlyFeeByStudentId[form.student_id]
                                                            ? `৳ ${toBengaliNumber(monthlyFeeByStudentId[form.student_id])}`
                                                            : "-"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Current waivers */}
                                    <div className="bg-white rounded-xl border px-3 py-2.5">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">বর্তমান মওকুফ/ছাড়</p>
                                        {(studentWaiversById[form.student_id] ?? []).length === 0 ? (
                                            <p className="text-sm text-gray-400 italic">কোনো অ্যাক্টিভ মওকুফ নেই</p>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {(studentWaiversById[form.student_id] ?? []).map((w) => (
                                                    <div key={w.id} className="flex items-center justify-between gap-2 border rounded-lg px-2.5 py-2 bg-gray-50 text-sm">
                                                        <div className="min-w-0">
                                                            <p className="font-medium truncate">{w.fee_types?.name_bn ?? "ফি"}</p>
                                                            <p className="text-xs text-gray-400">
                                                                {WAIVER_TYPE_LABELS[w.waiver_type] ?? ""}
                                                                {w.reason ? ` • ${w.reason}` : ""}
                                                            </p>
                                                        </div>
                                                        <Badge className="shrink-0 text-xs" variant="secondary">{getWaiverValueLabel(w)}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* New waiver form */}
                                    <div className="bg-white rounded-xl border px-3 py-2.5 space-y-2.5">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">নতুন মওকুফ সেট করুন</p>

                                        {/* ফি টাইপ ও কারণ – এক লাইনে */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-600">ফি টাইপ *</label>
                                                <Select value={form.fee_type_id} onValueChange={(v) => setForm((p) => ({ ...p, fee_type_id: v }))}>
                                                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="সিলেক্ট" /></SelectTrigger>
                                                    <SelectContent>
                                                        {feeTypes.map((ft) => <SelectItem key={ft.id} value={ft.id}>{ft.name_bn}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-600">কারণ</label>
                                                <Select value={form.reason} onValueChange={(v) => setForm((p) => ({ ...p, reason: v }))}>
                                                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="কারণ নির্বাচন" /></SelectTrigger>
                                                    <SelectContent>
                                                        {WAIVER_REASONS.map((r, i) => <SelectItem key={i} value={r}>{r}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* ছাড়ের ধরন ও পরিমাণ */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-600">ছাড়ের ধরন</label>
                                                <Select value={form.waiver_type}
                                                    onValueChange={(v) => setForm((p) => ({ ...p, waiver_type: v, waiver_value: v === "full" ? "100" : p.waiver_value }))}>
                                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="full">পূর্ণ মওকুফ</SelectItem>
                                                        <SelectItem value="percentage">শতকরা (%)</SelectItem>
                                                        <SelectItem value="fixed_amount">নির্দিষ্ট (৳)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {form.waiver_type !== "full" && (
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-gray-600">
                                                        {form.waiver_type === "percentage" ? "শতকরা (%)" : "পরিমাণ (৳)"}
                                                    </label>
                                                    <Input type="number" className="h-8 text-xs"
                                                        value={form.waiver_value}
                                                        onChange={(e) => setForm((p) => ({ ...p, waiver_value: e.target.value }))} />
                                                </div>
                                            )}
                                        </div>

                                        {/* তারিখ */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-600">শুরুর তারিখ</label>
                                                <Input type="date" className="h-8 text-xs"
                                                    value={form.start_date}
                                                    onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-600">শেষ তারিখ</label>
                                                <Input type="date" className="h-8 text-xs"
                                                    value={form.end_date}
                                                    onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <DialogFooter className="px-5 py-3 border-t shrink-0 bg-white">
                        <Button variant="outline" onClick={() => handleModalOpenChange(false)}>বাতিল</Button>
                        <Button onClick={handleSave} disabled={saving || !form.student_id || !form.fee_type_id} className="bg-purple-600 hover:bg-purple-700">
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                            সংরক্ষণ করুন
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ══════════════════════════════════════ */}
            {/* Edit Waiver Modal                      */}
            {/* ══════════════════════════════════════ */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="w-full max-w-md h-[100dvh] md:h-auto md:max-h-[90vh] md:rounded-xl rounded-none p-0 flex flex-col overflow-hidden gap-0">
                    <DialogHeader className="px-4 py-3 md:px-5 md:py-4 border-b bg-gray-50 shrink-0 flex flex-row items-center justify-between">
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-base text-gray-800">
                                <Edit className="w-4 h-4 text-blue-600" /> ছাড়/মওকুফ আপডেট
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500 mt-1">
                                শিক্ষার্থী: <span className="font-bold text-gray-800">{editForm.student_name}</span> ({editForm.student_id})
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">ফি টাইপ *</label>
                                <Select value={editForm.fee_type_id} onValueChange={(v) => setEditForm((p) => ({ ...p, fee_type_id: v }))}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="সিলেক্ট" /></SelectTrigger>
                                    <SelectContent>
                                        {feeTypes.map((ft) => <SelectItem key={ft.id} value={ft.id}>{ft.name_bn}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">কারণ</label>
                                <Select value={editForm.reason} onValueChange={(v) => setEditForm((p) => ({ ...p, reason: v }))}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="কারণ নির্বাচন" /></SelectTrigger>
                                    <SelectContent>
                                        {WAIVER_REASONS.map((r, i) => <SelectItem key={i} value={r}>{r}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">ছাড়ের ধরন</label>
                                <Select value={editForm.waiver_type}
                                    onValueChange={(v) => setEditForm((p) => ({ ...p, waiver_type: v, waiver_value: v === "full" ? "100" : p.waiver_value }))}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full">পূর্ণ মওকুফ</SelectItem>
                                        <SelectItem value="percentage">শতকরা (%)</SelectItem>
                                        <SelectItem value="fixed_amount">নির্দিষ্ট (৳)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {editForm.waiver_type !== "full" && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">
                                        {editForm.waiver_type === "percentage" ? "শতকরা (%)" : "পরিমাণ (৳)"}
                                    </label>
                                    <Input type="number" className="h-9"
                                        value={editForm.waiver_value}
                                        onChange={(e) => setEditForm((p) => ({ ...p, waiver_value: e.target.value }))} />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">শুরুর তারিখ</label>
                                <Input type="date" className="h-9 text-sm"
                                    value={editForm.start_date}
                                    onChange={(e) => setEditForm((p) => ({ ...p, start_date: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">শেষ তারিখ</label>
                                <Input type="date" className="h-9 text-sm"
                                    value={editForm.end_date}
                                    onChange={(e) => setEditForm((p) => ({ ...p, end_date: e.target.value }))} />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-5 py-4 border-t shrink-0 bg-gray-50/50">
                        <Button variant="outline" onClick={() => setEditModalOpen(false)}>বাতিল</Button>
                        <Button onClick={handleUpdate} disabled={saving || !editForm.fee_type_id} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            আপডেট করুন
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}