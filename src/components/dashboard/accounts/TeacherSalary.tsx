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
    Users, Calendar, CreditCard, Printer, Download, Banknote, Trash2, Edit
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

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

    // Edit Modal
    const [editModal, setEditModal] = useState(false);
    const [editingPayment, setEditingPayment] = useState(false);
    const [editForm, setEditForm] = useState({
        id: "", teacher_name: "", amount: "", payment_method: "cash", note: ""
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

    const getAggregatedSalary = (teacherId: string) => {
        const records = salaries.filter(s => s.teacher_id === teacherId);
        const teacher = teachers.find(t => t.id === teacherId);
        const base_amount = records.length > 0 ? (records[0].base_amount || teacher?.salary_amount || 0) : (teacher?.salary_amount || 0);
        const paid_amount = records.reduce((sum, s) => sum + (s.net_amount || 0), 0);
        const due_amount = Math.max(0, base_amount - paid_amount);
        return { 
            base_amount, 
            paid_amount, 
            due_amount, 
            records, 
            isPaid: paid_amount >= base_amount && base_amount > 0, 
            isPartial: paid_amount > 0 && paid_amount < base_amount 
        };
    };

    const handleOpenPay = (t: any) => {
        const agg = getAggregatedSalary(t.id);
        const amountToPay = agg.due_amount > 0 ? agg.due_amount : agg.base_amount;
        setPayForm({
            teacher_id: t.id,
            teacher_name: t.name,
            branch_id: t.branch_id || "",
            amount: amountToPay > 0 ? String(amountToPay) : "",
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
            const agg = getAggregatedSalary(payForm.teacher_id);
            const baseAmount = agg.base_amount > 0 ? agg.base_amount : amount;

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
                const agg = getAggregatedSalary(teacherId);
                
                if (agg.isPaid) continue;

                const amount = agg.due_amount > 0 ? agg.due_amount : (teacher?.salary_amount || 0);
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
                        base_amount: agg.base_amount > 0 ? agg.base_amount : amount,
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

    const handleDeleteSalary = async (id: string) => {
        if (!confirm("আপনি কি নিশ্চিত যে এই পেমেন্ট রেকর্ডটি মুছে ফেলতে চান? ট্রানজেকশন অটোমেটিক মুছবে না।")) return;
        try {
            const { data, error } = await supabase.from("teacher_salaries").delete().eq("id", id).select();
            if (error) throw error;
            if (!data || data.length === 0) throw new Error("ডাটা ডিলিট হয়নি। ডাটাবেজে Delete পারমিশন (RLS) চেক করুন।");
            
            setHistory(history.filter(h => h.id !== id));
            await fetchSalaryStatus();
        } catch (err: any) {
            alert("ত্রুটি: " + err.message);
        }
    };

    const handleOpenEdit = (h: any) => {
        setEditForm({
            id: h.id,
            teacher_name: h.teachers?.name || "অজানা",
            amount: String(h.net_amount || 0),
            payment_method: h.payment_method || "cash",
            note: h.remarks || ""
        });
        setEditModal(true);
    };

    const handleEditSalary = async () => {
        if (!editForm.amount || parseFloat(editForm.amount) <= 0) return alert("বেতনের পরিমাণ দিন");
        setEditingPayment(true);
        try {
            const { error } = await supabase
                .from("teacher_salaries")
                .update({
                    net_amount: parseFloat(editForm.amount),
                    payment_method: editForm.payment_method,
                    remarks: editForm.note
                })
                .eq("id", editForm.id);

            if (error) throw error;

            setEditModal(false);
            await fetchSalaryStatus();
            
            // update local history state for immediate feedback
            setHistory(history.map(h => h.id === editForm.id ? { 
                ...h, 
                net_amount: parseFloat(editForm.amount),
                payment_method: editForm.payment_method,
                remarks: editForm.note
            } : h));

            alert("পেমেন্ট আপডেট সফল হয়েছে! (সংশ্লিষ্ট ট্রানজেকশন আপডেট করতে হবে)");
        } catch (err: any) {
            alert("ত্রুটি: " + err.message);
        }
        setEditingPayment(false);
    };

    const filteredTeachers = getFilteredTeachers();
    const fullyPaidCount = filteredTeachers.filter(t => getAggregatedSalary(t.id).isPaid).length;
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
                        <p className="text-[9px] sm:text-[11px] font-bold text-gray-500">সম্পূর্ণ বেতন দেওয়া হয়েছে</p>
                        <h3 className="text-sm sm:text-2xl font-bold text-green-700">{toBengaliNumber(fullyPaidCount)}/{toBengaliNumber(filteredTeachers.length)}</h3>
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
                                            checked={selectedTeachers.length === filteredTeachers.filter(t => !getAggregatedSalary(t.id).isPaid).length && filteredTeachers.filter(t => !getAggregatedSalary(t.id).isPaid).length > 0}
                                            onCheckedChange={(c) => setSelectedTeachers(c ? filteredTeachers.filter(t => !getAggregatedSalary(t.id).isPaid).map(t => t.id) : [])}
                                        />
                                    </TableHead>
                                    <TableHead>শিক্ষকের নাম</TableHead>
                                    <TableHead>শাখা</TableHead>
                                    <TableHead className="text-right">নির্ধারিত বেতন</TableHead>
                                    <TableHead className="text-right">পরিশোধিত</TableHead>
                                    <TableHead className="text-right">বকেয়া</TableHead>
                                    <TableHead className="text-center">স্ট্যাটাস</TableHead>
                                    <TableHead className="text-right">অ্যাকশন</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTeachers.length === 0 ? (
                                    <TableRow><TableCell colSpan={8} className="text-center py-10 text-gray-400">কোনো শিক্ষক পাওয়া যায়নি</TableCell></TableRow>
                                ) : filteredTeachers.map(t => {
                                    const agg = getAggregatedSalary(t.id);
                                    
                                    return (
                                        <TableRow key={t.id} className={agg.isPaid ? "bg-green-50/40" : agg.isPartial ? "bg-blue-50/40" : ""}>
                                            <TableCell>
                                                <Checkbox
                                                    disabled={agg.isPaid}
                                                    checked={selectedTeachers.includes(t.id)}
                                                    onCheckedChange={() => setSelectedTeachers(p => p.includes(t.id) ? p.filter(x => x !== t.id) : [...p, t.id])}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-bold text-gray-800">{t.name}</p>
                                                <p className="text-xs text-gray-500">{t.designation || '-'}</p>
                                            </TableCell>
                                            <TableCell className="text-sm">{t.branches?.name || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="font-bold text-gray-800">
                                                    {agg.base_amount > 0 ? `৳ ${toBengaliNumber(agg.base_amount)}` : <span className="text-gray-300">—</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className={`font-bold ${agg.paid_amount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                    ৳ {toBengaliNumber(agg.paid_amount)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className={`font-bold ${agg.due_amount > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                    ৳ {toBengaliNumber(agg.due_amount)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {agg.isPaid ? (
                                                    <Badge className="bg-green-100 text-green-700 border-green-200">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" /> পরিশোধিত
                                                    </Badge>
                                                ) : agg.isPartial ? (
                                                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                                        <AlertCircle className="w-3 h-3 mr-1" /> আংশিক
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                                        <AlertCircle className="w-3 h-3 mr-1" /> বকেয়া
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/dashboard/teachers/${t.id}`}>
                                                        <Button size="sm" variant="outline" className="h-8">
                                                            প্রোফাইল
                                                        </Button>
                                                    </Link>
                                                    {!agg.isPaid && (
                                                        <Button size="sm" onClick={() => handleOpenPay(t)} className="bg-teal-600 hover:bg-teal-700 text-xs h-8">
                                                            <CreditCard className="w-3 h-3 mr-1" /> পে করুন
                                                        </Button>
                                                    )}
                                                </div>
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
                            const agg = getAggregatedSalary(t.id);
                            
                            return (
                                <Card key={t.id} className={`${agg.isPaid ? 'border-green-200 bg-green-50/40' : agg.isPartial ? 'border-blue-200 bg-blue-50/40' : ''} shadow-sm`}>
                                    <CardContent className="p-3 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-gray-800">{t.name}</p>
                                                <p className="text-xs text-gray-500">{t.designation || '-'} | {t.branches?.name || '-'}</p>
                                            </div>
                                            {agg.isPaid ? (
                                                <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">পরিশোধিত</Badge>
                                            ) : agg.isPartial ? (
                                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">আংশিক</Badge>
                                            ) : (
                                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">বকেয়া</Badge>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-2 py-2 border-y text-center text-xs">
                                            <div>
                                                <p className="text-gray-500">বেতন</p>
                                                <p className="font-bold">৳ {toBengaliNumber(agg.base_amount)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">প্রদান</p>
                                                <p className="font-bold text-green-600">৳ {toBengaliNumber(agg.paid_amount)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">বকেয়া</p>
                                                <p className="font-bold text-red-500">৳ {toBengaliNumber(agg.due_amount)}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-1 flex justify-end gap-2">
                                            <Link href={`/dashboard/teachers/${t.id}`}>
                                                <Button size="sm" variant="outline" className="h-8 text-xs">
                                                    প্রোফাইল
                                                </Button>
                                            </Link>
                                            {!agg.isPaid && (
                                                <Button size="sm" onClick={() => handleOpenPay(t)} className="bg-teal-600 hover:bg-teal-700 text-xs h-8">
                                                    <CreditCard className="w-3 h-3 mr-1" /> পে করুন (৳ {toBengaliNumber(agg.due_amount)})
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

            {/* Edit Modal */}
            <Dialog open={editModal} onOpenChange={setEditModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5 text-blue-600" /> পেমেন্ট এডিট
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <p className="font-bold text-blue-800">{editForm.teacher_name}</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600">প্রদানকৃত পরিমাণ (৳) *</label>
                            <Input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} placeholder="0" className="h-10" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600">পেমেন্ট মেথড</label>
                            <Select value={editForm.payment_method} onValueChange={v => setEditForm({ ...editForm, payment_method: v })}>
                                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">নগদ</SelectItem>
                                    <SelectItem value="bkash">বিকাশ</SelectItem>
                                    <SelectItem value="bank">ব্যাংক</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600">নোট</label>
                            <Input value={editForm.note} onChange={e => setEditForm({ ...editForm, note: e.target.value })} placeholder="বিবরণ..." className="h-10" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditModal(false)}>বাতিল</Button>
                        <Button onClick={handleEditSalary} disabled={editingPayment} className="bg-blue-600 hover:bg-blue-700">
                            {editingPayment ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            আপডেট করুন
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
                            <div key={h.id} className="flex items-center justify-between py-3 px-4 rounded-lg border hover:bg-gray-50 bg-white">
                                <div>
                                    <p className="font-bold text-sm text-gray-800">{h.teachers?.name}</p>
                                    <div className="text-xs text-gray-500 mt-1 flex items-center flex-wrap gap-1">
                                        <Badge variant="outline" className="text-[10px] bg-gray-100">{bengaliMonths[h.salary_month]} {toBengaliNumber(h.salary_year)}</Badge>
                                        <span className="text-gray-300">|</span> 
                                        <span>{h.payment_method === 'cash' ? 'নগদ' : h.payment_method === 'bkash' ? 'বিকাশ' : 'ব্যাংক'}</span>
                                        {h.remarks && <span className="text-gray-400">({h.remarks})</span>}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <p className="font-bold text-teal-700 text-lg">৳ {toBengaliNumber(h.net_amount)}</p>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-gray-400 mr-2">{h.payment_date ? format(new Date(h.payment_date), 'dd/MM/yyyy') : ''}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:bg-blue-50" onClick={() => handleOpenEdit(h)}>
                                            <Edit className="w-3 h-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-50" onClick={() => handleDeleteSalary(h.id)}>
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
