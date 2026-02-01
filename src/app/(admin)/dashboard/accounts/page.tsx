"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, Plus, Search, DollarSign, CheckCircle, 
  Trash2, Printer, Filter, Users, ArrowRight, 
  ArrowDownCircle, ArrowUpCircle, PieChart, FileText, History, ArrowLeft, Eye, ImageIcon, X, Scissors 
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

// --- বাংলা কনভার্সন ---
const toBengaliNumber = (num: string | number) => {
  if (!num && num !== 0) return "";
  const english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const bengali = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (char) => bengali[parseInt(char)]);
};

// --- সংখ্যা থেকে কথায় রূপান্তর (Advanced) ---
const convertNumberToBanglaWords = (amount: number) => {
    const ones = ["", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়"];
    const tens = ["", "দশ", "বিশ", "ত্রিশ", "চল্লিশ", "পঞ্চাশ", "ষাট", "সত্তর", "আশি", "নব্বই"];
    const teens = ["দশ", "এগারো", "বারো", "তেরো", "চৌদ্দ", "পনেরো", "ষোল", "সতেরো", "আঠারো", "ঊনিশ"];

    const convertTens = (n: number): string => {
        if (n < 10) return ones[n];
        if (n >= 10 && n < 20) return teens[n - 10];
        const t = Math.floor(n / 10);
        const o = n % 10;
        return tens[t] + (o > 0 ? " " + ones[o] : "");
    };

    const convertHundreds = (n: number): string => {
        if (n > 99) {
            return ones[Math.floor(n / 100)] + "শত " + convertTens(n % 100);
        }
        return convertTens(n);
    };

    if (amount === 0) return "শূন্য";

    let words = "";
    const crore = Math.floor(amount / 10000000);
    amount %= 10000000;
    const lakh = Math.floor(amount / 100000);
    amount %= 100000;
    const thousand = Math.floor(amount / 1000);
    amount %= 1000;
    const hundred = amount;

    if (crore > 0) words += convertHundreds(crore) + " কোটি ";
    if (lakh > 0) words += convertHundreds(lakh) + " লক্ষ ";
    if (thousand > 0) words += convertHundreds(thousand) + " হাজার ";
    if (hundred > 0) words += convertHundreds(hundred);

    return words.trim() + " টাকা মাত্র";
};

const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const feeTypes = ["মাসিক বেতন", "পরীক্ষার ফি", "ভর্তি ফি", "সেশন ফি", "খাবার খরচ", "সিট ভাড়া", "জরিমানা", "বিবিধ"];

export default function AccountsPage() {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // --- View Mode State ---
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');

  // --- List View State ---
  const [studentList, setStudentList] = useState<any[]>([]);
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [listSearch, setListSearch] = useState("");
  const [listLoading, setListLoading] = useState(false);

  // --- Collection State ---
  const [studentResult, setStudentResult] = useState<any>(null);
  const [studentDues, setStudentDues] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [selectedDues, setSelectedDues] = useState<string[]>([]);
  const [isCollecting, setIsCollecting] = useState(false);

  // --- Custom Fee Modal ---
  const [isCustomFeeOpen, setIsCustomFeeOpen] = useState(false);
  const [customFee, setCustomFee] = useState({ title: "", amount: "" });

  // --- Receipt State ---
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  // --- Fee Setup & Expense State ---
  const [setupData, setSetupData] = useState({ branch: "all", class: "all", type: "residential", feeType: feeTypes[0], month: months[new Date().getMonth()], year: "2026", amount: "" });
  const [expenseData, setExpenseData] = useState({ category: "", amount: "", desc: "", date: new Date().toISOString().split('T')[0], fund: "general" });
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Reports State ---
  const [transactions, setTransactions] = useState<any[]>([]);
  const [reportSummary, setReportSummary] = useState({ income: 0, expense: 0, balance: 0, lillah: 0 });

  // --- Print Handler ---
  const handlePrintReceipt = () => {
    window.print();
  };

  useEffect(() => {
    fetchInitialData();
    fetchTransactions();
  }, []);

  // Fetch student list when filters change
  useEffect(() => {
    if (viewMode === 'list') {
        const timeoutId = setTimeout(() => {
            fetchStudentList();
        }, 500); 
        return () => clearTimeout(timeoutId);
    }
  }, [filterBranch, filterClass, listSearch, viewMode]);

  const fetchInitialData = async () => {
    const { data: b } = await supabase.from("branches").select("id, name, address");
    if (b) setBranches(b);
    
    const { data: c } = await supabase.from("academic_classes").select("name").eq("is_active", true);
    if (c) setClasses(Array.from(new Set(c.map((i: any) => i.name))).map(name => ({ name })));

    const { data: cat } = await supabase.from("categories").select("*").eq("is_active", true);
    if (cat) setCategories(cat);
  };

  const fetchStudentList = async () => {
      setListLoading(true);
      let query = supabase.from("students").select("id, student_id, name_bn, class_name, roll_no, father_mobile, photo_url, branch_id").eq("status", "active").order("roll_no", { ascending: true }).limit(50);

      if (filterBranch !== "all") query = query.eq("branch_id", parseInt(filterBranch));
      if (filterClass !== "all") query = query.eq("class_name", filterClass);
      
      if (listSearch) {
          query = query.or(`name_bn.ilike.%${listSearch}%,student_id.eq.${listSearch},roll_no.eq.${listSearch}`);
      }

      const { data, error } = await query;
      if (!error && data) {
          setStudentList(data);
      }
      setListLoading(false);
  };

  const fetchTransactions = async () => {
    const { data } = await supabase.from("transactions").select("*, categories(name)").order("transaction_date", { ascending: false }).limit(50);
    
    if (data) {
        setTransactions(data);
        let inc = 0, exp = 0, lil = 0;
        data.forEach((t: any) => {
            if(t.type === 'income') { inc += t.amount; if(t.fund_type === 'lillah') lil += t.amount; }
            else { exp += t.amount; if(t.fund_type === 'lillah') lil -= t.amount; }
        });
        setReportSummary({ income: inc, expense: exp, balance: inc - exp, lillah: lil });
    }
  };

  const refreshStudentDetails = async (studentIdStr: string) => {
      const { data: dues } = await supabase.from("payments").select("*").eq("student_id", studentIdStr).eq("status", "due").order("created_at");
      if(dues) setStudentDues(dues);

      const { data: hist } = await supabase.from("payments").select("*").eq("student_id", studentIdStr).eq("status", "paid").order("payment_date", { ascending: false }).limit(20);
      if(hist) setPaymentHistory(hist);
  };

  const handleSelectStudent = async (student: any) => {
      setLoading(true);
      const { data: std } = await supabase.from("students").select("*").eq("id", student.id).single();
      const currentStudent = std || student;
      setStudentResult(currentStudent);

      if (currentStudent) {
          await refreshStudentDetails(currentStudent.student_id);
      }

      setSelectedDues([]);
      setViewMode('details');
      setLoading(false);
  };

  const handleAddCustomFee = async () => {
      if(!customFee.title || !customFee.amount || !studentResult) return;
      setLoading(true);
      const { error } = await supabase.from("payments").insert({
          student_id: studentResult.student_id,
          title: customFee.title,
          amount: parseInt(customFee.amount),
          status: 'due'
      });
      if(!error) {
          setCustomFee({ title: "", amount: "" });
          setIsCustomFeeOpen(false);
          await refreshStudentDetails(studentResult.student_id);
      }
      setLoading(false);
  };

  const handleCollectPayment = async () => {
      if(selectedDues.length === 0) return alert("ফি নির্বাচন করুন");

      setIsCollecting(true);
      try {
          const paidDate = new Date().toISOString().split('T')[0];
          const feesToPay = studentDues.filter(d => selectedDues.includes(d.id));
          const totalAmount = feesToPay.reduce((sum, item) => sum + item.amount, 0);

          await supabase.from("payments").update({ status: 'paid', payment_date: paidDate }).in("id", selectedDues);

          const { data: { user } } = await supabase.auth.getUser();
          const categoryId = categories.find(c => c.name.includes("বেতন"))?.id || 1; 

          const transactionsPayload = feesToPay.map(fee => ({
              branch_id: studentResult.branch_id,
              category_id: categoryId, 
              student_id: studentResult.student_id,
              amount: fee.amount,
              description: fee.title,
              transaction_date: new Date(),
              type: 'income',
              fund_type: 'general',
              created_by: user?.id
          }));

          await supabase.from("transactions").insert(transactionsPayload);

          setReceiptData({
              invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
              date: new Date(),
              student: studentResult,
              fees: feesToPay,
              total: totalAmount,
              paymentMethod: "Cash" // Default to Cash for now
          });
          
          setIsReceiptOpen(true);
          setSelectedDues([]);
          
          await Promise.all([
              refreshStudentDetails(studentResult.student_id),
              fetchTransactions()
          ]);

      } catch (err: any) {
          alert("এরর: " + err.message);
      } finally {
          setIsCollecting(false);
      }
  };

  const handlePrintHistory = (payment: any) => {
      setReceiptData({
          invoiceNo: `INV-H${payment.id.slice(0,5).toUpperCase()}`,
          date: payment.payment_date || new Date(),
          student: studentResult,
          fees: [{ title: payment.title, amount: payment.amount }],
          total: payment.amount,
          paymentMethod: "Cash"
      });
      setIsReceiptOpen(true);
  };

  const handleFeeGeneration = async () => {
      if(!setupData.amount) return alert("টাকার পরিমাণ দিন");
      setIsProcessing(true);
      const title = `${setupData.feeType} - ${setupData.month} ${setupData.year}`;
      
      try {
        let query = supabase.from("students").select("student_id").eq("status", "active");
        if(setupData.branch !== 'all') query = query.eq("branch_id", parseInt(setupData.branch));
        if(setupData.class !== 'all') query = query.eq("class_name", setupData.class);
        if(setupData.type !== 'all') {
            if(setupData.type === 'residential') query = query.ilike('residential_status', '%residential%'); 
            else query = query.not('residential_status', 'ilike', '%residential%');
        }

        const { data: students } = await query;
        if(!students || students.length === 0) throw new Error("কোনো শিক্ষার্থী পাওয়া যায়নি");

        const payload = students.map(s => ({
            student_id: s.student_id,
            title,
            amount: parseInt(setupData.amount),
            status: 'due'
        }));

        const { error } = await supabase.from("payments").insert(payload);
        if(error) throw error;
        alert(`${students.length} জন শিক্ষার্থীর ফি জেনারেট হয়েছে!`);

      } catch (err: any) { alert(err.message); }
      setIsProcessing(false);
  };

  const handleSaveExpense = async () => {
      if(!expenseData.category || !expenseData.amount) return alert("তথ্য দিন");
      setIsProcessing(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("transactions").insert({
          category_id: parseInt(expenseData.category),
          amount: parseInt(expenseData.amount),
          description: expenseData.desc,
          transaction_date: expenseData.date,
          type: 'expense',
          fund_type: expenseData.fund,
          created_by: user?.id
      });
      
      if(!error) {
          alert("খরচ এন্ট্রি সফল!");
          setExpenseData({ ...expenseData, amount: "", desc: "" });
          fetchTransactions();
      }
      setIsProcessing(false);
  };

  // --- Single Receipt Component for Reuse ---
  const ReceiptTemplate = ({ data, copyType }: { data: any, copyType: string }) => {
      const branchName = branches.find(b => b.id === data?.student?.branch_id)?.name || 'Main Branch';
      // If branch has address in DB, use it, else default
      // Note: Assuming 'branches' state has 'address' if fetched in fetchInitialData
      const branchAddress = branches.find(b => b.id === data?.student?.branch_id)?.address || "Holidhani Bazar, Jhenaidah Sadar";

      return (
        <div className="relative border-2 border-green-800 p-6 h-[135mm] box-border overflow-hidden bg-white mb-8">
             {/* Watermark */}
             <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none z-0">
                 <img src="/images/logo.png" alt="" className="w-64 h-64 object-contain grayscale" onError={(e) => e.currentTarget.style.display = 'none'} />
             </div>

             {/* PAID SEAL (Z-INDEX 50) - positioned center */}
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-4 border-red-600 text-red-600 font-black text-6xl px-6 py-2 -rotate-12 opacity-20 z-50 pointer-events-none rounded-xl tracking-[0.5rem] print:opacity-30">
                 PAID
             </div>

             <div className="relative z-10 h-full flex flex-col justify-between">
                 {/* Header */}
                 <div className="text-center">
                     <div className="flex flex-col items-center gap-1 mb-1">
                        <div className="h-6 w-full relative mb-1">
                            <Image src="/images/bismillah.svg" alt="Bismillah" fill className="object-contain" />
                        </div>
                        <div className="h-12 w-full relative">
                            <Image src="/images/long_logo.svg" alt="Logo" fill className="object-contain" priority />
                        </div>
                        <p className="text-xs font-semibold text-gray-600 mt-1">{branchAddress}</p>
                     </div>
                     
                     <div className="border-b border-green-800 w-full my-1"></div>
                     
                     <div className="flex justify-between items-end mt-1">
                        <div className="text-xs">
                            <span className="font-bold">রসিদ নং:</span> {data?.invoiceNo}
                        </div>
                        <div className="border-2 border-black px-4 py-0.5 rounded text-sm font-bold uppercase tracking-wider bg-gray-100">
                            MONEY RECEIPT
                        </div>
                        <div className="text-xs">
                            <span className="font-bold">তারিখ:</span> {data && format(new Date(data.date), 'dd/MM/yyyy')}
                        </div>
                     </div>
                 </div>

                 {/* Student Info - Compact 2 Lines */}
                 <div className="mt-2 text-xs font-medium text-black">
                     <div className="flex gap-4">
                         <span className="flex-1"><span className="font-bold">আইডি:</span> {toBengaliNumber(data?.student?.student_id)}</span>
                         <span className="flex-1"><span className="font-bold">শ্রেণি:</span> {data?.student?.class_name}</span>
                         <span className="flex-1 text-right"><span className="font-bold">রোল:</span> {toBengaliNumber(data?.student?.roll_no)}</span>
                     </div>
                     <div className="flex gap-4 mt-1">
                         <span className="flex-[1.5]"><span className="font-bold">নাম:</span> {data?.student?.name_bn}</span>
                         <span className="flex-1"><span className="font-bold">পিতা:</span> {data?.student?.father_name_bn}</span>
                         <span className="flex-1 text-right"><span className="font-bold">মাতা:</span> {data?.student?.mother_name_bn}</span>
                     </div>
                     <div className="flex gap-4 mt-1">
                         <span className="flex-1"><span className="font-bold">শাখা:</span> {branchName}</span>
                         <span className="flex-1 text-right"><span className="font-bold">পেমেন্ট মেথড:</span> {data?.paymentMethod}</span>
                     </div>
                 </div>

                 {/* Table */}
                 <div className="flex-1 mt-2">
                     <table className="w-full border-collapse border border-gray-400 text-xs">
                         <thead className="bg-gray-100 print:bg-gray-100 print-color-exact">
                             <tr>
                                 <th className="border border-gray-400 px-2 py-1 w-10 text-center">নং</th>
                                 <th className="border border-gray-400 px-2 py-1 text-left">বিবরণ</th>
                                 <th className="border border-gray-400 px-2 py-1 w-24 text-right">টাকা</th>
                             </tr>
                         </thead>
                         <tbody>
                             {data?.fees.map((fee: any, i: number) => (
                                 <tr key={i}>
                                     <td className="border border-gray-400 px-2 py-1 text-center">{toBengaliNumber(i + 1)}</td>
                                     <td className="border border-gray-400 px-2 py-1">{fee.title}</td>
                                     <td className="border border-gray-400 px-2 py-1 text-right">{toBengaliNumber(fee.amount)}/-</td>
                                 </tr>
                             ))}
                             {/* Empty rows to fill space if few items */}
                             {Array.from({ length: Math.max(0, 3 - (data?.fees.length || 0)) }).map((_, i) => (
                                 <tr key={`empty-${i}`}>
                                     <td className="border border-gray-400 px-2 py-1">&nbsp;</td>
                                     <td className="border border-gray-400 px-2 py-1"></td>
                                     <td className="border border-gray-400 px-2 py-1"></td>
                                 </tr>
                             ))}
                         </tbody>
                         <tfoot>
                             <tr className="bg-gray-50 font-bold print:bg-gray-50 print-color-exact">
                                 <td colSpan={2} className="border border-gray-400 px-2 py-1 text-right">সর্বমোট:</td>
                                 <td className="border border-gray-400 px-2 py-1 text-right">{toBengaliNumber(data?.total)}/-</td>
                             </tr>
                         </tfoot>
                     </table>
                     
                     <div className="mt-1 text-xs font-medium border-b border-dotted pb-1">
                        <span className="font-bold">কথায়:</span> <span className="italic ml-1">{convertNumberToBanglaWords(data?.total || 0)}</span>
                     </div>
                 </div>

                 {/* Footer */}
                 <div className="mt-4 pt-1">
                     <div className="flex justify-between items-end">
                         <div className="text-center">
                             <div className="w-24 border-t border-black border-dashed mb-0.5"></div>
                             <p className="text-[10px]">আদায়কারী</p>
                         </div>
                         <div className="text-center">
                             <div className="border border-black px-2 py-0.5 rounded text-[10px] font-bold">
                                 {copyType}
                             </div>
                         </div>
                         <div className="text-center">
                             <div className="w-24 border-t border-black border-dashed mb-0.5"></div>
                             <p className="text-[10px]">কর্তৃপক্ষ</p>
                         </div>
                     </div>
                     <div className="text-center text-[8px] text-gray-400 mt-1">
                         Software Generated Receipt | RJMM
                     </div>
                 </div>
             </div>
        </div>
      );
  };

  return (
    <div className="space-y-6 p-4 md:p-8 bg-gray-50 min-h-screen font-[Kalpurush]">
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          <StatCard title="মোট আয়" amount={reportSummary.income} icon={ArrowDownCircle} color="green" />
          <StatCard title="মোট ব্যয়" amount={reportSummary.expense} icon={ArrowUpCircle} color="red" />
          <StatCard title="বর্তমান স্থিতি" amount={reportSummary.balance} icon={DollarSign} color="blue" />
          <StatCard title="লিল্লাহ ফান্ড" amount={reportSummary.lillah} icon={PieChart} color="purple" />
      </div>

      <Tabs defaultValue="collection" className="w-full print:hidden">
        <TabsList className="grid w-full grid-cols-3 bg-white border h-14 mb-6 p-1 rounded-lg">
            <TabsTrigger value="collection" className="font-bold">ফি আদায় (Collection)</TabsTrigger>
            <TabsTrigger value="setup" className="font-bold">ফি নির্ধারণ (Setup)</TabsTrigger>
            <TabsTrigger value="expense" className="font-bold">ব্যয় ব্যবস্থাপনা</TabsTrigger>
        </TabsList>

        <TabsContent value="collection">
            {viewMode === 'list' && (
                <Card className="border-t-4 border-t-green-600 shadow-sm">
                    <CardHeader className="pb-4 bg-gray-50/50">
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                             <div>
                                 <CardTitle className="text-xl flex items-center gap-2 text-gray-800"><Users className="w-5 h-5 text-green-600"/> শিক্ষার্থী খুঁজুন ও পেমেন্ট নিন</CardTitle>
                                 <CardDescription>শাখা ও শ্রেণি অনুযায়ী তালিকা দেখুন</CardDescription>
                             </div>
                         </div>
                         <div className="flex flex-col md:flex-row gap-4 mt-4">
                             <div className="w-full md:w-1/4">
                                <Select value={filterBranch} onValueChange={setFilterBranch}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="শাখা" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">সব শাখা</SelectItem>
                                        {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                             </div>
                             <div className="w-full md:w-1/4">
                                <Select value={filterClass} onValueChange={setFilterClass}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="শ্রেণি" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">সব শ্রেণি</SelectItem>
                                        {classes.map((c, i) => <SelectItem key={i} value={c.name}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                             </div>
                             <div className="w-full md:w-1/2 relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400"/>
                                <Input placeholder="নাম, আইডি বা রোল নম্বর দিয়ে খুঁজুন..." className="pl-9 bg-white" value={listSearch} onChange={(e) => setListSearch(e.target.value)}/>
                             </div>
                         </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="rounded-md border-t border-gray-100">
                             {listLoading ? (
                                 <div className="p-20 text-center flex justify-center"><Loader2 className="animate-spin text-green-600"/></div>
                             ) : studentList.length === 0 ? (
                                 <div className="p-20 text-center text-gray-400">কোনো শিক্ষার্থী পাওয়া যায়নি</div>
                             ) : (
                                 <Table>
                                     <TableHeader className="bg-gray-50">
                                         <TableRow>
                                             <TableHead className="w-[80px]">ছবি</TableHead>
                                             <TableHead>নাম ও আইডি</TableHead>
                                             <TableHead>শ্রেণি</TableHead>
                                             <TableHead>শাখা</TableHead>
                                             <TableHead>মোবাইল</TableHead>
                                             <TableHead className="text-right">অ্যাকশন</TableHead>
                                         </TableRow>
                                     </TableHeader>
                                     <TableBody>
                                         {studentList.map((std) => (
                                             <TableRow key={std.id} className="hover:bg-green-50/50 transition-colors cursor-pointer" onClick={() => handleSelectStudent(std)}>
                                                 <TableCell>
                                                     <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden border relative">
                                                         {std.photo_url ? (
                                                            <Image src={std.photo_url} alt="" fill className="object-cover" sizes="40px"/>
                                                         ) : (
                                                            <div className="flex h-full items-center justify-center text-xs text-gray-500 font-bold">{std.name_bn?.[0]}</div>
                                                         )}
                                                     </div>
                                                 </TableCell>
                                                 <TableCell>
                                                     <div className="font-bold text-gray-800">{std.name_bn}</div>
                                                     <div className="text-xs text-gray-500 font-mono">ID: {std.student_id} | Roll: {std.roll_no}</div>
                                                 </TableCell>
                                                 <TableCell>{std.class_name}</TableCell>
                                                 <TableCell><Badge variant="outline" className="text-xs font-normal">{branches.find(b => b.id === std.branch_id)?.name || "N/A"}</Badge></TableCell>
                                                 <TableCell className="font-mono text-xs">{std.father_mobile}</TableCell>
                                                 <TableCell className="text-right"><Button size="sm" variant="outline" className="border-green-200 text-green-700 hover:bg-green-100 h-8 text-xs gap-1"><Eye className="w-3 h-3"/> সিলেক্ট করুন</Button></TableCell>
                                             </TableRow>
                                         ))}
                                     </TableBody>
                                 </Table>
                             )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {viewMode === 'details' && studentResult && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-in fade-in slide-in-from-right-4">
                    <div className="xl:col-span-4 space-y-6">
                        <Button variant="ghost" onClick={() => setViewMode('list')} className="text-gray-500 hover:text-gray-800 mb-2 p-0 h-auto hover:bg-transparent flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4"/> তালিকায় ফিরে যান
                        </Button>
                        <Card className="bg-green-50/50 border-green-100">
                            <CardContent className="pt-6 text-center">
                                <div className="h-24 w-24 mx-auto bg-white rounded-full overflow-hidden mb-3 border-4 border-white shadow-sm relative">
                                    {studentResult.photo_url ? <Image src={studentResult.photo_url} alt="Student" fill className="object-cover" sizes="96px"/> : <div className="h-full w-full flex items-center justify-center bg-gray-200"><ImageIcon className="text-gray-400 w-8 h-8" /></div>}
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">{studentResult.name_bn}</h3>
                                <div className="flex justify-center gap-2 mt-2 mb-4">
                                    <Badge variant="outline" className="bg-white">ID: {toBengaliNumber(studentResult.student_id)}</Badge>
                                    <Badge className="bg-green-600">Roll: {toBengaliNumber(studentResult.roll_no)}</Badge>
                                </div>
                                <div className="text-sm text-left bg-white p-4 rounded-lg border border-gray-200 space-y-2">
                                    <p className="flex justify-between"><span>শ্রেণি:</span> <span className="font-bold">{studentResult.class_name}</span></p>
                                    <p className="flex justify-between"><span>পিতা:</span> <span className="font-bold">{studentResult.father_name_bn}</span></p>
                                    <p className="flex justify-between"><span>মোবাইল:</span> <span className="font-mono font-bold">{toBengaliNumber(studentResult.father_mobile)}</span></p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="xl:col-span-8">
                        <Tabs defaultValue="dues" className="w-full">
                            <TabsList className="w-full justify-start border-b rounded-none p-0 h-auto bg-transparent">
                                <TabsTrigger value="dues" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:text-green-700 px-6 py-3">বকেয়া ফিস ({toBengaliNumber(studentDues.length)})</TabsTrigger>
                                <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:text-green-700 px-6 py-3">পরিশোধিত ইতিহাস</TabsTrigger>
                            </TabsList>

                            <TabsContent value="dues" className="mt-4">
                                <Card>
                                    <div className="p-4 flex justify-between items-center bg-gray-50 border-b">
                                        <h3 className="font-bold text-gray-700">জমা নেওয়ার জন্য সিলেক্ট করুন</h3>
                                        <Button size="sm" variant="outline" onClick={() => setIsCustomFeeOpen(true)}><Plus className="w-4 h-4 mr-1"/> নতুন ফি যোগ</Button>
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[50px]"><Checkbox checked={selectedDues.length === studentDues.length && studentDues.length > 0} onCheckedChange={(c) => setSelectedDues(c ? studentDues.map(d=>d.id) : [])} /></TableHead>
                                                    <TableHead>বিবরণ</TableHead>
                                                    <TableHead className="text-right">পরিমাণ</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {studentDues.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-green-600">কোনো বকেয়া নেই!</TableCell></TableRow> : 
                                                studentDues.map(due => (
                                                    <TableRow key={due.id} className={selectedDues.includes(due.id) ? "bg-green-50" : ""}>
                                                        <TableCell><Checkbox checked={selectedDues.includes(due.id)} onCheckedChange={() => setSelectedDues(prev => prev.includes(due.id) ? prev.filter(x=>x!==due.id) : [...prev, due.id])} /></TableCell>
                                                        <TableCell className="font-medium">{due.title}</TableCell>
                                                        <TableCell className="text-right font-bold">৳ {toBengaliNumber(due.amount)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                                        <div><p className="text-sm text-gray-500">মোট নির্বাচিত</p><p className="text-2xl font-bold text-green-700">৳ {toBengaliNumber(studentDues.filter(d => selectedDues.includes(d.id)).reduce((a, b) => a + b.amount, 0))}</p></div>
                                        <Button onClick={handleCollectPayment} disabled={isCollecting || selectedDues.length === 0} className="bg-green-700 hover:bg-green-800 px-8 h-12 text-lg">{isCollecting ? <Loader2 className="animate-spin"/> : <span className="flex items-center gap-2"><DollarSign className="w-5"/> পেমেন্ট নিন</span>}</Button>
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="history" className="mt-4">
                                <Card>
                                    <div className="max-h-[500px] overflow-y-auto">
                                        <Table>
                                            <TableHeader><TableRow><TableHead>তারিখ</TableHead><TableHead>বিবরণ</TableHead><TableHead className="text-right">পরিমাণ</TableHead><TableHead className="text-right">রিসিট</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {paymentHistory.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-400">কোনো পেমেন্ট হিস্ট্রি নেই</TableCell></TableRow> : 
                                                paymentHistory.map(h => (
                                                    <TableRow key={h.id}>
                                                        <TableCell className="font-mono text-xs">{format(new Date(h.payment_date), 'dd MMM yyyy')}</TableCell>
                                                        <TableCell>{h.title}</TableCell>
                                                        <TableCell className="text-right font-bold text-gray-600">৳ {toBengaliNumber(h.amount)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button size="sm" variant="ghost" onClick={() => handlePrintHistory(h)} title="রিসিট প্রিন্ট"><Printer className="w-4 h-4 text-gray-500 hover:text-green-600"/></Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            )}
        </TabsContent>

        <TabsContent value="setup">
            <Card className="border-t-4 border-t-blue-600 max-w-4xl mx-auto">
                <CardHeader><CardTitle>বাল্ক ফি জেনারেশন</CardTitle><CardDescription>একাধিক শিক্ষার্থীর জন্য একযোগে ফি সেট করুন</CardDescription></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="font-bold text-sm">শাখা</label><Select value={setupData.branch} onValueChange={v=>setSetupData({...setupData, branch: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">সব</SelectItem>{branches.map(b=><SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><label className="font-bold text-sm">শ্রেণি</label><Select value={setupData.class} onValueChange={v=>setSetupData({...setupData, class: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">সব</SelectItem>{classes.map((c,i)=><SelectItem key={i} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><label className="font-bold text-sm">ফি এর ধরণ</label><Select value={setupData.feeType} onValueChange={v=>setSetupData({...setupData, feeType: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{feeTypes.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><label className="font-bold text-sm">পরিমাণ</label><Input type="number" value={setupData.amount} onChange={e=>setSetupData({...setupData, amount: e.target.value})} placeholder="0.00" /></div>
                    <Button onClick={handleFeeGeneration} disabled={isProcessing} className="col-span-full bg-blue-600 hover:bg-blue-700">{isProcessing ? <Loader2 className="animate-spin"/> : "ফি জেনারেট করুন"}</Button>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="expense">
             <Card className="border-t-4 border-t-red-600 max-w-4xl mx-auto">
                <CardHeader><CardTitle>খরচ এন্ট্রি</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="font-bold text-sm">খাত</label><Select value={expenseData.category} onValueChange={v=>setExpenseData({...expenseData, category: v})}><SelectTrigger><SelectValue placeholder="সিলেক্ট"/></SelectTrigger><SelectContent>{categories.filter(c=>c.type==='expense').map(c=><SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><label className="font-bold text-sm">পরিমাণ</label><Input type="number" value={expenseData.amount} onChange={e=>setExpenseData({...expenseData, amount: e.target.value})} /></div>
                    <div className="space-y-2 col-span-full"><label className="font-bold text-sm">বিবরণ</label><Input value={expenseData.desc} onChange={e=>setExpenseData({...expenseData, desc: e.target.value})} /></div>
                    <Button onClick={handleSaveExpense} disabled={isProcessing} className="col-span-full bg-red-600 hover:bg-red-700">{isProcessing ? <Loader2 className="animate-spin"/> : "খরচ সেভ করুন"}</Button>
                </CardContent>
             </Card>
        </TabsContent>
      </Tabs>

      {/* --- MODALS --- */}
      <Dialog open={isCustomFeeOpen} onOpenChange={setIsCustomFeeOpen}>
          <DialogContent className="sm:max-w-[400px]">
              <DialogHeader><DialogTitle>নতুন ফি যোগ করুন</DialogTitle><DialogDescription>শিক্ষার্থীর জন্য একটি নতুন ফি এন্ট্রি করুন।</DialogDescription></DialogHeader>
              <div className="space-y-4 py-2">
                  <div className="space-y-1"><label className="text-sm font-medium">ফি-এর নাম</label><Input placeholder="যেমন: টিসি ফি" value={customFee.title} onChange={e => setCustomFee({...customFee, title: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">পরিমাণ</label><Input type="number" placeholder="500" value={customFee.amount} onChange={e => setCustomFee({...customFee, amount: e.target.value})} /></div>
                  <Button onClick={handleAddCustomFee} disabled={loading} className="w-full bg-green-600">{loading ? <Loader2 className="animate-spin"/> : "যুক্ত করুন"}</Button>
              </div>
          </DialogContent>
      </Dialog>

      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
          <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden print:hidden">
              <div className="bg-green-600 p-6 text-center text-white">
                  <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm"><CheckCircle className="w-10 h-10 text-white" /></div>
                  <DialogTitle className="text-2xl font-bold text-white text-center">পেমেন্ট সফল হয়েছে!</DialogTitle>
                  <DialogDescription className="text-green-100 mt-1 text-center">লেনদেন সম্পন্ন হয়েছে</DialogDescription>
              </div>
              <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div><p className="text-xs text-gray-500 font-bold uppercase">ইনভয়েস নম্বর</p><p className="text-lg font-mono font-bold text-gray-800">{receiptData?.invoiceNo}</p></div>
                      <div className="text-right"><p className="text-xs text-gray-500 font-bold uppercase">মোট জমা</p><p className="text-xl font-bold text-green-700">৳ {toBengaliNumber(receiptData?.total)}</p></div>
                  </div>
                  <div className="space-y-2">
                      <p className="text-sm font-bold text-gray-700">জমা বিবরণ:</p>
                      <ul className="text-sm text-gray-600 space-y-1 pl-2 max-h-32 overflow-y-auto">
                          {receiptData?.fees.map((f: any, i: number) => (
                              <li key={i} className="flex justify-between border-b border-dashed border-gray-200 pb-1 last:border-0"><span>{f.title}</span><span className="font-medium">৳ {toBengaliNumber(f.amount)}</span></li>
                          ))}
                      </ul>
                  </div>
              </div>
              <DialogFooter className="p-4 bg-gray-50 border-t flex justify-between gap-3">
                  <Button variant="outline" onClick={() => setIsReceiptOpen(false)} className="flex-1">বন্ধ করুন</Button>
                  <Button onClick={handlePrintReceipt} className="flex-1 bg-green-700 hover:bg-green-800 gap-2 font-bold shadow-sm"><Printer className="w-4 h-4"/> রিসিট প্রিন্ট করুন</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* --- HIDDEN PRINT TEMPLATE (FULL PAD STYLE - 2 Copies) --- */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999]">
         <div id="receipt-print-area" className="p-8 font-sans text-black bg-white mx-auto relative h-full box-border" style={{ width: "210mm", height: "297mm" }}>
             
             {/* Receipt 1: Office Copy */}
             <ReceiptTemplate data={receiptData} copyType="অফিস কপি" />
             
             {/* Dashed Separator */}
             <div className="w-full border-b-2 border-dashed border-gray-400 my-4 relative">
                 <div className="absolute left-1/2 -top-3 transform -translate-x-1/2 bg-white px-2 text-gray-500">
                     <Scissors className="w-6 h-6 rotate-90" />
                 </div>
             </div>

             {/* Receipt 2: Student Copy */}
             <ReceiptTemplate data={receiptData} copyType="গ্রাহক কপি" />

         </div>
      </div>
      
      {/* Print CSS */}
      <style jsx global>{`
        @media print {
            body * { visibility: hidden; }
            #receipt-print-area, #receipt-print-area * { visibility: visible; }
            #receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; }
            @page { size: A4; margin: 0; }
            .print-color-exact { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

    </div>
  );
}

// --- Helper Components ---
const StatCard = ({ title, amount, icon: Icon, color }: any) => (
    <Card className={`border-l-4 border-${color}-600`}>
        <CardContent className="p-4 flex justify-between items-center">
            <div><p className="text-xs font-bold text-gray-500 uppercase">{title}</p><h3 className={`text-2xl font-bold text-${color}-700`}>৳ {toBengaliNumber(amount)}</h3></div>
            <div className={`p-2 rounded-full bg-${color}-50 text-${color}-600`}><Icon className="w-6 h-6"/></div>
        </CardContent>
    </Card>
);