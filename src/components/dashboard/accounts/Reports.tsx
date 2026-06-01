"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, FileText, FileSpreadsheet, Filter, Search, ArrowUpRight, ArrowDownRight, Scale, Building2 } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const toBengaliNumber = (num: any) => String(num).replace(/[0-9]/g, c => "০১২৩৪৫৬৭৮৯"[parseInt(c)]);

export default function Reports() {
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [typeFilter, setTypeFilter] = useState("all");
    const [fundFilter, setFundFilter] = useState("all");
    const [filterBranch, setFilterBranch] = useState("all");

    const [transactions, setTransactions] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0, lillahIncome: 0, lillahExpense: 0, generalIncome: 0, generalExpense: 0 });

    async function fetchReports() {
        setLoading(true);
        // Fetch branches if not fetched
        if (branches.length === 0) {
            const { data: b } = await supabase.from("branches").select("id, name");
            if (b) setBranches(b);
        }

        let query = supabase.from("transactions")
            .select("*, categories(name)")
            .gte("transaction_date", startDate)
            .lte("transaction_date", endDate)
            .order("transaction_date", { ascending: false });

        if (typeFilter !== 'all') {
            query = query.eq("type", typeFilter);
        }
        if (fundFilter !== 'all') {
            query = query.eq("fund_type", fundFilter);
        }
        if (filterBranch !== 'all') {
            query = query.eq("branch_id", parseInt(filterBranch));
        }

        const { data } = await query;
        if (data) {
            setTransactions(data);
            
            let inc = 0, exp = 0;
            let lInc = 0, lExp = 0;
            let gInc = 0, gExp = 0;

            data.forEach(t => {
                const amount = Number(t.amount || 0);
                if (t.type === 'income') {
                    inc += amount;
                    if (t.fund_type === 'lillah') lInc += amount;
                    else gInc += amount;
                } else {
                    exp += amount;
                    if (t.fund_type === 'lillah') lExp += amount;
                    else gExp += amount;
                }
            });
            setSummary({ 
                income: inc, expense: exp, balance: inc - exp,
                lillahIncome: lInc, lillahExpense: lExp, 
                generalIncome: gInc, generalExpense: gExp 
            });
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchReports();
    }, [startDate, endDate, typeFilter, fundFilter, filterBranch]);

    const handleExportExcel = () => {
        const worksheetData = transactions.map(t => ({
            "তারিখ": format(new Date(t.transaction_date), 'dd/MM/yyyy'),
            "ধরণ": t.type === 'income' ? 'আয়' : 'ব্যয়',
            "ফান্ড": t.fund_type === 'lillah' ? 'লিল্লাহ' : 'জেনারেল',
            "খাত": t.categories?.name || 'অন্যান্য',
            "বিবরণ": t.description || '-',
            "পরিমাণ (৳)": t.amount
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Report");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
        saveAs(data, `মাদ্রাসা_হিসাব_রিপোর্ট_${startDate}_to_${endDate}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(16);
        doc.text("Rahima Jannat Mohila Madrasah", 14, 15);
        doc.setFontSize(11);
        doc.text(`Financial Report: ${startDate} to ${endDate}`, 14, 22);
        
        // Summary Table
        autoTable(doc, {
            head: [['Total Income', 'Total Expense', 'Net Balance']],
            body: [[`${summary.income} BDT`, `${summary.expense} BDT`, `${summary.balance} BDT`]],
            startY: 28,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] }
        });

        // Transactions Table
        const tableColumn = ["Date", "Type", "Fund", "Category", "Description", "Amount"];
        const tableRows = transactions.map(t => [
            format(new Date(t.transaction_date), 'dd/MM/yyyy'),
            t.type.toUpperCase(),
            t.fund_type?.toUpperCase() || 'GENERAL',
            t.categories?.name || '-',
            (t.description || '-').substring(0, 30),
            t.amount
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            // @ts-ignore
            startY: doc.lastAutoTable.finalY + 10,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [52, 73, 94] }
        });

        doc.save(`Madrasah_Report_${startDate}_to_${endDate}.pdf`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" /> আর্থিক রিপোর্ট
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">মাদ্রাসার আয়-ব্যয়ের বিস্তারিত প্রতিবেদন ও ডাউনলোড</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportPDF} className="text-red-600 border-red-200 hover:bg-red-50" title="PDF Download">
                        <Download className="w-4 h-4 mr-2" /> PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportExcel} className="text-green-600 border-green-200 hover:bg-green-50" title="Excel Export">
                        <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="rounded-2xl shadow-sm border-0 bg-white">
                <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col md:flex-row gap-3 items-end">
                        <div className="w-full md:w-auto space-y-1.5 flex-1">
                            <label className="text-xs font-bold text-gray-600">শাখা (মাদ্রাসা)</label>
                            <Select value={filterBranch} onValueChange={setFilterBranch}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="সকল শাখা"/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">সকল শাখা</SelectItem>
                                    {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full md:w-auto space-y-1.5 flex-1">
                            <label className="text-xs font-bold text-gray-600">শুরুর তারিখ</label>
                            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9" />
                        </div>
                        <div className="w-full md:w-auto space-y-1.5 flex-1">
                            <label className="text-xs font-bold text-gray-600">শেষ তারিখ</label>
                            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9" />
                        </div>
                        <div className="w-full md:w-auto space-y-1.5 flex-1">
                            <label className="text-xs font-bold text-gray-600">ধরণ</label>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="h-9"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">সব লেনদেন</SelectItem>
                                    <SelectItem value="income">শুধুমাত্র আয়</SelectItem>
                                    <SelectItem value="expense">শুধুমাত্র ব্যয়</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full md:w-auto space-y-1.5 flex-1">
                            <label className="text-xs font-bold text-gray-600">ফান্ড</label>
                            <Select value={fundFilter} onValueChange={setFundFilter}>
                                <SelectTrigger className="h-9"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">সব ফান্ড</SelectItem>
                                    <SelectItem value="general">জেনারেল ফান্ড</SelectItem>
                                    <SelectItem value="lillah">লিল্লাহ ফান্ড</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={fetchReports} className="bg-indigo-600 hover:bg-indigo-700 h-9 w-full md:w-auto px-6">
                            <Filter className="w-4 h-4 mr-2" /> খুঁজুন
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="rounded-2xl border-l-[3px] border-l-green-500 shadow-sm col-span-2 md:col-span-1">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-500">মোট আয়</p>
                                <h3 className="text-lg sm:text-xl font-bold text-green-700">৳ {toBengaliNumber(summary.income)}</h3>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-green-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="rounded-2xl border-l-[3px] border-l-red-500 shadow-sm col-span-2 md:col-span-1">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-500">মোট ব্যয়</p>
                                <h3 className="text-lg sm:text-xl font-bold text-red-700">৳ {toBengaliNumber(summary.expense)}</h3>
                            </div>
                            <ArrowDownRight className="w-5 h-5 text-red-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-l-[3px] border-l-indigo-500 shadow-sm col-span-2 md:col-span-2 bg-indigo-50/30">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center h-full">
                            <div>
                                <p className="text-xs font-bold text-gray-500">বর্তমান স্থিতি (ব্যালেন্স)</p>
                                <h3 className={`text-xl sm:text-2xl font-bold ${summary.balance >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>
                                    ৳ {toBengaliNumber(summary.balance)}
                                </h3>
                            </div>
                            <Scale className="w-8 h-8 text-indigo-400 opacity-30" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions List */}
            <Card className="rounded-2xl shadow-sm border-0">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-bold">এই সময়ে কোনো লেনদেন নেই</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader className="bg-gray-50/80">
                                        <TableRow>
                                            <TableHead className="w-[100px]">তারিখ</TableHead>
                                            <TableHead>ধরণ</TableHead>
                                            <TableHead>ফান্ড</TableHead>
                                            <TableHead>খাত</TableHead>
                                            <TableHead>বিবরণ</TableHead>
                                            <TableHead className="text-right">পরিমাণ (৳)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map(t => (
                                            <TableRow key={t.id} className="hover:bg-gray-50/50">
                                                <TableCell className="text-sm font-medium text-gray-600">
                                                    {format(new Date(t.transaction_date), 'dd/MM/yy')}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={t.type === 'income' ? 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200' : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'}>
                                                        {t.type === 'income' ? 'আয়' : 'ব্যয়'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {t.fund_type === 'lillah' 
                                                        ? <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">লিল্লাহ</span>
                                                        : <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">জেনারেল</span>}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-700">{t.categories?.name || '-'}</TableCell>
                                                <TableCell className="text-sm text-gray-500 max-w-[250px] truncate">{t.description || '-'}</TableCell>
                                                <TableCell className={`text-right font-bold ${t.type === 'income' ? 'text-green-700' : 'text-red-600'}`}>
                                                    {t.type === 'income' ? '+' : '-'} {toBengaliNumber(t.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden divide-y">
                                {transactions.map(t => (
                                    <div key={t.id} className="p-3 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <Badge className={`text-[10px] px-1 py-0 h-4 border-none ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {t.type === 'income' ? 'আয়' : 'ব্যয়'}
                                                </Badge>
                                                <span className="font-bold text-gray-800 text-sm">{t.categories?.name || 'খাত নেই'}</span>
                                            </div>
                                            <span className={`font-bold text-sm ${t.type === 'income' ? 'text-green-700' : 'text-red-600'}`}>
                                                {t.type === 'income' ? '+' : '-'} {toBengaliNumber(t.amount)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end mt-2">
                                            <p className="text-xs text-gray-500 truncate pr-2 max-w-[70%]">{t.description || 'কোনো বিবরণ নেই'}</p>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[10px] text-gray-400">{format(new Date(t.transaction_date), 'dd MMM yyyy')}</span>
                                                {t.fund_type === 'lillah' && <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1 rounded">লিল্লাহ</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
