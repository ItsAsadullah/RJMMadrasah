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
import { Loader2, Search, Printer, DollarSign, UserRound, GraduationCap, X, Receipt, Eye, CreditCard, CheckCircle2, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import { toJpeg } from "html-to-image";
import PaymentSlip from "@/components/dashboard/accounts/PaymentSlip";
import StudentPaymentReport from "@/components/dashboard/accounts/StudentPaymentReport";
import { CopyableId } from "@/components/ui/copyable-id";
import { getClassOrder, sortClassNames } from "@/lib/classOrder";

const toBengaliNumber = (num: any) => String(num).replace(/[0-9]/g, c => "০১২৩৪৫৬৭৮৯"[parseInt(c)]);

const bengaliMonths = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

const getNetAmount = (due: any, activeWaivers?: any[], studentId?: string) => {
    if ((due?.status === "paid" || due?.status === "waived") && due?.net_amount != null) {
        return Number(due.net_amount);
    }
    
    const amount = Number(due?.amount) || 0;
    const fine = Number(due?.fine) || 0;
    
    let dynamicWaiver = Number(due?.waiver) || 0;
    let waiverDetails = "";
    
    if (activeWaivers && activeWaivers.length > 0 && studentId) {
        const feeTypeId = due?.fee_type_id || due?.fee_structures?.fee_type_id || due?.fee_structures?.fee_types?.id;
        if (feeTypeId) {
            const matchWaiver = activeWaivers.find(w => String(w.student_id) === String(studentId) && String(w.fee_type_id) === String(feeTypeId));
            if (matchWaiver) {
                if (matchWaiver.waiver_type === 'full') {
                    dynamicWaiver = amount;
                    waiverDetails = `পূর্ণ মওকুফ (৳${toBengaliNumber(amount)})`;
                }
                else if (matchWaiver.waiver_type === 'percentage') {
                    dynamicWaiver = (amount * Number(matchWaiver.waiver_value)) / 100;
                    waiverDetails = `${toBengaliNumber(matchWaiver.waiver_value)}%`;
                }
                else if (matchWaiver.waiver_type === 'fixed_amount') {
                    dynamicWaiver = Number(matchWaiver.waiver_value);
                    waiverDetails = `৳${toBengaliNumber(matchWaiver.waiver_value)}`;
                }
            }
        }
    }
    
    // Attach dynamic waiver back to object for UI rendering
    due.dynamic_waiver = dynamicWaiver;
    if (waiverDetails) due.waiver_details = waiverDetails;

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
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);
    const reportRef = useRef<HTMLDivElement>(null);
    
    // Partial Payment state
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [receivedAmount, setReceivedAmount] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState("cash");

    const [savingImage, setSavingImage] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Receipt_${receiptData?.invoiceNo || 'doc'}`,
        suppressErrors: true,
        onAfterPrint: () => {
            console.log("Printed");
        }
    });

    const handlePrintReport = useReactToPrint({
        contentRef: reportRef,
        documentTitle: `Payment_Report_${selectedStudent?.student_id || 'Print'}`,
        suppressErrors: true
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
                residential_status, father_name_bn, father_mobile, guardian_name, guardian_mobile, guardian_type,
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
                .from("transactions")
                .select("*")
                .eq("student_id", student.student_id)
                .eq("type", "income")
                .order("created_at", { ascending: false })
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
            const rpcFees: any[] = [];
            
            // 1. Prepare Dues Status Sequentially
            for (const fee of feesToPay) {
                if (remainingAmount <= 0) break;

                const totalFeeAmount = getNetAmount(fee, activeWaivers, selectedStudent.student_id);
                const previousPaid = Number(fee.paid_amount) || 0;
                const outstanding = totalFeeAmount - previousPaid;
                
                if (outstanding <= 0) continue;

                const payForThisDue = Math.min(outstanding, remainingAmount);
                const remainingDue = outstanding - payForThisDue;
                const newPaidAmount = previousPaid + payForThisDue;

                const finalNetAmount = totalFeeAmount;
                const finalWaiver = fee.dynamic_waiver ?? fee.waiver;
                const newStatus = newPaidAmount >= finalNetAmount ? "paid" : "partial";

                let paymentType = "full";
                if (previousPaid === 0 && remainingDue > 0) paymentType = "partial_first";
                else if (previousPaid > 0 && remainingDue > 0) paymentType = "partial_ongoing";
                else if (previousPaid > 0 && remainingDue === 0) paymentType = "partial_last";

                const baseFeeName = `${getFeeName(fee)} - ${getMonthYearLabel(fee)}`;
                let displayTitle = baseFeeName;
                if (fee.waiver_details) {
                    displayTitle = `${baseFeeName} (মূল: ৳${toBengaliNumber(Number(fee.amount) || 0)}, মওকুফ: ${fee.waiver_details})`;
                }

                if (paymentType === "partial_first" || paymentType === "partial_ongoing" || paymentType === "partial_last") {
                    displayTitle = `${displayTitle}, ৳${toBengaliNumber(totalFeeAmount)}`;
                }

                let extendedDesc = "";
                if (paymentType === "partial_first" || paymentType === "partial_ongoing") {
                    extendedDesc = `পেমেন্ট = ৳${toBengaliNumber(payForThisDue)} • বকেয়া = ৳${toBengaliNumber(remainingDue)}`;
                } else if (paymentType === "partial_last") {
                    extendedDesc = `পূর্বের জমা = ৳${toBengaliNumber(previousPaid)} • বর্তমান জমা = ৳${toBengaliNumber(payForThisDue)} • মোট পরিশোধিত = ৳${toBengaliNumber(totalFeeAmount)}`;
                }

                const feeDescription = extendedDesc ? `${displayTitle} ||| ${extendedDesc}` : displayTitle;

                receiptFees.push({ 
                    description: feeDescription, 
                    amount: payForThisDue 
                });

                rpcFees.push({
                    due_id: fee.id,
                    pay_amount: payForThisDue,
                    new_paid_amount: newPaidAmount,
                    new_status: newStatus,
                    net_amount: finalNetAmount,
                    waiver: finalWaiver,
                    description: feeDescription
                });

                remainingAmount -= payForThisDue;
            }

            const actualTotalPaid = amountToPay - remainingAmount;

            // 2. Call RPC to process all transactions
            if (rpcFees.length > 0) {
                const payload = {
                    student_id: selectedStudent.student_id,
                    branch_id: selectedStudent.branch_id,
                    receipt_no: receiptNo,
                    payment_method: paymentMethod,
                    user_id: user?.id,
                    fees: rpcFees
                };
                
                const { error: txError } = await supabase.rpc('process_fee_payments_bulk', { payload });
                if (txError) throw txError;
            }

            // Refresh data
            await handleSelectStudent(selectedStudent);
            await fetchStudents(); // Refresh master list to update due count

            // Show Receipt
            setReceiptData({
                student: selectedStudent,
                fees: receiptFees,
                total: actualTotalPaid,
                invoiceNo: receiptNo,
                paymentMethod: paymentMethod,
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
        let receiptNo = `REC-${String(item.id).padStart(6, '0')}`;
        let description = item.description || "ফি পেমেন্ট";
        
        const receiptMatch = description.match(/রসিদ:\s*(INV-\d+)/);
        if (receiptMatch) {
            receiptNo = receiptMatch[1];
            description = description.split(" | রসিদ:")[0];
        }

        setReceiptData({
            student: selectedStudent,
            fees: [{ description, amount: item.amount }],
            total: item.amount,
            invoiceNo: receiptNo,
            paymentMethod: item.payment_method || "cash",
            date: new Date(item.transaction_date || item.created_at)
        });
    };

    const selectedFeesTotal = dues
        .filter(d => selectedDues.includes(d.id))
        .reduce((sum, d) => sum + getOutstandingAmount(d, activeWaivers, selectedStudent?.student_id), 0);

    const groupedPaidHistory = Object.values(paidHistory.reduce((acc: any, h: any) => {
        const receiptMatch = (h.description || "").match(/রসিদ:\s*(INV-\d+)/);
        const receiptNo = receiptMatch ? receiptMatch[1] : `REC-${String(h.id).padStart(6, '0')}`;
        
        if (!acc[receiptNo]) {
            acc[receiptNo] = {
                id: receiptNo,
                receiptNo,
                date: h.transaction_date || h.created_at,
                payment_method: h.payment_method,
                items: [],
                total: 0
            };
        }
        
        let desc = (h.description || "ফি পেমেন্ট").split(" | রসিদ:")[0];
        acc[receiptNo].items.push({
            id: h.id,
            description: desc,
            amount: h.amount
        });
        acc[receiptNo].total += Number(h.amount || 0);
        
        return acc;
    }, {})).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 items-end">
                                <div className="col-span-2 sm:col-span-1 space-y-1.5">
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
                            <CardContent className="p-2 sm:p-3 flex flex-col justify-center">
                                <p className="text-[10px] sm:text-xs font-bold text-gray-500">মোট শিক্ষার্থী</p>
                                <h3 className="text-base sm:text-2xl font-bold text-gray-800">{toBengaliNumber(students.length)} জন</h3>
                                <p className="text-[9px] sm:text-[10px] text-gray-400">পরিশোধিত: {toBengaliNumber(paidStudentCount)} জন</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-xl border-l-4 border-l-red-500 py-0">
                            <CardContent className="p-2 sm:p-3 flex flex-col justify-center">
                                <p className="text-[10px] sm:text-xs font-bold text-red-600">বকেয়া শিক্ষার্থী</p>
                                <h3 className="text-base sm:text-2xl font-bold text-red-700">{toBengaliNumber(dueStudentCount)} জন</h3>
                            </CardContent>
                        </Card>
                        <Card className="rounded-xl border-l-4 border-l-amber-500 py-0">
                            <CardContent className="p-2 sm:p-3 flex flex-col justify-center">
                                <p className="text-[10px] sm:text-xs font-bold text-amber-600">বকেয়া ফি আইটেম</p>
                                <h3 className="text-base sm:text-2xl font-bold text-amber-700">{toBengaliNumber(totalDueItems)} টি</h3>
                            </CardContent>
                        </Card>
                        <Card className="rounded-xl border-l-4 border-l-green-600 py-0">
                            <CardContent className="p-2 sm:p-3 flex flex-col justify-center">
                                <p className="text-[10px] sm:text-xs font-bold text-green-700">মোট আদায়যোগ্য</p>
                                <h3 className="text-base sm:text-2xl font-bold text-green-700">৳ {toBengaliNumber(totalDueAmount)}</h3>
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
                                <>
                                <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead
                                                className="cursor-pointer select-none"
                                                onClick={() => handleSortClick("name")}
                                                title="নাম দিয়ে শর্ট"
                                            >
                                                ছাত্র/ছাত্রী{sortIndicator("name")}
                                            </TableHead>
                                            <TableHead>যোগাযোগ ও আবাসিক তথ্য</TableHead>
                                            <TableHead>শ্রেণি ও শাখা</TableHead>
                                            <TableHead className="text-center">বকেয়া স্ট্যাটাস</TableHead>
                                            <TableHead className="text-right">অ্যাকশন</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.map(s => {
                                            const guardianName = s.guardian_type === 'father' ? s.father_name_bn : (s.guardian_name || s.father_name_bn);
                                            const guardianPhone = s.guardian_type === 'father' ? s.father_mobile : (s.guardian_mobile || s.father_mobile);
                                            
                                            return (
                                            <TableRow key={s.id} className="hover:bg-green-50/50 cursor-pointer" onClick={() => handleSelectStudent(s)}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                                                            {s.photo_url ? (
                                                                <img src={s.photo_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <UserRound className="w-5 h-5 text-gray-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-gray-800">{s.name_bn}</span>
                                                                {activeWaivers.some(w => String(w.student_id) === String(s.student_id) && w.waiver_type === 'full') && (
                                                                    <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 px-1 py-0 h-4">মওকুফ</Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                                                                <CopyableId id={s.student_id} className="font-mono" />
                                                                <span>•</span>
                                                                <span>রোল: {toBengaliNumber(s.roll_number ?? s.roll_no ?? "") || "-"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 text-sm text-gray-600">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-semibold text-gray-700">{guardianName || "-"}</span>
                                                            <span className="text-xs">({toBengaliNumber(guardianPhone || "-")})</span>
                                                        </div>
                                                        <div>
                                                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${s.residential_status === 'residential' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                                                {s.residential_status === 'residential' ? 'আবাসিক' : 'অনাবাসিক'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-0.5 text-sm text-gray-600">
                                                        <span className="font-semibold text-gray-700">{s.class_name} <span className="text-xs font-normal text-gray-500">({s.department || "-"})</span></span>
                                                        <span className="text-xs">{getBranchName(s.branch_id)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        {s.totalDue > 0 ? (
                                                            <>
                                                                <span className="font-bold text-red-600 text-sm">৳ {toBengaliNumber(s.totalDue)}</span>
                                                                <Badge variant="outline" className="text-[10px] text-red-600 border-red-200 bg-red-50 px-1.5 py-0 h-4">{toBengaliNumber(s.dueCount || 0)} টি বকেয়া</Badge>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="font-bold text-green-600 text-sm">৳ ০</span>
                                                                {!s.student_dues || s.student_dues.length === 0 ? (
                                                                    <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0 h-4 border-amber-200">নির্ধারণ হয়নি</Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-[10px] text-green-600 border-green-200 bg-green-50 px-1.5 py-0 h-4">পরিশোধিত</Badge>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant={s.totalDue > 0 ? "default" : "outline"}
                                                        className={s.totalDue > 0 ? "bg-green-600 hover:bg-green-700 shadow-sm" : "text-gray-700"}
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            handleSelectStudent(s);
                                                        }}
                                                    >
                                                        {s.totalDue > 0 ? <CreditCard className="w-4 h-4 mr-1.5" /> : <Eye className="w-4 h-4 mr-1.5" />}
                                                        {s.totalDue > 0 ? "আদায়" : "বিস্তারিত"}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )})}
                                    </TableBody>
                                </Table>
                                </div>
                                
                                {/* Mobile View - Modern Compact Cards */}
                                <div className="md:hidden flex flex-col gap-3 p-2">
                                    {students.map(s => {
                                        const guardianName = s.guardian_type === 'father' ? s.father_name_bn : (s.guardian_name || s.father_name_bn);
                                        const guardianPhone = s.guardian_type === 'father' ? s.father_mobile : (s.guardian_mobile || s.father_mobile);
                                        
                                        return (
                                        <Card key={s.id} className="cursor-pointer hover:bg-green-50/30 transition-colors shadow-sm border overflow-hidden" onClick={() => handleSelectStudent(s)}>
                                            <div className="p-2.5">
                                                {/* Top row: Avatar, Name & Status */}
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
                                                                    {s.name_bn}
                                                                    {activeWaivers.some(w => String(w.student_id) === String(s.student_id) && w.waiver_type === 'full') && (
                                                                        <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-700 border-purple-200 px-1 py-0 h-3.5 leading-none shrink-0">মওকুফ</Badge>
                                                                    )}
                                                                </h4>
                                                                <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                                                    <CopyableId id={s.student_id} className="font-mono" /> • রোল: {toBengaliNumber(s.roll_number ?? s.roll_no ?? "") || "-"}
                                                                </p>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                {s.totalDue > 0 ? (
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="font-bold text-red-600 text-[14px] leading-none">৳ {toBengaliNumber(s.totalDue)}</span>
                                                                        <span className="text-[9px] font-semibold text-red-500 mt-1">{toBengaliNumber(s.dueCount || 0)} টি বকেয়া</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="font-bold text-green-600 text-[14px] leading-none">৳ ০</span>
                                                                        <span className="text-[9px] font-semibold text-green-600 mt-1">পরিশোধিত</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Middle row: Info pills */}
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-3.5 bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium">
                                                        {s.class_name} {s.department ? `(${s.department})` : ''}
                                                    </Badge>
                                                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-3.5 bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium">
                                                        {getBranchName(s.branch_id)}
                                                    </Badge>
                                                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-3.5 font-medium ${s.residential_status === 'residential' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                                        {s.residential_status === 'residential' ? 'আবাসিক' : 'অনাবাসিক'}
                                                    </Badge>
                                                </div>
                                                
                                                {/* Bottom row: Contact & Action */}
                                                <div className="flex justify-between items-center border-t border-gray-100 pt-2 mt-2">
                                                    <div className="text-[11px] text-gray-500 flex flex-col justify-center">
                                                        <span className="font-medium text-gray-700">{guardianName || "-"}</span>
                                                        <span>{toBengaliNumber(guardianPhone || "-")}</span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant={s.totalDue > 0 ? "default" : "outline"}
                                                        className={`h-8 px-3 text-[11px] rounded-full shrink-0 shadow-sm ${s.totalDue > 0 ? "bg-green-600 hover:bg-green-700" : "text-gray-700 border-gray-300"}`}
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            handleSelectStudent(s);
                                                        }}
                                                    >
                                                        {s.totalDue > 0 ? <CreditCard className="w-3 h-3 mr-1.5" /> : <Eye className="w-3 h-3 mr-1.5" />}
                                                        {s.totalDue > 0 ? "ফি আদায়" : "দেখুন"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    )})}
                                </div>
                                </>
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
                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                    <h2 className="text-xl font-bold text-gray-800">{selectedStudent.name_bn}</h2>
                                    {activeWaivers.some(w => String(w.student_id) === String(selectedStudent.student_id) && w.waiver_type === 'full') && (
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">সম্পূর্ণ মওকুফ</Badge>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                                    <p><span className="font-semibold text-gray-500">আইডি:</span> <CopyableId id={selectedStudent.student_id} className="font-mono" /></p>
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
                            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                                <CardTitle className="text-lg">পেমেন্ট হিস্টোরি</CardTitle>
                                {paidHistory.length > 0 && (
                                    <Button size="sm" onClick={() => setReportModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                                        <FileText className="w-4 h-4 mr-2" /> পেমেন্ট রিপোর্ট
                                    </Button>
                                )}
                            </CardHeader>
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
                                                <TableHead>রসিদ নং</TableHead>
                                                <TableHead className="text-right">পরিশোধিত পরিমাণ</TableHead>
                                                <TableHead className="text-center">রসিদ</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {groupedPaidHistory.map((group: any) => (
                                                <TableRow key={group.receiptNo}>
                                                    <TableCell className="text-sm">{group.date ? format(new Date(group.date), 'dd/MM/yyyy') : '-'}</TableCell>
                                                    <TableCell className="font-medium text-gray-800">
                                                        {group.items.map((item: any, idx: number) => {
                                                            let titlePart = item.description;
                                                            let subPart = "";
                                                            if (item.description.includes("|||")) {
                                                                const parts = item.description.split("|||");
                                                                titlePart = parts[0].trim();
                                                                subPart = parts[1].trim();
                                                            }
                                                            return (
                                                                <div key={idx} className={idx > 0 ? "mt-2 pt-2 border-t border-gray-100" : ""}>
                                                                    <div className="font-bold">{titlePart}</div>
                                                                    {subPart && <div className="text-xs text-gray-500 font-normal mt-0.5">{subPart}</div>}
                                                                </div>
                                                            );
                                                        })}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">{group.receiptNo}</TableCell>
                                                    <TableCell className="text-right font-bold text-green-700">
                                                        ৳ {toBengaliNumber(group.total || 0)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Button size="icon" variant="ghost" className="text-blue-600 h-8 w-8" onClick={() => {
                                                            setReceiptData({
                                                                student: selectedStudent,
                                                                fees: group.items.map((i: any) => ({ description: i.description, amount: i.amount })),
                                                                total: group.total,
                                                                invoiceNo: group.receiptNo,
                                                                paymentMethod: group.payment_method || "cash",
                                                                date: new Date(group.date)
                                                            });
                                                        }}>
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
                        
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">পেমেন্ট মাধ্যম</label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="h-12 text-base">
                                    <SelectValue placeholder="মাধ্যম নির্বাচন করুন" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash (নগদ)</SelectItem>
                                    <SelectItem value="bkash">bKash (বিকাশ)</SelectItem>
                                    <SelectItem value="nagad">Nagad (নগদ মোবাইল ব্যাংকিং)</SelectItem>
                                    <SelectItem value="bank">Bank (ব্যাংক)</SelectItem>
                                </SelectContent>
                            </Select>
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
                                    paymentMethod={receiptData.paymentMethod}
                                />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Payment Report Modal */}
            <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
                <DialogContent className="max-w-[900px] w-[95vw] max-h-[90vh] flex flex-col overflow-hidden p-0 bg-gray-100">
                    <div className="bg-white border-b p-4 flex justify-between items-center print:hidden shrink-0 z-10 shadow-sm">
                        <DialogTitle className="font-bold text-lg">পেমেন্ট রিপোর্ট প্রিভিউ</DialogTitle>
                        <div className="flex gap-2">
                            <Button onClick={() => handlePrintReport()} className="bg-blue-600 hover:bg-blue-700">
                                <Printer className="w-4 h-4 mr-2"/> প্রিন্ট করুন
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setReportModalOpen(false)} className="text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-full ml-1">
                                <X className="w-5 h-5"/>
                            </Button>
                        </div>
                    </div>
                    <div className="p-4 sm:p-8 print:p-0 flex justify-center overflow-auto flex-1 bg-gray-100/50 custom-scrollbar">
                        {selectedStudent && (
                            <StudentPaymentReport 
                                ref={reportRef}
                                student={selectedStudent}
                                transactions={paidHistory}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
