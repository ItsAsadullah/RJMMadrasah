"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Loader2, Search, Printer, DollarSign, UserRound, GraduationCap, X, Receipt, Eye, CreditCard, CheckCircle2, Download } from "lucide-react";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import { toJpeg } from "html-to-image";
import PaymentSlip from "@/components/dashboard/accounts/PaymentSlip";
import { getClassOrder, sortClassNames } from "@/lib/classOrder";

const toBengaliNumber = (num: any) => String(num).replace(/[0-9]/g, c => "০১২৩৪৫৬৭৮৯"[parseInt(c)]);

const bengaliMonths = ["জানু", "ফেব্রু", "মার্চ", "এপ্রি", "মে", "জুন", "জুলা", "আগ", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];

const getNetAmount = (due: any, activeWaivers?: any[], studentId?: string) => {
    if ((due?.status === "paid" || due?.status === "waived") && due?.net_amount != null) {
        return Number(due.net_amount);
    }
    
    const amount = Number(due?.amount) || 0;
    const fine = Number(due?.fine) || 0;
    
    let dynamicWaiver = Number(due?.waiver) || 0;
    
    if (activeWaivers && activeWaivers.length > 0 && studentId) {
        const feeTypeId = due?.fee_type_id || due?.fee_structures?.fee_type_id || due?.fee_structures?.fee_types?.id;
        if (feeTypeId) {
            const matchWaiver = activeWaivers.find(w => String(w.student_id) === String(studentId) && String(w.fee_type_id) === String(feeTypeId));
            if (matchWaiver) {
                if (matchWaiver.waiver_type === 'full') dynamicWaiver = amount;
                else if (matchWaiver.waiver_type === 'percentage') dynamicWaiver = (amount * Number(matchWaiver.waiver_value)) / 100;
                else if (matchWaiver.waiver_type === 'fixed_amount') dynamicWaiver = Number(matchWaiver.waiver_value);
            }
        }
    }
    
    // Attach dynamic waiver back to object for UI rendering
    due.dynamic_waiver = dynamicWaiver;

    return Math.max(amount + fine - dynamicWaiver, 0);
};

const getOutstandingAmount = (due: any, activeWaivers?: any[], studentId?: string) => {
    return Math.max(getNetAmount(due, activeWaivers, studentId) - (Number(due?.paid_amount) || 0), 0);
};

const getFeeName = (due: any) => {
    return (
        due?.fee_types?.name_bn ||
        due?.fee_structures?.fee_types?.name_bn ||
        (typeof due?.title === "string" ? due.title.split(" - ")[0] : "") ||
        "ফি"
    );
};

const getMonthYearLabel = (due: any) => {
    if (due?.fee_month || due?.fee_year) {
        const monthLabel = due?.fee_month ? bengaliMonths[due.fee_month - 1] : "";
        const yearLabel = due?.fee_year ? toBengaliNumber(due.fee_year) : "";
        return `${monthLabel ? `${monthLabel} ` : ""}${yearLabel}`.trim();
    }

    if (due?.due_date) {
        const date = new Date(due.due_date);
        if (!Number.isNaN(date.getTime())) {
            return `${bengaliMonths[date.getMonth()]} ${toBengaliNumber(date.getFullYear())}`;
        }
    }

    if (typeof due?.title === "string") {
        const title = due.title;
        const month = bengaliMonths.find(m => title.includes(m));
        const yearMatch = title.match(/(২০\d{2}|\d{4})/);
        if (month || yearMatch) {
            return `${month ? `${month} ` : ""}${yearMatch ? toBengaliNumber(yearMatch[1]) : ""}`.trim();
        }
    }

    return "-";
};

export default function FeeCollection() {
    const [search, setSearch] = useState("");
    const [students, setStudents] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [classes, setClasses] = useState<string[]>([]);
    const [filterBranch, setFilterBranch] = useState("all");
    const [filterClass, setFilterClass] = useState("all");
    const [filterDepartment, setFilterDepartment] = useState("all");
    const [filterPaymentStatus, setFilterPaymentStatus] = useState("all"); // "all", "due", "paid"
    const [activeWaivers, setActiveWaivers] = useState<any[]>([]);

    const [departments, setDepartments] = useState<string[]>([]);

    const [sortKey, setSortKey] = useState<"default" | "student_id" | "roll" | "name">("default");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    const bnCollator = useMemo(() => new Intl.Collator("bn", { sensitivity: "base", numeric: true }), []);

    const sortIndicator = (key: "student_id" | "roll" | "name") => {
        if (sortKey !== key) return "";
        return sortDir === "asc" ? " ▲" : " ▼";
    };

    const normalizeClassName = (value: unknown) => {
        return String(value ?? "")
            .trim()
            .normalize("NFC")
            .replace(/\u09AF\u09BC/g, "\u09DF");
    };

    const getRollNumber = (s: any) => {
        const raw = s?.roll_number ?? s?.roll_no;
        const bnToAscii: Record<string, string> = {
            "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
            "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
        };
        const ascii = String(raw ?? "")
            .trim()
            .split("")
            .map((c) => bnToAscii[c] ?? c)
            .join("");
        const n = parseInt(ascii, 10);
        return Number.isFinite(n) ? n : 999999;
    };

    const sortStudentList = (
        list: any[],
        key: "default" | "student_id" | "roll" | "name",
        dir: "asc" | "desc"
    ) => {
        const direction = dir === "asc" ? 1 : -1;
        return [...list].sort((a: any, b: any) => {
            if (key === "default") {
                const aC = getClassOrder(a.class_name);
                const bC = getClassOrder(b.class_name);
                if (aC !== bC) return aC - bC;
                const aR = getRollNumber(a);
                const bR = getRollNumber(b);
                if (aR !== bR) return aR - bR;
                return bnCollator.compare(String(a.name_bn ?? ""), String(b.name_bn ?? ""));
            }

            if (key === "roll") {
                return direction * (getRollNumber(a) - getRollNumber(b));
            }
            if (key === "student_id") {
                return direction * bnCollator.compare(String(a.student_id ?? ""), String(b.student_id ?? ""));
            }
            // name
            return direction * bnCollator.compare(String(a.name_bn ?? ""), String(b.name_bn ?? ""));
        });
    };

    const handleSortClick = (key: "student_id" | "roll" | "name") => {
        const nextKey = sortKey === key ? key : key;
        const nextDir = sortKey === key ? (sortDir === "asc" ? "desc" : "asc") : "asc";
        setSortKey(nextKey);
        setSortDir(nextDir);
        setStudents((prev) => sortStudentList(prev, nextKey, nextDir));
    };

    // Student selection state
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [dues, setDues] = useState<any[]>([]);
    const [selectedDues, setSelectedDues] = useState<string[]>([]);
    const [paidHistory, setPaidHistory] = useState<any[]>([]);
    
    // UI states
    const [loading, setLoading] = useState(false);
    const [collecting, setCollecting] = useState(false);
    const [activeTab, setActiveTab] = useState("dues");
    
    // Receipt Modal state
    const [receiptData, setReceiptData] = useState<any>(null);
    const printRef = useRef<HTMLDivElement>(null);
    
    // Partial Payment state
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [receivedAmount, setReceivedAmount] = useState<string>("");

    const [savingImage, setSavingImage] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Receipt_${receiptData?.invoiceNo || 'doc'}`,
        suppressErrors: true,
        onAfterPrint: () => {
            console.log("Printed");
        }
    });

    const handleSaveImage = async () => {
        const studentCopyNode = document.getElementById("student-copy-area");
        if (!studentCopyNode) {
            alert("রসিদ খুজে পাওয়া যায়নি!");
            return;
        }
        
        try {
            setSavingImage(true);
            const dataUrl = await toJpeg(studentCopyNode, { 
                quality: 1.0, 
                pixelRatio: 2,
                backgroundColor: '#ffffff'
            });
            const link = document.createElement("a");
            link.download = `Receipt_${receiptData?.invoiceNo || 'doc'}.jpg`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error("Error saving image:", error);
            alert("ছবি সেভ করতে সমস্যা হয়েছে।");
        } finally {
            setSavingImage(false);
        }
    };

    const getBranchInfo = (branchId: string | number) => {
        return branches.find(b => String(b.id) === String(branchId));
    };

    const getBranchName = (branchId: string | number) => {
        return getBranchInfo(branchId)?.name || "-";
    };

    const withBranchInfo = (student: any) => {
        const branch = getBranchInfo(student.branch_id);
        return {
            ...student,
            branch_name: branch?.name || "-",
            branch_phone: branch?.phone || "",
            branch_address: branch?.address || ""
        };
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [search, filterBranch, filterClass, filterDepartment, filterPaymentStatus]);

    async function fetchInitialData() {
        const { data: b } = await supabase.from("branches").select("id, name, phone, address");
        if (b) setBranches(b);
        
        const { data: c } = await supabase.from("students").select("class_name, department").eq("status", "active");
        if (c) {
            const map = new Map<string, string>();
            const deptSet = new Set<string>();
            for (const row of c as any[]) {
                const trimmedClass = String(row?.class_name ?? "").trim();
                if (trimmedClass) {
                    const normalizedClass = normalizeClassName(trimmedClass);
                    if (normalizedClass && !map.has(normalizedClass)) {
                        map.set(normalizedClass, trimmedClass);
                    }
                }
                
                if (row.department) {
                    const cleanD = String(row.department).replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
                    if (cleanD) deptSet.add(cleanD);
                }
            }
            const uniqueClasses = sortClassNames(Array.from(map.values()));
            setClasses(uniqueClasses);
            setDepartments(Array.from(deptSet).sort());
        }
    }

    async function fetchStudents() {
        setLoading(true);
        let query = supabase.from("students")
            .select(`
                id, name_bn, student_id, roll_no, roll_number, class_name, department, branch_id, academic_year, photo_url,
                student_dues!student_id(amount, waiver, fine, paid_amount, status, net_amount, fee_type_id)
            `)
            .eq("status", "active")
            .order("created_at", { ascending: false });

        const cleanSearch = search.trim();
        if (cleanSearch) query = query.or(`name_bn.ilike.%${cleanSearch}%,student_id.ilike.%${cleanSearch}%`);
        if (filterBranch !== "all") query = query.eq("branch_id", parseInt(filterBranch));
        if (filterClass !== "all") query = query.eq("class_name", filterClass);
        if (filterDepartment !== "all") query = query.eq("department", filterDepartment);

        const { data: wData } = await supabase.from('student_waivers').select('*').eq('is_active', true);
        const waivers = wData || [];
        setActiveWaivers(waivers);

        const { data } = await query;
        if (data) {
            let processed = data.map((s: any) => {
                const unpaidDues = (s.student_dues || [])
                    .filter((d: any) => d.status !== "paid" && d.status !== "waived")
                    .filter((d: any) => getOutstandingAmount(d, waivers, s.student_id) > 0);
                const totalDue = unpaidDues.reduce((sum: number, d: any) => sum + getOutstandingAmount(d, waivers, s.student_id), 0);
                const paidCount = (s.student_dues || []).filter((d: any) => d.status === "paid").length;
                return { ...s, totalDue, dueCount: unpaidDues.length, paidCount };
            });

            if (filterPaymentStatus === "due") {
                processed = processed.filter((s: any) => s.totalDue > 0);
            } else if (filterPaymentStatus === "paid") {
                processed = processed.filter((s: any) => s.totalDue === 0 && (s.student_dues && s.student_dues.length > 0));
            } else if (filterPaymentStatus === "not_assigned") {
                processed = processed.filter((s: any) => !s.student_dues || s.student_dues.length === 0);
            }

            setStudents(sortStudentList(processed, sortKey, sortDir));
        }
        setLoading(false);
    }

    const handleSelectStudent = async (student: any) => {
        const studentWithBranch = withBranchInfo(student);
        setSelectedStudent(studentWithBranch);
        setActiveTab("dues");
        setLoading(true);
        
        const [dueRes, paidRes] = await Promise.all([
            supabase
                .from("student_dues")
                .select("id, title, amount, waiver, fine, paid_amount, status, due_date, fee_month, fee_year, net_amount, fee_type_id, fee_structure_id, created_at, fee_types(name_bn), fee_structures(branch_id, class_name, frequency, fee_types(name_bn))")
                .eq("student_id", student.id)
                .not("status", "in", '("paid","waived")')
                .order("created_at"),
            supabase
                .from("student_dues")
                .select("id, title, amount, waiver, fine, paid_amount, status, due_date, fee_month, fee_year, net_amount, fee_type_id, fee_structure_id, fee_types(name_bn), fee_structures(branch_id, class_name, frequency, fee_types(name_bn)), payment_date, receipt_no, updated_at")
                .eq("student_id", student.id)
                .eq("status", "paid")
                .order("updated_at", { ascending: false })
        ]);
        
        if (dueRes.error) {
            console.error("Due fetch error:", dueRes.error);
            setDues([]);
            setSelectedStudent({ ...studentWithBranch, totalDue: 0, dueCount: 0 });
        } else {
            const unpaidDues = (dueRes.data || []).filter((d: any) => getOutstandingAmount(d, activeWaivers, student.student_id) > 0);
            setDues(unpaidDues);
            setSelectedStudent({
                ...studentWithBranch,
                totalDue: unpaidDues.reduce((sum: number, d: any) => sum + getOutstandingAmount(d, activeWaivers, student.student_id), 0),
                dueCount: unpaidDues.length
            });
        }

        if (paidRes.error) {
            console.error("Paid history fetch error:", paidRes.error);
            setPaidHistory([]);
        } else {
            setPaidHistory(paidRes.data || []);
        }
        
        setSelectedDues([]);
        setLoading(false);
    };

    const handleCollectClick = () => {
        if (!selectedStudent || selectedDues.length === 0) return;
        
        const feesToPay = dues.filter(d => selectedDues.includes(d.id) && getOutstandingAmount(d, activeWaivers, selectedStudent.student_id) > 0);
        const total = feesToPay.reduce((acc, curr) => acc + getOutstandingAmount(curr, activeWaivers, selectedStudent.student_id), 0);
        
        if (feesToPay.length === 0 || total <= 0) {
            alert("আদায়ের জন্য কোনো বকেয়া টাকা পাওয়া যায়নি।");
            return;
        }

        setReceivedAmount(total.toString());
        setPaymentModalOpen(true);
    };

    const processPayment = async () => {
        if (!selectedStudent || selectedDues.length === 0) return;
        
        const amountToPay = parseFloat(receivedAmount);
        if (isNaN(amountToPay) || amountToPay <= 0) {
            alert("সঠিক টাকার পরিমাণ দিন।");
            return;
        }

        const feesToPay = dues.filter(d => selectedDues.includes(d.id) && getOutstandingAmount(d, activeWaivers, selectedStudent.student_id) > 0);
        const totalOutstanding = feesToPay.reduce((acc, curr) => acc + getOutstandingAmount(curr, activeWaivers, selectedStudent.student_id), 0);
        
        if (amountToPay > totalOutstanding) {
            alert(`সর্বোচ্চ ৳${totalOutstanding} জমা নেওয়া যাবে। বকেয়ার চেয়ে বেশি টাকা জমা নেওয়া সম্ভব নয়।`);
            return;
        }

        setCollecting(true);
        
        try {
            const receiptNo = `INV-${Date.now().toString().slice(-6)}`;
            const { data: { user } } = await supabase.auth.getUser();
            
            let remainingAmount = amountToPay;
            const receiptFees = [];
            
            // 1. Update Dues Status Sequentially
            for (const fee of feesToPay) {
                if (remainingAmount <= 0) break;

                const outstanding = getOutstandingAmount(fee, activeWaivers, selectedStudent.student_id);
                if (outstanding <= 0) continue;

                const payForThisDue = Math.min(outstanding, remainingAmount);
                const currentPaid = Number(fee.paid_amount) || 0;
                const newPaidAmount = currentPaid + payForThisDue;

                const finalNetAmount = getNetAmount(fee, activeWaivers, selectedStudent.student_id);
                const finalWaiver = fee.dynamic_waiver ?? fee.waiver;
                const newStatus = newPaidAmount >= finalNetAmount ? "paid" : "partial";

                const { error } = await supabase.from("student_dues")
                    .update({
                        status: newStatus,
                        paid_amount: newPaidAmount,
                        net_amount: finalNetAmount,
                        waiver: finalWaiver,
                        payment_date: new Date().toISOString(),
                        receipt_no: receiptNo
                    })
                    .eq("id", fee.id);
                
                if (error) throw error;

                receiptFees.push({ 
                    description: `${getFeeName(fee)} - ${getMonthYearLabel(fee)}${payForThisDue < outstanding ? ' (আংশিক)' : ''}`, 
                    amount: payForThisDue 
                });

                remainingAmount -= payForThisDue;
            }

            const actualTotalPaid = amountToPay - remainingAmount;

            // 2. Create Transaction
            const { error: txError } = await supabase.from("transactions").insert({
                amount: actualTotalPaid,
                type: "income",
                fund_type: "general",
                description: `বেতন আদায় - ${selectedStudent.name_bn} (${selectedStudent.student_id}) - রসিদ ${receiptNo} - ${receiptFees.length} টি ফি`,
                transaction_date: new Date().toISOString().split("T")[0],
                created_by: user?.id,
                student_id: selectedStudent.student_id,
                branch_id: selectedStudent.branch_id,
                payment_method: "cash"
            });
            if (txError) throw txError;

            // Refresh data
            await handleSelectStudent(selectedStudent);
            await fetchStudents(); // Refresh master list to update due count

            // Show Receipt
            setReceiptData({
                student: selectedStudent,
                fees: receiptFees,
                total: actualTotalPaid,
                invoiceNo: receiptNo,
                date: new Date()
            });

            setPaymentModalOpen(false);
        } catch (error) {
            console.error(error);
            alert("পেমেন্ট সম্পন্ন করতে সমস্যা হয়েছে।");
        }
        setCollecting(false);
    };

    const handleShowReceipt = (item: any) => {
        const amt = item.paid_amount || getNetAmount(item, activeWaivers, selectedStudent?.student_id);
        setReceiptData({
            student: selectedStudent,
            fees: [{ description: `${getFeeName(item)} - ${getMonthYearLabel(item)}`, amount: amt }],
            total: amt,
            invoiceNo: item.receipt_no || `REC-${item.id.slice(0,6).toUpperCase()}`,
            date: new Date(item.payment_date || item.updated_at)
        });
    };

    const selectedFeesTotal = dues
        .filter(d => selectedDues.includes(d.id))
        .reduce((sum, d) => sum + getOutstandingAmount(d, activeWaivers, selectedStudent?.student_id), 0);

    const totalDueAmount = students.reduce((sum, student) => sum + (Number(student.totalDue) || 0), 0);
    const dueStudentCount = students.filter(student => (Number(student.totalDue) || 0) > 0).length;
    const paidStudentCount = students.filter(student => (Number(student.totalDue) || 0) === 0 && student.student_dues && student.student_dues.length > 0).length;
    const totalDueItems = students.reduce((sum, student) => sum + (Number(student.dueCount) || 0), 0);

    return (
        <div className="space-y-6">
            {!selectedStudent ? (
                // ---------------- STUDENT SELECTION LIST ----------------
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-green-600" /> বেতন আদায়
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500">শিক্ষার্থীর বকেয়া ফি আদায় করুন</p>
                        </div>
                    </div>

                    <Card className="rounded-2xl shadow-sm">
                        <CardContent className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600">খুঁজুন</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                        <Input
                                            className="pl-9 h-10"
                                            placeholder="আইডি বা নাম..."
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600">শাখা</label>
                                    <Select value={filterBranch} onValueChange={setFilterBranch}>
                                        <SelectTrigger className="h-10"><SelectValue placeholder="শাখা" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">সকল শাখা</SelectItem>
                                            {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600">বিভাগ</label>
                                    <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                                        <SelectTrigger className="h-10"><SelectValue placeholder="বিভাগ" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">সকল বিভাগ</SelectItem>
                                            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600">শ্রেণি</label>
                                    <Select value={filterClass} onValueChange={setFilterClass}>
                                        <SelectTrigger className="h-10"><SelectValue placeholder="শ্রেণি" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">সকল শ্রেণি</SelectItem>
                                            {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600">পেমেন্ট স্ট্যাটাস</label>
                                    <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                                        <SelectTrigger className="h-10"><SelectValue placeholder="স্ট্যাটাস" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">সকল শিক্ষার্থী</SelectItem>
                                            <SelectItem value="due">বকেয়া আছে</SelectItem>
                                            <SelectItem value="paid">পরিশোধিত (বকেয়া নেই)</SelectItem>
                                            <SelectItem value="not_assigned">নির্ধারণ করা হয়নি</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                        <Card className="rounded-xl border-l-4 border-l-slate-500 py-0">
                            <CardContent className="p-3">
                                <p className="text-[10px] sm:text-xs font-bold text-gray-500">মোট শিক্ষার্থী</p>
                                <h3 className="text-lg sm:text-2xl font-bold text-gray-800">{toBengaliNumber(students.length)} জন</h3>
                                <p className="text-[10px] text-gray-400">পরিশোধিত: {toBengaliNumber(paidStudentCount)} জন</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-xl border-l-4 border-l-red-500 py-0">
                            <CardContent className="p-3">
                                <p className="text-[10px] sm:text-xs font-bold text-red-600">বকেয়া শিক্ষার্থী</p>
                                <h3 className="text-lg sm:text-2xl font-bold text-red-700">{toBengaliNumber(dueStudentCount)} জন</h3>
                            </CardContent>
                        </Card>
                        <Card className="rounded-xl border-l-4 border-l-amber-500 py-0">
                            <CardContent className="p-3">
                                <p className="text-[10px] sm:text-xs font-bold text-amber-600">বকেয়া ফি আইটেম</p>
                                <h3 className="text-lg sm:text-2xl font-bold text-amber-700">{toBengaliNumber(totalDueItems)} টি</h3>
                            </CardContent>
                        </Card>
                        <Card className="rounded-xl border-l-4 border-l-green-600 py-0">
                            <CardContent className="p-3">
                                <p className="text-[10px] sm:text-xs font-bold text-green-700">মোট আদায়যোগ্য</p>
                                <h3 className="text-lg sm:text-2xl font-bold text-green-700">৳ {toBengaliNumber(totalDueAmount)}</h3>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="rounded-2xl shadow-sm">
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-green-600" /></div>
                            ) : students.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    <UserRound className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="font-bold">শিক্ষার্থী পাওয়া যায়নি</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead
                                                className="cursor-pointer select-none"
                                                onClick={() => handleSortClick("student_id")}
                                                title="আইডি দিয়ে শর্ট"
                                            >
                                                আইডি{sortIndicator("student_id")}
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer select-none"
                                                onClick={() => handleSortClick("roll")}
                                                title="রোল দিয়ে শর্ট"
                                            >
                                                রোল{sortIndicator("roll")}
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer select-none"
                                                onClick={() => handleSortClick("name")}
                                                title="নাম দিয়ে শর্ট"
                                            >
                                                নাম{sortIndicator("name")}
                                            </TableHead>
                                            <TableHead>শাখা</TableHead>
                                            <TableHead>বিভাগ</TableHead>
                                            <TableHead>শ্রেণি</TableHead>
                                            <TableHead className="text-center">বেতন</TableHead>
                                            <TableHead className="text-right">টাকার পরিমাণ</TableHead>
                                            <TableHead>স্ট্যাটাস</TableHead>
                                            <TableHead className="text-right">অ্যাকশন</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.map(s => (
                                            <TableRow key={s.id} className="hover:bg-green-50/50 cursor-pointer" onClick={() => handleSelectStudent(s)}>
                                                <TableCell className="font-mono text-sm">{s.student_id}</TableCell>
                                                <TableCell className="text-sm text-gray-600">{toBengaliNumber(s.roll_number ?? s.roll_no ?? "") || "-"}</TableCell>
                                                <TableCell className="font-bold text-gray-800">{s.name_bn}</TableCell>
                                                <TableCell className="text-sm min-w-35">{getBranchName(s.branch_id)}</TableCell>
                                                <TableCell className="text-sm text-gray-600">{s.department || "-"}</TableCell>
                                                <TableCell className="text-sm">{s.class_name}</TableCell>
                                                <TableCell className="text-center">
                                                    {s.totalDue > 0 ? (
                                                        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">{toBengaliNumber(s.dueCount || 0)} টি</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">নেই</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {s.totalDue > 0 ? (
                                                        <span className="font-bold text-red-600">৳ {toBengaliNumber(s.totalDue)}</span>
                                                    ) : (
                                                        <span className="text-gray-500">৳ ০</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {!s.student_dues || s.student_dues.length === 0 ? (
                                                        <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">নির্ধারণ করা হয়নি</span>
                                                    ) : s.totalDue > 0 ? (
                                                        <span className="text-xs font-bold text-red-600">বকেয়া</span>
                                                    ) : (
                                                        <span className="text-xs font-bold text-green-600">পরিশোধিত</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant={s.totalDue > 0 ? "default" : "outline"}
                                                        className={s.totalDue > 0 ? "bg-green-600 hover:bg-green-700" : "text-gray-700"}
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            handleSelectStudent(s);
                                                        }}
                                                    >
                                                        {s.totalDue > 0 ? <CreditCard className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        {s.totalDue > 0 ? "আদায়" : "বিস্তারিত"}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                // ---------------- STUDENT DUES / HISTORY ----------------
                <div className="space-y-4">
                    <Button variant="outline" size="sm" onClick={() => setSelectedStudent(null)} className="mb-2">
                        <X className="w-4 h-4 mr-2" /> ফিরে যান
                    </Button>

                    {/* Student Info Card */}
                    <Card className="rounded-2xl shadow-sm border-l-4 border-l-green-600">
                        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                                {selectedStudent.photo_url ? (
                                    <img src={selectedStudent.photo_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <GraduationCap className="w-8 h-8 text-gray-400" />
                                )}
                            </div>
                            <div className="text-center sm:text-left flex-1 min-w-0">
                                <h2 className="text-xl font-bold text-gray-800">{selectedStudent.name_bn}</h2>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                                    <p><span className="font-semibold text-gray-500">আইডি:</span> <span className="font-mono">{selectedStudent.student_id}</span></p>
                                    <p><span className="font-semibold text-gray-500">রোল:</span> {toBengaliNumber(selectedStudent.roll_number ?? selectedStudent.roll_no ?? "") || '-'}</p>
                                    <p><span className="font-semibold text-gray-500">শাখা:</span> {selectedStudent.branch_name}</p>
                                    <p><span className="font-semibold text-gray-500">বিভাগ:</span> {selectedStudent.department || "-"}</p>
                                    <p><span className="font-semibold text-gray-500">শ্রেণি:</span> {selectedStudent.class_name}</p>
                                </div>
                            </div>
                            <div className="text-center sm:text-right shrink-0">
                                <p className="text-xs font-bold text-gray-500 mb-1">সর্বমোট বকেয়া</p>
                                <h3 className="text-2xl font-bold text-red-600">৳ {toBengaliNumber(selectedStudent.totalDue)}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <div className="flex gap-2">
                        <Button 
                            variant={activeTab === 'dues' ? 'default' : 'outline'} 
                            onClick={() => setActiveTab('dues')}
                            className={activeTab === 'dues' ? 'bg-green-700 hover:bg-green-800' : ''}
                        >
                            বকেয়া ফি ({toBengaliNumber(dues.length)})
                        </Button>
                        <Button 
                            variant={activeTab === 'history' ? 'default' : 'outline'} 
                            onClick={() => setActiveTab('history')}
                            className={activeTab === 'history' ? 'bg-gray-800 hover:bg-gray-900' : ''}
                        >
                            পেমেন্ট হিস্টোরি ({toBengaliNumber(paidHistory.length)})
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-green-600" /></div>
                    ) : activeTab === 'dues' ? (
                        <Card className="rounded-2xl shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                                <CardTitle className="text-lg">বকেয়া তালিকা</CardTitle>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">সিলেক্টেড মোট</p>
                                    <p className="text-lg font-bold text-green-700">৳ {toBengaliNumber(selectedFeesTotal)}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {dues.length === 0 ? (
                                    <div className="text-center py-16 text-gray-400">
                                        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
                                        <p className="font-bold text-green-600">কোনো বকেয়া নেই</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-gray-50">
                                                <TableRow>
                                                    <TableHead className="w-12">
                                                        <Checkbox 
                                                            checked={selectedDues.length === dues.length && dues.length > 0}
                                                            onCheckedChange={(c) => setSelectedDues(c ? dues.map(d => d.id) : [])}
                                                        />
                                                    </TableHead>
                                                    <TableHead>বিবরণ</TableHead>
                                                    <TableHead>মাস/বছর</TableHead>
                                                    <TableHead className="text-right">মূল টাকা</TableHead>
                                                    <TableHead className="text-right">ছাড়/জরিমানা</TableHead>
                                                    <TableHead className="text-right">পরিশোধিত</TableHead>
                                                    <TableHead className="text-right">আদায়যোগ্য</TableHead>
                                                    <TableHead>স্ট্যাটাস</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {dues.map(d => (
                                                    <TableRow key={d.id} className={selectedDues.includes(d.id) ? "bg-green-50/50" : ""}>
                                                        <TableCell>
                                                            <Checkbox 
                                                                checked={selectedDues.includes(d.id)}
                                                                onCheckedChange={() => setSelectedDues(p => p.includes(d.id) ? p.filter(x => x !== d.id) : [...p, d.id])}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-medium min-w-40">
                                                            {getFeeName(d)}
                                                            {d.title && <span className="block text-xs text-gray-500">{d.title}</span>}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-gray-600">{getMonthYearLabel(d)}</TableCell>
                                                        <TableCell className="text-right font-medium">৳ {toBengaliNumber(d.amount || 0)}</TableCell>
                                                        <TableCell className="text-right text-sm">
                                                            <span className="text-purple-700">-৳ {toBengaliNumber(d.dynamic_waiver ?? d.waiver ?? 0)}</span>
                                                            {(Number(d.fine) || 0) > 0 && <span className="block text-red-600">+৳ {toBengaliNumber(d.fine)}</span>}
                                                        </TableCell>
                                                        <TableCell className="text-right text-gray-600">৳ {toBengaliNumber(d.paid_amount || 0)}</TableCell>
                                                        <TableCell className="text-right font-bold text-red-600">
                                                            ৳ {toBengaliNumber(getOutstandingAmount(d, activeWaivers, selectedStudent.student_id))}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-xs">বকেয়া</Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        </div>
                                        <div className="p-4 border-t flex justify-end">
                                            <Button 
                                                onClick={handleCollectClick} 
                                                disabled={selectedDues.length === 0 || collecting}
                                                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                            >
                                                {collecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DollarSign className="w-4 h-4 mr-2" />}
                                                পেমেন্ট গ্রহণ করুন (৳ {toBengaliNumber(selectedFeesTotal)})
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="rounded-2xl shadow-sm">
                            <CardContent className="p-0">
                                {paidHistory.length === 0 ? (
                                    <div className="text-center py-16 text-gray-400">
                                        <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="font-bold">কোনো পেমেন্ট হিস্টোরি নেই</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-gray-50">
                                            <TableRow>
                                                <TableHead>তারিখ</TableHead>
                                                <TableHead>বিবরণ</TableHead>
                                                <TableHead>মাস/বছর</TableHead>
                                                <TableHead>রসিদ নং</TableHead>
                                                <TableHead className="text-right">মূল টাকা</TableHead>
                                                <TableHead className="text-right">ছাড়</TableHead>
                                                <TableHead className="text-right">পরিমাণ</TableHead>
                                                <TableHead className="text-center">রসিদ</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paidHistory.map(h => (
                                                <TableRow key={h.id}>
                                                    <TableCell className="text-sm">{h.payment_date ? format(new Date(h.payment_date), 'dd/MM/yyyy') : '-'}</TableCell>
                                                    <TableCell className="font-medium">
                                                        {getFeeName(h)}
                                                        {h.title && <span className="block text-xs text-gray-500">{h.title}</span>}
                                                    </TableCell>
                                                    <TableCell>{getMonthYearLabel(h)}</TableCell>
                                                    <TableCell className="font-mono text-xs">{h.receipt_no || '-'}</TableCell>
                                                    <TableCell className="text-right">৳ {toBengaliNumber(h.amount || 0)}</TableCell>
                                                    <TableCell className="text-right text-purple-700">৳ {toBengaliNumber(h.waiver || 0)}</TableCell>
                                                    <TableCell className="text-right font-bold text-green-700">
                                                        ৳ {toBengaliNumber(h.paid_amount || getNetAmount(h, activeWaivers, selectedStudent?.student_id))}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Button size="icon" variant="ghost" className="text-blue-600 h-8 w-8" onClick={() => handleShowReceipt(h)}>
                                                            <Printer className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Partial Payment Modal */}
            <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <DollarSign className="w-6 h-6 text-green-600" />
                            পেমেন্ট গ্রহণ করুন
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                            <div className="flex justify-between items-center text-sm font-bold text-amber-800">
                                <span>মোট বকেয়া (সিলেক্টেড):</span>
                                <span className="text-lg">৳ {toBengaliNumber(selectedFeesTotal)}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">জমা দিচ্ছেন (৳)</label>
                            <Input 
                                type="number"
                                value={receivedAmount}
                                onChange={(e) => setReceivedAmount(e.target.value)}
                                className="text-xl font-bold font-mono h-12"
                                placeholder="টাকার পরিমাণ লিখুন"
                            />
                            <p className="text-xs text-gray-500 font-medium">আংশিক পেমেন্ট করতে চাইলে পরিমাণ পরিবর্তন করুন</p>
                        </div>

                        <Button 
                            onClick={processPayment} 
                            disabled={collecting || !receivedAmount}
                            className="w-full h-12 text-base font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl"
                        >
                            {collecting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                            নিশ্চিত করুন
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Receipt Modal */}
            <Dialog open={!!receiptData} onOpenChange={(open) => !open && setReceiptData(null)}>
                <DialogContent className="max-w-[900px] w-[95vw] max-h-[90vh] flex flex-col overflow-hidden p-0 bg-gray-100">
                    <div className="bg-white border-b p-4 flex justify-between items-center print:hidden shrink-0 z-10 shadow-sm">
                        <DialogTitle className="font-bold text-lg">বেতন স্লিপ প্রিভিউ</DialogTitle>
                        <div className="flex gap-2">
                            <Button onClick={handleSaveImage} disabled={savingImage} variant="outline" className="text-emerald-700 border-emerald-200">
                                {savingImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Download className="w-4 h-4 mr-2"/>}
                                সেভ করুন (JPG)
                            </Button>
                            <Button onClick={() => handlePrint()} className="bg-blue-600 hover:bg-blue-700">
                                <Printer className="w-4 h-4 mr-2"/> প্রিন্ট করুন
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setReceiptData(null)} className="text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-full ml-1">
                                <X className="w-5 h-5"/>
                            </Button>
                        </div>
                    </div>
                    <div className="p-4 sm:p-8 print:p-0 flex justify-center overflow-auto flex-1 bg-gray-100/50 custom-scrollbar">
                            {receiptData && (
                                <PaymentSlip 
                                    ref={printRef}
                                student={receiptData.student}
                                fees={receiptData.fees}
                                total={receiptData.total}
                                invoiceNo={receiptData.invoiceNo}
                                date={receiptData.date}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
