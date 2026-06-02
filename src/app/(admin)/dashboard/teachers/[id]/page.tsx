"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, ArrowLeft, PlusCircle, CheckCircle2, AlertCircle, Edit, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReactToPrint } from "react-to-print";
import TeacherSalaryReport from "@/components/dashboard/accounts/TeacherSalaryReport";
import Link from "next/link";
import { format } from "date-fns";

const toBengaliNumber = (num: any) => String(num).replace(/[0-9]/g, c => "০১২৩৪৫৬৭৮৯"[parseInt(c)]);

const bengaliMonths = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

export default function TeacherProfilePage({ params }: { params: { id: string } }) {
    const [loading, setLoading] = useState(true);
    const [teacher, setTeacher] = useState<any>(null);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const reportRef = useRef<HTMLDivElement>(null);

    // Bonus/Allowance Modal
    const [bonusModal, setBonusModal] = useState(false);
    const [bonusForm, setBonusForm] = useState({ type: "bonus", amount: "", method: "cash", note: "" });
    const [submitting, setSubmitting] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: reportRef,
        documentTitle: `Teacher_Report_${teacher?.name || 'Salary'}`,
        suppressErrors: true
    });

    useEffect(() => {
        if (params.id) {
            fetchTeacherAndData();
        }
    }, [params.id, year]);

    async function fetchTeacherAndData() {
        setLoading(true);
        
        // Fetch Teacher
        const { data: tData } = await supabase
            .from("teachers")
            .select("*, branches(name)")
            .eq("id", params.id)
            .single();
            
        if (tData) setTeacher(tData);

        // Fetch Salaries & Bonuses for the selected year
        const { data: sData } = await supabase
            .from("teacher_salaries")
            .select("*")
            .eq("teacher_id", params.id)
            .eq("salary_year", year)
            .order("created_at", { ascending: false });

        const salaries = sData || [];
        setHistory(salaries);

        // Process monthly standard salary (ignore bonuses for the due calculations)
        if (tData) {
            const baseAmount = tData.salary_amount || 0;
            const yearData = bengaliMonths.map((monthName, index) => {
                // Filter only 'salary' type payments for the monthly breakdown
                const monthPayments = salaries.filter(s => s.salary_month === index + 1 && (s.payment_type === 'salary' || !s.payment_type));
                
                const totalPaid = monthPayments.reduce((sum, p) => sum + (p.net_amount || 0), 0);
                const monthBase = monthPayments.length > 0 && monthPayments[0].base_amount 
                    ? monthPayments[0].base_amount 
                    : baseAmount;

                const dueAmount = monthBase - totalPaid;
                
                let status = 'Unpaid';
                if (monthPayments.length > 0) {
                    if (dueAmount <= 0) status = 'Paid';
                    else status = 'Partial';
                } else if (monthBase > 0) {
                    status = 'Due';
                }

                return {
                    monthIndex: index + 1,
                    monthName,
                    baseAmount: monthBase,
                    paidAmount: totalPaid,
                    dueAmount: dueAmount > 0 ? dueAmount : 0,
                    status,
                    paymentDates: monthPayments.map(p => p.created_at),
                    paymentMethods: monthPayments.map(p => p.payment_method)
                };
            });
            setMonthlyData(yearData);
        }

        setLoading(false);
    }

    const handleGiveBonus = async () => {
        if (!bonusForm.amount || parseFloat(bonusForm.amount) <= 0) {
            return alert("সঠিক পরিমাণ লিখুন!");
        }
        setSubmitting(true);
        try {
            const amount = parseFloat(bonusForm.amount);
            const { data: { user } } = await supabase.auth.getUser();
            
            // 1. Transaction
            const { error: txError } = await supabase.from("transactions").insert({
                amount,
                type: "expense",
                fund_type: "general",
                description: `শিক্ষক ${bonusForm.type === 'bonus' ? 'বোনাস' : 'ভাতা'} - ${teacher.name}`,
                transaction_date: new Date().toISOString().split("T")[0],
                branch_id: teacher.branch_id,
                created_by: user?.id
            });
            if (txError) throw txError;

            // 2. Insert into teacher_salaries with payment_type = bonus/allowance
            const { error: salError } = await supabase.from("teacher_salaries").insert({
                teacher_id: teacher.id,
                base_amount: amount, // For bonus, base = net
                net_amount: amount,
                salary_month: new Date().getMonth() + 1, // Current month roughly
                salary_year: year,
                payment_date: new Date().toISOString().split("T")[0],
                payment_method: bonusForm.method,
                payment_type: bonusForm.type,
                remarks: bonusForm.note,
                created_by: user?.id
            });
            if (salError) throw salError;

            setBonusModal(false);
            setBonusForm({ type: "bonus", amount: "", method: "cash", note: "" });
            await fetchTeacherAndData();
            alert("পেমেন্ট সফলভাবে যুক্ত হয়েছে!");
        } catch (err: any) {
            alert("ত্রুটি: " + err.message);
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("আপনি কি নিশ্চিত এই পেমেন্ট রেকর্ডটি মুছে ফেলতে চান?")) return;
        try {
            await supabase.from("teacher_salaries").delete().eq("id", id);
            await fetchTeacherAndData();
        } catch (err: any) {
            alert("ত্রুটি: " + err.message);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;
    if (!teacher) return <div className="text-center py-20 text-gray-500">শিক্ষকের তথ্য পাওয়া যায়নি!</div>;

    const totalSalaryPaid = monthlyData.reduce((sum, m) => sum + m.paidAmount, 0);
    const bonuses = history.filter(h => h.payment_type === 'bonus' || h.payment_type === 'allowance');
    const totalBonuses = bonuses.reduce((sum, b) => sum + (b.net_amount || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/accounts">
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full"><ArrowLeft className="w-4 h-4" /></Button>
                    </Link>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{teacher.name}</h2>
                        <p className="text-xs text-gray-500">{teacher.designation || "পদবী নেই"} | {teacher.branches?.name || "শাখা নেই"}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Select value={String(year)} onValueChange={v => setYear(parseInt(v))}>
                        <SelectTrigger className="h-9 w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{toBengaliNumber(y)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button onClick={() => setBonusModal(true)} variant="outline" className="h-9 border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100">
                        <PlusCircle className="w-4 h-4 mr-2" /> ভাতা/বোনাস
                    </Button>
                    <Button onClick={() => handlePrint()} className="h-9 bg-teal-600 hover:bg-teal-700">
                        <Printer className="w-4 h-4 mr-2" /> প্রিন্ট
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-bold text-gray-500">নির্ধারিত মাসিক বেতন</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">৳ {toBengaliNumber(teacher.salary_amount || 0)}</h3>
                </div>
                <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 flex flex-col justify-center">
                    <p className="text-xs font-bold text-teal-600">মোট বেতন প্রদান ({toBengaliNumber(year)})</p>
                    <h3 className="text-2xl font-bold text-teal-700 mt-1">৳ {toBengaliNumber(totalSalaryPaid)}</h3>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-center">
                    <p className="text-xs font-bold text-blue-600">মোট বোনাস/ভাতা ({toBengaliNumber(year)})</p>
                    <h3 className="text-2xl font-bold text-blue-700 mt-1">৳ {toBengaliNumber(totalBonuses)}</h3>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Monthly Salary Breakdown */}
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-4 border-b bg-gray-50/50">
                        <h3 className="font-bold text-gray-800">মাসিক বেতনের হিসাব ({toBengaliNumber(year)})</h3>
                    </div>
                    <div className="overflow-auto flex-1">
                        <Table>
                            <TableHeader className="bg-gray-50 sticky top-0">
                                <TableRow>
                                    <TableHead>মাস</TableHead>
                                    <TableHead className="text-center">স্ট্যাটাস</TableHead>
                                    <TableHead className="text-right">প্রদানকৃত</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {monthlyData.map(m => (
                                    <TableRow key={m.monthIndex} className={m.paidAmount > 0 ? "bg-white" : "bg-red-50/10"}>
                                        <TableCell className="font-medium">{m.monthName}</TableCell>
                                        <TableCell className="text-center">
                                            {m.status === 'Paid' ? (
                                                <Badge className="bg-green-100 text-green-700 border-none shadow-none"><CheckCircle2 className="w-3 h-3 mr-1"/>পরিশোধিত</Badge>
                                            ) : m.status === 'Partial' ? (
                                                <Badge className="bg-blue-100 text-blue-700 border-none shadow-none"><AlertCircle className="w-3 h-3 mr-1"/>আংশিক</Badge>
                                            ) : m.status === 'Due' ? (
                                                <Badge className="bg-amber-100 text-amber-700 border-none shadow-none"><AlertCircle className="w-3 h-3 mr-1"/>বকেয়া</Badge>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="font-bold text-gray-800">৳ {toBengaliNumber(m.paidAmount)}</div>
                                            {m.dueAmount > 0 && <div className="text-[10px] text-red-500 mt-0.5">বকেয়া: ৳ {toBengaliNumber(m.dueAmount)}</div>}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Complete History Log */}
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-4 border-b bg-gray-50/50">
                        <h3 className="font-bold text-gray-800">পেমেন্ট হিস্টোরি ({toBengaliNumber(year)})</h3>
                    </div>
                    <div className="overflow-auto flex-1 p-0">
                        {history.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">কোনো পেমেন্ট রেকর্ড নেই</div>
                        ) : (
                            <div className="divide-y">
                                {history.map(h => (
                                    <div key={h.id} className="p-4 hover:bg-gray-50 flex items-center justify-between group">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-800">
                                                    {h.payment_type === 'bonus' ? 'বোনাস' : h.payment_type === 'allowance' ? 'ভাতা' : 'মাসিক বেতন'}
                                                </p>
                                                {h.payment_type !== 'bonus' && h.payment_type !== 'allowance' && (
                                                    <Badge variant="outline" className="text-[10px] bg-gray-100 h-5">
                                                        {bengaliMonths[h.salary_month - 1]} {toBengaliNumber(h.salary_year)}
                                                    </Badge>
                                                )}
                                                {(h.payment_type === 'bonus' || h.payment_type === 'allowance') && (
                                                    <Badge className="bg-purple-100 text-purple-700 border-none h-5 text-[10px]">অতিরিক্ত পেমেন্ট</Badge>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                <span>{h.payment_date ? format(new Date(h.payment_date), 'dd/MM/yyyy') : '-'}</span>
                                                <span>•</span>
                                                <span className="capitalize">{h.payment_method}</span>
                                                {h.remarks && <><span>•</span><span>{h.remarks}</span></>}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <p className={`font-bold text-lg ${h.payment_type === 'bonus' || h.payment_type === 'allowance' ? 'text-purple-600' : 'text-teal-700'}`}>
                                                ৳ {toBengaliNumber(h.net_amount)}
                                            </p>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(h.id)}>
                                                <Trash2 className="w-3.5 h-3.5"/>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden Print Report */}
            <div className="hidden">
                <TeacherSalaryReport 
                    ref={reportRef}
                    teacher={teacher}
                    year={year}
                    monthlyData={monthlyData}
                    bonuses={bonuses}
                />
            </div>

            {/* Bonus Modal */}
            <Dialog open={bonusModal} onOpenChange={setBonusModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>ভাতা বা বোনাস প্রদান</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600">পেমেন্টের ধরন</label>
                            <Select value={bonusForm.type} onValueChange={v => setBonusForm({...bonusForm, type: v})}>
                                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bonus">বোনাস (Bonus)</SelectItem>
                                    <SelectItem value="allowance">ভাতা (Allowance)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600">পরিমাণ (৳) *</label>
                            <Input type="number" value={bonusForm.amount} onChange={e => setBonusForm({...bonusForm, amount: e.target.value})} placeholder="0" className="h-10" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600">পেমেন্ট মেথড</label>
                            <Select value={bonusForm.method} onValueChange={v => setBonusForm({...bonusForm, method: v})}>
                                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">নগদ</SelectItem>
                                    <SelectItem value="bkash">বিকাশ</SelectItem>
                                    <SelectItem value="bank">ব্যাংক</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600">নোট (কীসের বোনাস/ভাতা)</label>
                            <Input value={bonusForm.note} onChange={e => setBonusForm({...bonusForm, note: e.target.value})} placeholder="উদাঃ ঈদের বোনাস..." className="h-10" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBonusModal(false)}>বাতিল</Button>
                        <Button onClick={handleGiveBonus} disabled={submitting} className="bg-teal-600 hover:bg-teal-700">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <CheckCircle2 className="w-4 h-4 mr-2"/>} প্রদান করুন
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
