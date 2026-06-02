"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Loader2, Search, DollarSign, CheckCircle2, AlertCircle,
    Users, Calendar, CreditCard, Printer, Download, Banknote
} from "lucide-react";
import { format } from "date-fns";

const toBengaliNumber = (num: any) => String(num).replace(/[0-9]/g, c => "০১২৩৪৫৬৭৮৯"[parseInt(c)]);

const bengaliMonths = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

export default function TeacherSalary() {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [salaries, setSalaries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);

    // Filters
    const [filterBranch, setFilterBranch] = useState("all");
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Pay Modal
    const [payModal, setPayModal] = useState(false);
    const [payForm, setPayForm] = useState({
        teacher_id: "", teacher_name: "", branch_id: "", amount: "",
        payment_method: "cash", note: ""
    });

    // Bulk Pay
    const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
    const [bulkPaying, setBulkPaying] = useState(false);

    // History
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => { fetchAll(); }, []);
    useEffect(() => { fetchSalaryStatus(); }, [selectedMonth, selectedYear, filterBranch]);

    async function fetchAll() {
        setLoading(true);
        const [brRes, tRes] = await Promise.all([
            supabase.from("branches").select("id, name"),
            supabase.from("teachers").select("*, branches(name)").order("name")
        ]);
        if (brRes.data) setBranches(brRes.data);
        if (tRes.data) setTeachers(tRes.data);
        await fetchSalaryStatus();
        setLoading(false);
    }

    async function fetchSalaryStatus() {
        try {
            const { data } = await supabase
                .from("teacher_salaries")
                .select("*")
                .eq("salary_month", selectedMonth)
                .eq("salary_year", selectedYear);
            if (data) setSalaries(data);
        } catch {
            setSalaries([]);
        }
    }

    const getFilteredTeachers = () => {
        let filtered = teachers;
        if (filterBranch !== "all") {
            filtered = filtered.filter(t => String(t.branch_id) === filterBranch);
        }
        return filtered;
    };

    const getSalaryStatus = (teacherId: string) => {
        return salaries.find(s => s.teacher_id === teacherId);
    };

    const handleOpenPay = (t: any) => {
        const existing = getSalaryStatus(t.id);
        setPayForm({
            teacher_id: t.id,
            teacher_name: t.name,
            branch_id: t.branch_id || "",
            amount: existing?.net_amount ? String(existing.net_amount) : "",
            payment_method: "cash",
            note: ""
        });
        setPayModal(true);
    };

    const handlePay = async () => {
        if (!payForm.amount || parseFloat(payForm.amount) <= 0) return alert("বেতনের পরিমাণ দিন");
        setPaying(true);

        try {
            const amount = parseFloat(payForm.amount);
            
            // 1. Create transaction
            const { data: { user } } = await supabase.auth.getUser();
            const { data: txData, error: txError } = await supabase
                .from("transactions")
                .insert({
                    amount,
                    type: "expense",
                    fund_type: "general",
                    description: `শিক্ষক বেতন - ${payForm.teacher_name} - ${bengaliMonths[selectedMonth]} ${selectedYear}`,
                    transaction_date: new Date().toISOString().split("T")[0],
                    branch_id: payForm.branch_id ? parseInt(payForm.branch_id) : null,
                    created_by: user?.id
                })
                .select()
                .single();

            if (txError) throw txError;

            // 2. Insert salary record
            const teacher = teachers.find(t => t.id === payForm.teacher_id);
            const baseAmount = teacher?.salary_amount || amount;

            const { error: salError } = await supabase
                .from("teacher_salaries")
                .insert({
                    teacher_id: payForm.teacher_id,
                    base_amount: baseAmount,
                    net_amount: amount,
                    salary_month: selectedMonth,
                    salary_year: selectedYear,
                    payment_date: new Date().toISOString().split("T")[0],
                    payment_method: payForm.payment_method,
                    remarks: payForm.note,
                    created_by: user?.id
                });

            if (salError) throw salError;

            setPayModal(false);
            await fetchSalaryStatus();
        } catch (err: any) {
            console.error(err);
            alert("ত্রুটি: " + (err.message || "বেতন প্রদান ব্যর্থ"));
        }
        setPaying(false);
    };

    const handleBulkPay = async () => {
        if (selectedTeachers.length === 0) return;
        setBulkPaying(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            for (const teacherId of selectedTeachers) {
                const teacher = teachers.find(t => t.id === teacherId);
                const existing = getSalaryStatus(teacherId);
                if (existing) continue;

                const amount = teacher?.salary_amount || 0;
                if (amount <= 0) continue;

                const { data: txData } = await supabase
                    .from("transactions")
                    .insert({
                        amount,
                        type: "expense",
                        fund_type: "general",
                        description: `শিক্ষক বেতন - ${teacher?.name} - ${bengaliMonths[selectedMonth]} ${selectedYear}`,
                        transaction_date: new Date().toISOString().split("T")[0],
                        branch_id: teacher?.branch_id,
                        created_by: user?.id
                    })
                    .select()
                    .single();

                await supabase
                    .from("teacher_salaries")
                    .insert({
                        teacher_id: teacherId,
                        base_amount: amount, // amount here is teacher?.salary_amount
                        net_amount: amount,
                        salary_month: selectedMonth,
                        salary_year: selectedYear,
                        payment_date: new Date().toISOString().split("T")[0],
                        payment_method: "cash",
                        created_by: user?.id
                    });
            }

            setSelectedTeachers([]);
            await fetchSalaryStatus();
        } catch (err: any) {
            alert("ত্রুটি: " + err.message);
        }
        setBulkPaying(false);
    };

    const handleViewHistory = async () => {
        const { data } = await supabase
            .from("teacher_salaries")
            .select("*, teachers(name, designation, branches(name))")
            .order("payment_date", { ascending: false })
            .limit(50);
        if (data) setHistory(data);
        setShowHistory(true);
    };

    const filteredTeachers = getFilteredTeachers();
    const paidCount = filteredTeachers.filter(t => !!getSalaryStatus(t.id)).length;
    const totalSalary = salaries.reduce((sum, s) => sum + (s.net_amount || 0), 0);

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-green-600" /></div>;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                <Card className="border-l-[3px] border-l-teal-500 py-0 gap-0 rounded-2xl shadow-sm">
                    <CardContent className="p-2.5 sm:p-3">
                        <p className="text-[9px] sm:text-[11px] font-bold text-gray-500">মোট শিক্ষক</p>
                        <h3 className="text-sm sm:text-2xl font-bold text-teal-700">{toBengaliNumber(filteredTeachers.length)} জন</h3>
                    </CardContent>
                </Card>
                <Card className="border-l-[3px] border-l-green-500 py-0 gap-0 rounded-2xl shadow-sm">
                    <CardContent className="p-2.5 sm:p-3">
                        <p className="text-[9px] sm:text-[11px] font-bold text-gray-500">বেতন দেওয়া হয়েছে</p>
                        <h3 className="text-sm sm:text-2xl font-bold text-green-700">{toBengaliNumber(paidCount)}/{toBengaliNumber(filteredTeachers.length)}</h3>
                    </CardContent>
                </Card>
                <Card className="border-l-[3px] border-l-blue-500 py-0 gap-0 rounded-2xl shadow-sm col-span-2 sm:col-span-1">
                    <CardContent className="p-2.5 sm:p-3">
                        <p className="text-[9px] sm:text-[11px] font-bold text-gray-500">মোট পরিশোধিত</p>
                        <h3 className="text-sm sm:text-2xl font-bold text-blue-700">৳ {toBengaliNumber(totalSalary)}</h3>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="rounded-2xl shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
                        <div className="flex-1 space-y-1.5">
                            <label className="text-xs font-bold text-gray-600">মাস</label>
                            <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(parseInt(v))}>
                                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {bengaliMonths.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <label className="text-xs font-bold text-gray-600">বছর</label>
                            <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(parseInt(v))}>
                                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{toBengaliNumber(y)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <label className="text-xs font-bold text-gray-600">শাখা</label>
                            <Select value={filterBranch} onValueChange={setFilterBranch}>
                                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">সকল শাখা</SelectItem>
                                    {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="outline" onClick={handleViewHistory} className="h-10">
                            <Calendar className="w-4 h-4 mr-2" /> হিস্টোরি
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Teachers List */}
            <Card className="rounded-2xl shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                            <Banknote className="w-5 h-5 text-teal-600" />
                            {bengaliMonths[selectedMonth]} {toBengaliNumber(selectedYear)} — শিক্ষক বেতন
                        </CardTitle>
                        {selectedTeachers.length > 0 && (
                            <Button onClick={handleBulkPay} disabled={bulkPaying} className="bg-green-700 hover:bg-green-800 text-sm">
                                {bulkPaying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                                {toBengaliNumber(selectedTeachers.length)} জনকে পে করুন
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Desktop Table */}
                    <div className="hidden md:block border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedTeachers.length === filteredTeachers.filter(t => !getSalaryStatus(t.id)).length && filteredTeachers.filter(t => !getSalaryStatus(t.id)).length > 0}
                                            onCheckedChange={(c) => setSelectedTeachers(c ? filteredTeachers.filter(t => !getSalaryStatus(t.id)).map(t => t.id) : [])}
                                        />
                                    </TableHead>
                                    <TableHead>শিক্ষকের নাম</TableHead>
                                    <TableHead>পদবী</TableHead>
                                    <TableHead>শাখা</TableHead>
                                    <TableHead className="text-right">বেতন</TableHead>
                                    <TableHead className="text-center">স্ট্যাটাস</TableHead>
                                    <TableHead className="text-right">অ্যাকশন</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTeachers.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-400">কোনো শিক্ষক পাওয়া যায়নি</TableCell></TableRow>
                                ) : filteredTeachers.map(t => {
                                    const salaryRecord = getSalaryStatus(t.id);
                                    const isPaid = !!salaryRecord;
                                    return (
                                        <TableRow key={t.id} className={isPaid ? "bg-green-50/40" : ""}>
                                            <TableCell>
                                                <Checkbox
                                                    disabled={isPaid}
                                                    checked={selectedTeachers.includes(t.id)}
                                                    onCheckedChange={() => setSelectedTeachers(p => p.includes(t.id) ? p.filter(x => x !== t.id) : [...p, t.id])}
                                                />
                                            </TableCell>
                                            <TableCell className="font-bold text-gray-800">{t.name}</TableCell>
                                            <TableCell className="text-sm text-gray-600">{t.designation || '-'}</TableCell>
                                            <TableCell className="text-sm">{t.branches?.name || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="font-bold text-gray-800">
                                                    {salaryRecord?.net_amount ? `৳ ${toBengaliNumber(salaryRecord.net_amount)}` : <span className="text-gray-300">—</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {isPaid ? (
                                                    <Badge className="bg-green-100 text-green-700 border-green-200">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" /> পরিশোধিত
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                                        <AlertCircle className="w-3 h-3 mr-1" /> বকেয়া
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {isPaid ? (
                                                    <div className="flex flex-col text-right">
                                                        <span className="text-xs text-gray-400">{salaryRecord.payment_date ? format(new Date(salaryRecord.payment_date), 'dd/MM/yy') : ''}</span>
                                                        <span className="text-[10px] text-gray-400 capitalize">{salaryRecord.payment_method}</span>
                                                    </div>
                                                ) : (
                                                    <Button size="sm" onClick={() => handleOpenPay(t)} className="bg-teal-600 hover:bg-teal-700 text-xs h-8">
                                                        <CreditCard className="w-3 h-3 mr-1" /> পে করুন
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {filteredTeachers.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 border rounded-lg">কোনো শিক্ষক পাওয়া যায়নি</div>
                        ) : filteredTeachers.map(t => {
                            const salaryRecord = getSalaryStatus(t.id);
                            const isPaid = !!salaryRecord;
                            return (
                                <Card key={t.id} className={`${isPaid ? 'border-green-200 bg-green-50/40' : ''} shadow-sm`}>
                                    <CardContent className="p-3 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-gray-800">{t.name}</p>
                                                <p className="text-xs text-gray-500">{t.designation || '-'} | {t.branches?.name || '-'}</p>
                                            </div>
                                            {isPaid ? (
                                                <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">পরিশোধিত</Badge>
                                            ) : (
                                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">বকেয়া</Badge>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center pt-1 border-t">
                                            <span className="font-bold text-gray-800">
                                                {salaryRecord?.net_amount ? `৳ ${toBengaliNumber(salaryRecord.net_amount)}` : '—'}
                                            </span>
                                            {!isPaid && (
                                                <Button size="sm" onClick={() => handleOpenPay(t)} className="bg-teal-600 hover:bg-teal-700 text-xs h-8">
                                                    <CreditCard className="w-3 h-3 mr-1" /> পে করুন
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Pay Modal */}
            <Dialog open={payModal} onOpenChange={setPayModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Banknote className="w-5 h-5 text-teal-600" /> বেতন প্রদান
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="bg-teal-50 p-3 rounded-lg border border-teal-100">
                            <p className="font-bold text-teal-800">{payForm.teacher_name}</p>
                            <p className="text-xs text-teal-600">{bengaliMonths[selectedMonth]} {toBengaliNumber(selectedYear)}</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600">বেতনের পরিমাণ (৳) *</label>
                            <Input type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} placeholder="0" className="h-10" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600">পেমেন্ট মেথড</label>
                            <Select value={payForm.payment_method} onValueChange={v => setPayForm({ ...payForm, payment_method: v })}>
                                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">নগদ</SelectItem>
                                    <SelectItem value="bkash">বিকাশ</SelectItem>
                                    <SelectItem value="bank">ব্যাংক</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600">নোট (ঐচ্ছিক)</label>
                            <Input value={payForm.note} onChange={e => setPayForm({ ...payForm, note: e.target.value })} placeholder="বিবরণ..." className="h-10" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPayModal(false)}>বাতিল</Button>
                        <Button onClick={handlePay} disabled={paying} className="bg-teal-600 hover:bg-teal-700">
                            {paying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                            পেমেন্ট করুন
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* History Modal */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>শিক্ষক বেতন হিস্টোরি</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        {history.length === 0 ? (
                            <p className="text-center py-8 text-gray-400">কোনো হিস্টোরি নেই</p>
                        ) : history.map(h => (
                            <div key={h.id} className="flex items-center justify-between py-2 px-3 rounded-lg border hover:bg-gray-50">
                                <div>
                                    <p className="font-bold text-sm text-gray-800">{h.teachers?.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {bengaliMonths[h.salary_month]} {toBengaliNumber(h.salary_year)} | {h.payment_method}
                                        {h.remarks && ` | ${h.remarks}`}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-teal-700">৳ {toBengaliNumber(h.net_amount)}</p>
                                    <p className="text-[10px] text-gray-400">{h.payment_date ? format(new Date(h.payment_date), 'dd/MM/yyyy') : ''}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
