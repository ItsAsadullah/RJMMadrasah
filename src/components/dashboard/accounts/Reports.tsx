"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Download, Printer, FileText, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Reports() {
  const [startDate, setStartDate] = useState(new Date().getFullYear() + "-01-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    let query = supabase.from("transactions")
        .select("*, categories(name), branches(name)")
        .gte("transaction_date", startDate)
        .lte("transaction_date", endDate)
        .order("transaction_date", { ascending: false });

    if(typeFilter !== 'all') {
        query = query.eq("type", typeFilter);
    }

    const { data } = await query;
    if(data) {
        setTransactions(data);
        
        // Calculate Summary
        let inc = 0, exp = 0;
        data.forEach(t => {
            if(t.type === 'income') inc += t.amount;
            else exp += t.amount;
        });
        setSummary({ income: inc, expense: exp, balance: inc - exp });
    }
    setLoading(false);
  };

  const handleExportExcel = () => {
      const worksheet = XLSX.utils.json_to_sheet(transactions.map(t => ({
          Date: format(new Date(t.transaction_date), 'dd/MM/yyyy'),
          Type: t.type,
          Category: t.categories?.name,
          Branch: t.branches?.name,
          Student: t.students?.name_bn || '-',
          Class: t.students?.class_name || '-',
          Description: t.description,
          Amount: t.amount
      })));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Report");
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
      saveAs(data, `report_${startDate}_to_${endDate}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Rahima Jannat Mohila Madrasah", 14, 10);
    doc.text(`Financial Report (${startDate} to ${endDate})`, 14, 18);
    
    const tableColumn = ["Date", "Type", "Category", "Description", "Amount"];
    const tableRows: any[] = [];

    transactions.forEach(t => {
        const transactionData = [
            format(new Date(t.transaction_date), 'dd/MM/yyyy'),
            t.type.toUpperCase(),
            t.categories?.name || '-',
            t.description || '-',
            t.amount
        ];
        tableRows.push(transactionData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 25,
    });
    
    // Summary
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY || 30;
    doc.text(`Total Income: ${summary.income}`, 14, finalY + 10);
    doc.text(`Total Expense: ${summary.expense}`, 14, finalY + 16);
    doc.text(`Net Balance: ${summary.balance}`, 14, finalY + 22);

    doc.save(`report_${startDate}_to_${endDate}.pdf`);
  };

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5"/> আর্থিক রিপোর্ট</CardTitle></CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">শুরুর তারিখ</label>
                        <Input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">শেষ তারিখ</label>
                        <Input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} />
                    </div>
                    <div className="space-y-2 w-[150px]">
                        <label className="text-sm font-medium">লেনদেনের ধরণ</label>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">সব</SelectItem>
                                <SelectItem value="income">আয়</SelectItem>
                                <SelectItem value="expense">ব্যয়</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 w-[150px]">
                        <label className="text-sm font-medium">শাখা</label>
                        <Select value={branchFilter} onValueChange={setBranchFilter}>
                            <SelectTrigger><SelectValue placeholder="শাখা" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">সব শাখা</SelectItem>
                                {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 w-[150px]">
                        <label className="text-sm font-medium">শ্রেণি</label>
                        <Select value={classFilter} onValueChange={setClassFilter}>
                            <SelectTrigger><SelectValue placeholder="শ্রেণি" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">সব শ্রেণি</SelectItem>
                                {classes.map((c, i) => <SelectItem key={i} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={fetchReports} className="bg-blue-600">ফিল্টার</Button>
                    <div className="flex-1 text-right flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={handleExportPDF} title="PDF Download"><Download className="w-4 h-4"/></Button>
                        <Button variant="outline" size="sm" onClick={handleExportExcel} title="Excel Export"><FileSpreadsheet className="w-4 h-4"/></Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                        <p className="text-sm text-green-600 font-bold">মোট আয়</p>
                        <h3 className="text-2xl font-bold text-green-700">৳ {summary.income}</h3>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                        <p className="text-sm text-red-600 font-bold">মোট ব্যয়</p>
                        <h3 className="text-2xl font-bold text-red-700">৳ {summary.expense}</h3>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <p className="text-sm text-blue-600 font-bold">স্থিতি</p>
                        <h3 className="text-2xl font-bold text-blue-700">৳ {summary.balance}</h3>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>তারিখ</TableHead>
                                <TableHead>ধরণ</TableHead>
                                <TableHead>খাত</TableHead>
                                <TableHead>শাখা</TableHead>
                                <TableHead>বিবরণ</TableHead>
                                <TableHead className="text-right">পরিমাণ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600"/></TableCell></TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10 text-gray-400">কোনো তথ্য পাওয়া যায়নি</TableCell></TableRow>
                            ) : (
                                transactions.map(t => (
                                    <TableRow key={t.id}>
                                        <TableCell>{format(new Date(t.transaction_date), 'dd MMM yyyy')}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {t.type}
                                            </span>
                                        </TableCell>
                                        <TableCell>{t.categories?.name}</TableCell>
                                        <TableCell>{t.branches?.name || 'Main'}</TableCell>
                                        <TableCell>{t.description}</TableCell>
                                        <TableCell className="text-right font-bold">৳ {t.amount}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
