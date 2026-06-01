"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Loader2, Plus, Trash2, Edit3, Settings2, Layers3, 
    Zap, Tag, CheckCircle2, AlertCircle, BookOpen,
    History, RefreshCw
} from "lucide-react";
import { sortClassNames } from "@/lib/classOrder";

const toBengaliNumber = (num: any) => String(num).replace(/[0-9]/g, c => "০১২৩৪৫৬৭৮৯"[parseInt(c)]);

const frequencyLabels: Record<string, string> = {
    monthly: "মাসিক",
    yearly: "বাৎসরিক",
    one_time: "এককালীন",
    exam_based: "পরীক্ষা ভিত্তিক"
};



const bengaliMonths = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

const shortBengaliMonths = ["জানু", "ফেব্রু", "মার্চ", "এপ্রি", "মে", "জুন", "জুলা", "আগ", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];

type BranchGenerationStat = {
    branchId: string;
    branchName: string;
    generated: number;
    skipped: number;
    gross: number;
    waiver: number;
    net: number;
};

type GenerationHistoryRow = {
    key: string;
    generatedAt: string;
    branchName: string;
    className: string;
    feeName: string;
    monthYear: string;
    count: number;
    gross: number;
    waiver: number;
    net: number;
    paid: number;
    pending: number;
};

const getCalculatedNetAmount = (due: any) => {
    const amount = Number(due?.amount) || 0;
    const fine = Number(due?.fine) || 0;
    const waiver = Number(due?.waiver) || 0;
    const calculated = Math.max(amount + fine - waiver, 0);
    const stored = due?.net_amount == null ? null : Number(due.net_amount);

    if (stored !== null && (stored > 0 || calculated === 0)) return stored;
    return calculated;
};

const getFeeName = (due: any) => (
    due?.fee_types?.name_bn ||
    due?.fee_structures?.fee_types?.name_bn ||
    (typeof due?.title === "string" ? due.title.split(" - ")[0] : "") ||
    "ফি"
);

const getMonthYearLabel = (due: any) => {
    if (due?.fee_month || due?.fee_year) {
        const monthLabel = due?.fee_month ? shortBengaliMonths[Number(due.fee_month) - 1] : "";
        const yearLabel = due?.fee_year ? toBengaliNumber(due.fee_year) : "";
        return `${monthLabel ? `${monthLabel} ` : ""}${yearLabel}`.trim();
    }

    if (typeof due?.title === "string") {
        const title = due.title;
        const monthIndex = bengaliMonths.findIndex(m => title.includes(m));
        const yearMatch = title.match(/(২০\d{2}|\d{4})/);
        if (monthIndex >= 0 || yearMatch) {
            return `${monthIndex >= 0 ? `${shortBengaliMonths[monthIndex]} ` : ""}${yearMatch ? toBengaliNumber(yearMatch[1]) : ""}`.trim();
        }
    }

    return "-";
};

const getMonthEndDate = (year: number, month: number) => {
    const date = new Date(year, month, 0);
    return date.toISOString().split("T")[0];
};

export default function FeeSetup() {
    // Data States
    const [feeTypes, setFeeTypes] = useState<any[]>([]);
    const [structures, setStructures] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [classes, setClasses] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("structures");

    // Fee Type Modal
    const [feeTypeModal, setFeeTypeModal] = useState(false);
    const [feeTypeForm, setFeeTypeForm] = useState({ name_bn: "", description: "" });
    const [savingFeeType, setSavingFeeType] = useState(false);
    const [editingFeeType, setEditingFeeType] = useState<any>(null);

    // Structure Form
    const [structureForm, setStructureForm] = useState({
        branch_id: "", class_name: "all", fee_type_id: "", amount: "", frequency: "monthly"
    });
    const [savingStructure, setSavingStructure] = useState(false);
    const [editingStructure, setEditingStructure] = useState<any>(null);

    // Generation Form
    const [genForm, setGenForm] = useState({
        branch_id: "all", class_name: "all", fee_type_id: "all",
        month: new Date().getMonth(), year: new Date().getFullYear()
    });
    const [generating, setGenerating] = useState(false);
    const [genResult, setGenResult] = useState<string | null>(null);
    const [generationStats, setGenerationStats] = useState<BranchGenerationStat[]>([]);
    const [generationHistory, setGenerationHistory] = useState<GenerationHistoryRow[]>([]);



    // ---------- DATA FETCHING ----------

    const normalizeClassName = (value: unknown) => {
        return String(value ?? "")
            .trim()
            .normalize("NFC")
            .replace(/\u09AF\u09BC/g, "\u09DF");
    };

    async function fetchGenerationHistory(branchLookup?: Map<string, string>) {
        const { data, error } = await supabase
            .from("student_dues")
            .select(`
                id, title, amount, waiver, fine, paid_amount, net_amount, status,
                fee_month, fee_year, created_at,
                students!inner(branch_id, class_name, department),
                fee_types(name_bn),
                fee_structures(branch_id, class_name, fee_types(name_bn))
            `)
            .order("created_at", { ascending: false })
            .limit(1000);

        if (error) {
            console.error("Fee generation history fetch error:", error);
            setGenerationHistory([]);
            return;
        }

        const branchMap = branchLookup || new Map(branches.map((b: any) => [String(b.id), b.name]));
        const grouped = new Map<string, GenerationHistoryRow>();

        (data || []).forEach((due: any) => {
            const studentInfo = Array.isArray(due.students) ? due.students[0] : due.students;
            const branchId = String(studentInfo?.branch_id || due.fee_structures?.branch_id || "unknown");
            const branchName = branchMap.get(branchId) || `শাখা ${branchId}`;
            const className = studentInfo?.class_name || due.fee_structures?.class_name || "সকল শ্রেণি";
            const feeName = getFeeName(due);
            const monthYear = getMonthYearLabel(due);
            const generatedAt = due.created_at || "";
            const dayKey = generatedAt ? generatedAt.slice(0, 10) : "unknown";
            const key = `${dayKey}|${branchId}|${className}|${feeName}|${monthYear}`;
            const net = getCalculatedNetAmount(due);
            const gross = Number(due.amount) || 0;
            const waiver = Number(due.waiver) || 0;
            const paid = due.status === "paid" ? net : 0;

            if (!grouped.has(key)) {
                grouped.set(key, {
                    key,
                    generatedAt,
                    branchName,
                    className,
                    feeName,
                    monthYear,
                    count: 0,
                    gross: 0,
                    waiver: 0,
                    net: 0,
                    paid: 0,
                    pending: 0
                });
            }

            const row = grouped.get(key)!;
            row.count += 1;
            row.gross += gross;
            row.waiver += waiver;
            row.net += net;
            row.paid += paid;
            if (due.status !== "paid" && due.status !== "waived") row.pending += net - (Number(due.paid_amount) || 0);
        });

        setGenerationHistory(
            Array.from(grouped.values())
                .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
                .slice(0, 20)
        );
    }

    async function fetchAll() {
        setLoading(true);
        const [ftRes, brRes, stRes] = await Promise.all([
            supabase.from("fee_types").select("*").eq("is_active", true).order("is_default", { ascending: false }),
            supabase.from("branches").select("id, name"),
            supabase.from("fee_structures").select("*, branches(name), fee_types(name_bn)").eq("is_active", true).order("created_at", { ascending: false })
        ]);

        if (ftRes.data) setFeeTypes(ftRes.data);
        if (brRes.data) setBranches(brRes.data);
        if (stRes.data) setStructures(stRes.data);

        const branchMap = new Map((brRes.data || []).map((b: any) => [String(b.id), b.name]));
        await fetchGenerationHistory(branchMap);

        // Fetch unique class names
        const { data: classData } = await supabase.from("students").select("class_name").eq("status", "active");
        if (classData) {
            const map = new Map<string, string>();
            for (const row of classData as any[]) {
                const raw = String(row?.class_name ?? "").trim();
                if (!raw) continue;
                const normalized = normalizeClassName(raw);
                if (!normalized) continue;
                if (!map.has(normalized)) map.set(normalized, raw);
            }
            setClasses(sortClassNames(Array.from(map.values())));
        }

        setLoading(false);
    }

    useEffect(() => { fetchAll(); }, []);

    // ---------- FEE TYPE CRUD ----------

    const handleSaveFeeType = async () => {
        if (!feeTypeForm.name_bn.trim()) return alert("ফি টাইপের নাম দিন");
        setSavingFeeType(true);

        const payload = {
            name_bn: feeTypeForm.name_bn.trim(),
            description: feeTypeForm.description
        };

        let error;
        if (editingFeeType) {
            ({ error } = await supabase.from("fee_types").update(payload).eq("id", editingFeeType.id));
        } else {
            ({ error } = await supabase.from("fee_types").insert({ ...payload, is_default: false }));
        }

        if (error) alert("ত্রুটি: " + error.message);
        else {
            setFeeTypeModal(false);
            setFeeTypeForm({ name_bn: "", description: "" });
            setEditingFeeType(null);
            fetchAll();
        }
        setSavingFeeType(false);
    };

    const handleEditFeeType = (ft: any) => {
        setEditingFeeType(ft);
        setFeeTypeForm({ name_bn: ft.name_bn, description: ft.description || "" });
        setFeeTypeModal(true);
    };

    const handleDeleteFeeType = async (id: string) => {
        if (!confirm("এই ফি টাইপ মুছে ফেলতে চান?")) return;
        await supabase.from("fee_types").update({ is_active: false }).eq("id", id);
        fetchAll();
    };

    // ---------- STRUCTURE CRUD ----------

    const handleSaveStructure = async () => {
        if (!structureForm.branch_id || !structureForm.fee_type_id || !structureForm.amount) {
            return alert("শাখা, ফি টাইপ ও পরিমাণ দিন");
        }
        setSavingStructure(true);

        const payload = {
            branch_id: parseInt(structureForm.branch_id),
            class_name: structureForm.class_name,
            fee_type_id: structureForm.fee_type_id,
            amount: parseFloat(structureForm.amount),
            frequency: structureForm.frequency,
            academic_year: new Date().getFullYear()
        };

        let error;
        if (editingStructure) {
            ({ error } = await supabase.from("fee_structures").update(payload).eq("id", editingStructure.id));
        } else {
            ({ error } = await supabase.from("fee_structures").insert(payload));
        }

        if (error) alert("ত্রুটি: " + error.message);
        else {
            setStructureForm({ branch_id: "", class_name: "all", fee_type_id: "", amount: "", frequency: "monthly" });
            setEditingStructure(null);
            fetchAll();
        }
        setSavingStructure(false);
    };

    const handleEditStructure = (s: any) => {
        setEditingStructure(s);
        setStructureForm({
            branch_id: String(s.branch_id),
            class_name: s.class_name || "all",
            fee_type_id: s.fee_type_id,
            amount: String(s.amount),
            frequency: s.frequency
        });
        setActiveTab("structures");
    };

    const handleDeleteStructure = async (id: string) => {
        if (!confirm("এই ফি স্ট্রাকচার মুছে ফেলতে চান?")) return;
        await supabase.from("fee_structures").update({ is_active: false }).eq("id", id);
        fetchAll();
    };

    // ---------- FEE GENERATION ----------

    const handleGenerate = async () => {
        setGenerating(true);
        setGenResult(null);
        setGenerationStats([]);

        try {
            // Get matching structures
            let structureQuery = supabase.from("fee_structures").select("*, fee_types(name_bn)").eq("is_active", true);
            if (genForm.branch_id !== "all") structureQuery = structureQuery.eq("branch_id", parseInt(genForm.branch_id));
            if (genForm.fee_type_id !== "all") structureQuery = structureQuery.eq("fee_type_id", genForm.fee_type_id);

            const { data: matchedStructures } = await structureQuery;
            if (!matchedStructures || matchedStructures.length === 0) {
                setGenResult("কোনো ম্যাচিং ফি স্ট্রাকচার পাওয়া যায়নি।");
                setGenerating(false);
                return;
            }

            let totalGenerated = 0;
            let totalSkipped = 0;
            let totalGeneratedAmount = 0;
            const genMonth = genForm.month + 1;
            const branchMap = new Map(branches.map((b: any) => [String(b.id), b.name]));
            const statMap = new Map<string, BranchGenerationStat>();

            const getBranchStat = (branchId: string | number) => {
                const key = String(branchId || "unknown");
                if (!statMap.has(key)) {
                    statMap.set(key, {
                        branchId: key,
                        branchName: branchMap.get(key) || `শাখা ${key}`,
                        generated: 0,
                        skipped: 0,
                        gross: 0,
                        waiver: 0,
                        net: 0
                    });
                }
                return statMap.get(key)!;
            };

            for (const structure of matchedStructures) {
                // Get eligible students
                let studentQuery = supabase.from("students").select("id, student_id, branch_id").eq("status", "active");
                if (structure.branch_id) studentQuery = studentQuery.eq("branch_id", structure.branch_id);
                if (structure.class_name && structure.class_name !== "all") {
                    if (genForm.class_name !== "all") {
                        studentQuery = studentQuery.eq("class_name", genForm.class_name);
                    } else {
                        studentQuery = studentQuery.eq("class_name", structure.class_name);
                    }
                } else if (genForm.class_name !== "all") {
                    studentQuery = studentQuery.eq("class_name", genForm.class_name);
                }

                const { data: students } = await studentQuery;
                if (!students || students.length === 0) continue;

                // Get fee type name
                const feeType = feeTypes.find(ft => ft.id === structure.fee_type_id);
                const feeTypeName = structure.fee_types?.name_bn || feeType?.name_bn || "ফি";
                const monthName = bengaliMonths[genForm.month];
                const title = `${feeTypeName} - ${monthName} ${genForm.year}`;

                // Get active waivers for this fee type
                const { data: activeWaivers } = await supabase.from("student_waivers")
                    .select("*")
                    .eq("fee_type_id", structure.fee_type_id)
                    .eq("is_active", true);

                const waiverMap = new Map();
                if (activeWaivers) {
                    activeWaivers.forEach(w => waiverMap.set(w.student_id, w));
                }

                const newDues: any[] = [];

                for (const student of students) {
                    // Check if already generated for this structure and title
                    const { data: existingByMonth } = await supabase.from("student_dues")
                        .select("id")
                        .eq("student_id", student.id)
                        .eq("fee_structure_id", structure.id)
                        .eq("fee_month", genMonth)
                        .eq("fee_year", genForm.year)
                        .limit(1);

                    let existing = existingByMonth;
                    if (!existingByMonth || existingByMonth.length === 0) {
                        const { data: existingByTitle } = await supabase.from("student_dues")
                            .select("id")
                            .eq("student_id", student.id)
                            .eq("fee_structure_id", structure.id)
                            .eq("title", title)
                            .limit(1);
                        existing = existingByTitle;
                    }

                    if (existing && existing.length > 0) {
                        totalSkipped++;
                        getBranchStat(student.branch_id || structure.branch_id).skipped += 1;
                        continue;
                    }

                    // Calculate waiver
                    let waiverAmount = 0;
                    const waiver = waiverMap.get(student.student_id);
                    if (waiver) {
                        if (waiver.waiver_type === "full") {
                            waiverAmount = structure.amount;
                        } else if (waiver.waiver_type === "percentage") {
                            waiverAmount = Math.round((structure.amount * waiver.waiver_value) / 100);
                        } else if (waiver.waiver_type === "fixed_amount") {
                            waiverAmount = Math.min(waiver.waiver_value, structure.amount);
                        }
                    }

                    const netAmount = structure.amount - waiverAmount;
                    const branchStat = getBranchStat(student.branch_id || structure.branch_id);
                    branchStat.generated += 1;
                    branchStat.gross += Number(structure.amount) || 0;
                    branchStat.waiver += waiverAmount;
                    branchStat.net += netAmount;

                    newDues.push({
                        student_id: student.id,
                        fee_structure_id: structure.id,
                        fee_type_id: structure.fee_type_id,
                        title: title,
                        amount: structure.amount,
                        waiver: waiverAmount,
                        fine: 0,
                        paid_amount: 0,
                        net_amount: netAmount,
                        fee_month: genMonth,
                        fee_year: genForm.year,
                        due_date: getMonthEndDate(genForm.year, genMonth),
                        status: netAmount <= 0 ? "paid" : "pending"
                    });
                }

                if (newDues.length > 0) {
                    const { error } = await supabase.from("student_dues").insert(newDues);
                    if (error) {
                        setGenResult(`ত্রুটি: ${error.message}`);
                        setGenerating(false);
                        return;
                    }
                    totalGenerated += newDues.length;
                    totalGeneratedAmount += newDues.reduce((sum, due) => sum + (Number(due.net_amount) || 0), 0);
                }
            }

            setGenerationStats(Array.from(statMap.values()));
            setGenResult(`✅ সফল! ${toBengaliNumber(totalGenerated)} জনের ফি জেনারেট হয়েছে। মোট টাকা ৳ ${toBengaliNumber(totalGeneratedAmount)}।${totalSkipped > 0 ? ` (${toBengaliNumber(totalSkipped)} জনের আগেই জেনারেট করা ছিল)` : ""}`);
            fetchAll();

        } catch (err: any) {
            setGenResult(`ত্রুটি: ${err.message}`);
        }
        setGenerating(false);
    };



    // ---------- RENDER ----------

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-green-600" /></div>;

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="overflow-x-auto">
                    <TabsList className="flex w-max min-w-full bg-white border h-auto p-0.5 sm:p-1 rounded-lg">
                        <TabsTrigger value="structures" className="font-bold whitespace-nowrap text-[11px] sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 gap-1 sm:gap-2">
                            <Layers3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> ফি স্ট্রাকচার
                        </TabsTrigger>
                        <TabsTrigger value="generate" className="font-bold whitespace-nowrap text-[11px] sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 gap-1 sm:gap-2">
                            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> ফি জেনারেশন
                        </TabsTrigger>
                        <TabsTrigger value="fee_types" className="font-bold whitespace-nowrap text-[11px] sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 gap-1 sm:gap-2">
                            <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> ফি টাইপ
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* ==================== TAB 1: FEE STRUCTURES ==================== */}
                <TabsContent value="structures" className="space-y-6 mt-4">
                    {/* Create/Edit Form */}
                    <Card className="border-l-4 border-l-blue-600 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                <Settings2 className="w-5 h-5 text-blue-600" />
                                {editingStructure ? "ফি স্ট্রাকচার সম্পাদনা" : "নতুন ফি স্ট্রাকচার তৈরি করুন"}
                            </CardTitle>
                            <CardDescription>শাখা ও শ্রেণি অনুযায়ী ফি নির্ধারণ করুন</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600">শাখা *</label>
                                    <Select value={structureForm.branch_id} onValueChange={v => setStructureForm({ ...structureForm, branch_id: v })}>
                                        <SelectTrigger className="h-10"><SelectValue placeholder="শাখা নির্বাচন" /></SelectTrigger>
                                        <SelectContent>
                                            {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600">শ্রেণি</label>
                                    <Select value={structureForm.class_name} onValueChange={v => setStructureForm({ ...structureForm, class_name: v })}>
                                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">সকল শ্রেণি</SelectItem>
                                            {classes.map((c, i) => <SelectItem key={i} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600">ফি টাইপ *</label>
                                    <Select value={structureForm.fee_type_id} onValueChange={v => setStructureForm({ ...structureForm, fee_type_id: v })}>
                                        <SelectTrigger className="h-10"><SelectValue placeholder="সিলেক্ট করুন" /></SelectTrigger>
                                        <SelectContent>
                                            {feeTypes.map(ft => <SelectItem key={ft.id} value={ft.id}>{ft.name_bn}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600">পরিমাণ (৳) *</label>
                                    <Input type="number" className="h-10" placeholder="0" value={structureForm.amount} onChange={e => setStructureForm({ ...structureForm, amount: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600">ফ্রিকোয়েন্সি</label>
                                    <Select value={structureForm.frequency} onValueChange={v => setStructureForm({ ...structureForm, frequency: v })}>
                                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">মাসিক</SelectItem>
                                            <SelectItem value="yearly">বাৎসরিক</SelectItem>
                                            <SelectItem value="one_time">এককালীন</SelectItem>
                                            <SelectItem value="exam_based">পরীক্ষা ভিত্তিক</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button onClick={handleSaveStructure} disabled={savingStructure} className="bg-blue-600 hover:bg-blue-700">
                                    {savingStructure ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                    {editingStructure ? "আপডেট করুন" : "সংরক্ষণ করুন"}
                                </Button>
                                {editingStructure && (
                                    <Button variant="outline" onClick={() => { setEditingStructure(null); setStructureForm({ branch_id: "", class_name: "all", fee_type_id: "", amount: "", frequency: "monthly" }); }}>
                                        বাতিল
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Structure List */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-gray-600" /> ফি স্ট্রাকচার তালিকা
                                <Badge variant="secondary" className="ml-2">{toBengaliNumber(structures.length)} টি</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {structures.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Layers3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p className="font-bold">কোনো ফি স্ট্রাকচার তৈরি করা হয়নি</p>
                                    <p className="text-sm mt-1">উপরের ফর্ম থেকে নতুন ফি স্ট্রাকচার তৈরি করুন</p>
                                </div>
                            ) : (
                                <>
                                    {/* Mobile Cards */}
                                    <div className="md:hidden space-y-3">
                                        {structures.map(s => (
                                            <Card key={s.id} className="border-l-3 border-l-blue-400 shadow-sm">
                                                <CardContent className="p-3 space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-bold text-gray-800">{s.fee_types?.name_bn}</p>
                                                            <p className="text-xs text-gray-500">{s.branches?.name} | {s.class_name === "all" ? "সকল শ্রেণি" : s.class_name}</p>
                                                        </div>
                                                        <Badge className="bg-blue-50 text-blue-700 border-blue-200">{frequencyLabels[s.frequency]}</Badge>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-1 border-t">
                                                        <span className="text-lg font-bold text-green-700">৳ {toBengaliNumber(s.amount)}</span>
                                                        <div className="flex gap-1">
                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600" onClick={() => handleEditStructure(s)}>
                                                                <Edit3 className="w-4 h-4" />
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDeleteStructure(s.id)}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    {/* Desktop Table */}
                                    <div className="hidden md:block border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-gray-50">
                                                <TableRow>
                                                    <TableHead className="font-bold">ফি টাইপ</TableHead>
                                                    <TableHead className="font-bold">শাখা</TableHead>
                                                    <TableHead className="font-bold">শ্রেণি</TableHead>
                                                    <TableHead className="font-bold">ধরন</TableHead>
                                                    <TableHead className="font-bold text-right">পরিমাণ</TableHead>
                                                    <TableHead className="font-bold text-right">অ্যাকশন</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {structures.map(s => (
                                                    <TableRow key={s.id} className="hover:bg-blue-50/30">
                                                        <TableCell className="font-bold text-gray-800">{s.fee_types?.name_bn}</TableCell>
                                                        <TableCell>{s.branches?.name}</TableCell>
                                                        <TableCell>{s.class_name === "all" ? "সকল শ্রেণি" : s.class_name}</TableCell>
                                                        <TableCell><Badge variant="outline" className="text-xs">{frequencyLabels[s.frequency]}</Badge></TableCell>
                                                        <TableCell className="text-right font-bold text-green-700">৳ {toBengaliNumber(s.amount)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50" onClick={() => handleEditStructure(s)}>
                                                                    <Edit3 className="w-4 h-4" />
                                                                </Button>
                                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50" onClick={() => handleDeleteStructure(s.id)}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ==================== TAB 2: FEE GENERATION ==================== */}
                <TabsContent value="generate" className="space-y-6 mt-4">
                    <Card className="border-l-4 border-l-green-600 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                <Zap className="w-5 h-5 text-green-600" /> ফি জেনারেশন
                            </CardTitle>
                            <CardDescription>
                                নির্দিষ্ট মাস ও বছরের জন্য সকল শিক্ষার্থীর ফি একসাথে জেনারেট করুন। ওয়েভার স্বয়ংক্রিয়ভাবে প্রয়োগ হবে।
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600">শাখা</label>
                                    <Select value={genForm.branch_id} onValueChange={v => setGenForm({ ...genForm, branch_id: v })}>
                                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">সকল শাখা</SelectItem>
                                            {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600">শ্রেণি</label>
                                    <Select value={genForm.class_name} onValueChange={v => setGenForm({ ...genForm, class_name: v })}>
                                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">সকল শ্রেণি</SelectItem>
                                            {classes.map((c, i) => <SelectItem key={i} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600">ফি টাইপ</label>
                                    <Select value={genForm.fee_type_id} onValueChange={v => setGenForm({ ...genForm, fee_type_id: v })}>
                                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">সকল ফি টাইপ</SelectItem>
                                            {feeTypes.map(ft => <SelectItem key={ft.id} value={ft.id}>{ft.name_bn}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600">মাস</label>
                                    <Select value={String(genForm.month)} onValueChange={v => setGenForm({ ...genForm, month: parseInt(v) })}>
                                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {bengaliMonths.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600">বছর</label>
                                    <Select value={String(genForm.year)} onValueChange={v => setGenForm({ ...genForm, year: parseInt(v) })}>
                                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{toBengaliNumber(y)}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
                                <Button onClick={handleGenerate} disabled={generating} className="bg-green-600 hover:bg-green-700 h-11 px-6 shadow-md">
                                    {generating ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                                    ফি জেনারেট করুন
                                </Button>
                                {genResult && (
                                    <div className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg ${genResult.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                        {genResult.startsWith("✅") ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                        {genResult}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {generationStats.length > 0 && (
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" /> সর্বশেষ জেনারেশন সামারি
                                </CardTitle>
                                <CardDescription>শাখাভিত্তিক কতজনের কত টাকা ফি তৈরি হয়েছে</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto border rounded-lg">
                                    <Table>
                                        <TableHeader className="bg-gray-50">
                                            <TableRow>
                                                <TableHead className="font-bold">শাখা</TableHead>
                                                <TableHead className="text-center font-bold">জেনারেটেড</TableHead>
                                                <TableHead className="text-center font-bold">স্কিপড</TableHead>
                                                <TableHead className="text-right font-bold">মূল টাকা</TableHead>
                                                <TableHead className="text-right font-bold">ছাড়</TableHead>
                                                <TableHead className="text-right font-bold">নেট টাকা</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {generationStats.map(stat => (
                                                <TableRow key={stat.branchId}>
                                                    <TableCell className="font-bold text-gray-800">{stat.branchName}</TableCell>
                                                    <TableCell className="text-center">{toBengaliNumber(stat.generated)} জন</TableCell>
                                                    <TableCell className="text-center text-amber-700">{toBengaliNumber(stat.skipped)} জন</TableCell>
                                                    <TableCell className="text-right">৳ {toBengaliNumber(stat.gross)}</TableCell>
                                                    <TableCell className="text-right text-purple-700">৳ {toBengaliNumber(stat.waiver)}</TableCell>
                                                    <TableCell className="text-right font-bold text-green-700">৳ {toBengaliNumber(stat.net)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="shadow-sm">
                        <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3">
                            <div>
                                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                    <History className="w-5 h-5 text-slate-600" /> ফি জেনারেশন হিস্টোরি
                                </CardTitle>
                                <CardDescription>ডাটাবেজে থাকা জেনারেটেড ফি শাখা, শ্রেণি ও মাস অনুযায়ী</CardDescription>
                            </div>
                            <Button variant="outline" size="icon-sm" onClick={() => fetchGenerationHistory()} title="রিফ্রেশ">
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {generationHistory.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 border rounded-lg bg-gray-50">
                                    <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                    <p className="font-bold">কোনো জেনারেশন হিস্টোরি পাওয়া যায়নি</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto border rounded-lg">
                                    <Table>
                                        <TableHeader className="bg-gray-50">
                                            <TableRow>
                                                <TableHead className="font-bold">তারিখ</TableHead>
                                                <TableHead className="font-bold">শাখা</TableHead>
                                                <TableHead className="font-bold">শ্রেণি</TableHead>
                                                <TableHead className="font-bold">ফি</TableHead>
                                                <TableHead className="font-bold">মাস/বছর</TableHead>
                                                <TableHead className="text-center font-bold">শিক্ষার্থী</TableHead>
                                                <TableHead className="text-right font-bold">জেনারেটেড টাকা</TableHead>
                                                <TableHead className="text-right font-bold">বকেয়া</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {generationHistory.map(row => (
                                                <TableRow key={row.key}>
                                                    <TableCell className="text-sm whitespace-nowrap">
                                                        {row.generatedAt ? new Date(row.generatedAt).toLocaleDateString("bn-BD") : "-"}
                                                    </TableCell>
                                                    <TableCell className="font-medium">{row.branchName}</TableCell>
                                                    <TableCell>{row.className}</TableCell>
                                                    <TableCell>{row.feeName}</TableCell>
                                                    <TableCell>{row.monthYear}</TableCell>
                                                    <TableCell className="text-center">{toBengaliNumber(row.count)} জন</TableCell>
                                                    <TableCell className="text-right font-bold text-green-700">৳ {toBengaliNumber(row.net)}</TableCell>
                                                    <TableCell className="text-right font-bold text-red-600">৳ {toBengaliNumber(row.pending)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Info Card */}
                    <Card className="bg-amber-50 border-amber-200">
                        <CardContent className="p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800">
                                <p className="font-bold mb-1">জেনারেশন সম্পর্কে গুরুত্বপূর্ণ তথ্য:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>একই মাস/বছরে একই ফি স্ট্রাকচারের জন্য ডুপ্লিকেট ফি জেনারেট হবে না।</li>
                                    <li>যে শিক্ষার্থীর ওয়েভার আছে, তার ফি থেকে স্বয়ংক্রিয়ভাবে ছাড় কেটে নেওয়া হবে।</li>
                                    <li>পূর্ণ মওকুফ প্রাপ্ত শিক্ষার্থীদের নেট টাকা ০ হিসেবে হিসাব হবে।</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>



                {/* ==================== TAB 4: FEE TYPES ==================== */}
                <TabsContent value="fee_types" className="space-y-6 mt-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-amber-600" /> ফি টাইপ ম্যানেজমেন্ট
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500">মাদ্রাসায় প্রযোজ্য সকল ধরনের ফি এখানে পরিচালনা করুন</p>
                        </div>
                        <Button onClick={() => { setEditingFeeType(null); setFeeTypeForm({ name_bn: "", description: "" }); setFeeTypeModal(true); }} className="bg-amber-600 hover:bg-amber-700 shadow-md">
                            <Plus className="w-4 h-4 mr-2" /> নতুন ফি টাইপ
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {feeTypes.map(ft => (
                            <Card key={ft.id} className={`shadow-sm hover:shadow-md transition-shadow ${ft.is_default ? "border-l-3 border-l-amber-400" : "border-l-3 border-l-gray-300"}`}>
                                <CardContent className="p-4 flex items-start justify-between">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-800">{ft.name_bn}</p>
                                            {ft.is_default && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">ডিফল্ট</Badge>}
                                        </div>
                                        {ft.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ft.description}</p>}
                                    </div>
                                    <div className="flex flex-col gap-1 shrink-0">
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-500" onClick={() => handleEditFeeType(ft)}>
                                            <Edit3 className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDeleteFeeType(ft.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Fee Type Modal */}
                    <Dialog open={feeTypeModal} onOpenChange={setFeeTypeModal}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2"><Tag className="w-5 h-5 text-amber-600" /> {editingFeeType ? "ফি টাইপ সম্পাদনা" : "নতুন ফি টাইপ"}</DialogTitle>
                                <DialogDescription>{editingFeeType ? "ফি টাইপের তথ্য পরিবর্তন করুন" : "কাস্টম ফি টাইপ তৈরি করুন"}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-2">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700">ফি টাইপের নাম (বাংলায়)</label>
                                    <Input placeholder="যেমন: ল্যাব ফি" value={feeTypeForm.name_bn} onChange={e => setFeeTypeForm({ ...feeTypeForm, name_bn: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700">বিবরণ (ঐচ্ছিক)</label>
                                    <Textarea placeholder="এই ফি সম্পর্কে সংক্ষিপ্ত বিবরণ..." rows={2} value={feeTypeForm.description} onChange={e => setFeeTypeForm({ ...feeTypeForm, description: e.target.value })} />
                                </div>
                            </div>
                            <DialogFooter className="mt-4">
                                <Button variant="outline" onClick={() => setFeeTypeModal(false)}>বাতিল</Button>
                                <Button onClick={handleSaveFeeType} disabled={savingFeeType} className="bg-amber-600 hover:bg-amber-700">
                                    {savingFeeType ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : (editingFeeType ? <Edit3 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />)}
                                    {editingFeeType ? "আপডেট করুন" : "সংরক্ষণ করুন"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TabsContent>
            </Tabs>
        </div>
    );
}
