"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Search, Printer, DollarSign, Eye, Download, FileSpreadsheet, History } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReactToPrint } from "react-to-print";
import PaymentSlip from "@/components/dashboard/accounts/PaymentSlip";

const toBengaliNumber = (num: any) => String(num).replace(/[0-9]/g, c => "০১২৩৪৫৬৭৮৯"[parseInt(c)]);

export default function FeeCollection() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'paid', 'due'

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [dues, setDues] = useState<any[]>([]);
  const [selectedDues, setSelectedDues] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [paidHistory, setPaidHistory] = useState<any[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
      contentRef: printRef,
      documentTitle: `Receipt_${receiptData?.invoiceNo || 'doc'}`,
      onAfterPrint: () => console.log("Printed")
  });

  // Stats
  const [totalDue, setTotalDue] = useState(0);

  // Initial Data & Filter Logic
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [search, filterBranch, filterClass, filterStatus]);

  const fetchInitialData = async () => {
    const { data: b } = await supabase.from("branches").select("id, name");
    if(b) setBranches(b);
    
    // Fetch unique classes
    const { data: c } = await supabase.from("students").select("class_name").eq("status", "active");
    if(c) {
        // @ts-ignore
        const uniqueClasses = Array.from(new Set(c.map(i => i.class_name))).filter(Boolean).sort();
        // @ts-ignore
        setClasses(uniqueClasses);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    let query = supabase.from("students")
        .select(`
            id, name_bn, student_id, roll_no, class_name, branch_id, father_name_bn, photo_url,
            student_dues!student_id(amount, paid_amount, status)
        `)
        .eq("status", "active")
        .order("roll_no", { ascending: true });

    if(search) {
        query = query.or(`name_bn.ilike.%${search}%,student_id.eq.${search}`);
    }
    if(filterBranch !== "all") {
        query = query.eq("branch_id", parseInt(filterBranch));
    }
    if(filterClass !== "all") {
        query = query.eq("class_name", filterClass);
    }

    const { data } = await query;
    if(data) {
        // Process data to calculate total due per student
        const processed = data.map((s: any) => {
            const totalDueAmount = s.student_dues
                .filter((d: any) => d.status !== 'paid')
                .reduce((sum: number, d: any) => sum + (d.amount - (d.paid_amount || 0)), 0);
            return { ...s, totalDue: totalDueAmount };
        });

        // Filter by Status if needed
        let filtered = processed;
        if(filterStatus === 'due') {
            filtered = processed.filter((s: any) => s.totalDue > 0);
        } else if (filterStatus === 'paid') {
            filtered = processed.filter((s: any) => s.totalDue === 0);
        }

        setStudents(filtered);
        setTotalDue(filtered.reduce((sum: number, s: any) => sum + s.totalDue, 0));
    }
    setLoading(false);
  };

  const [activeTab, setActiveTab] = useState("dues");

  const handleSelectStudent = async (student: any, tab = "dues") => {
    setSelectedStudent(student);
    if(tab) setActiveTab(tab);
    setLoading(true);
    // Fetch Dues
    const { data } = await supabase.from("student_dues")
      .select("*, fee_structures(class_name, department)")
      .eq("student_id", student.id)
      .neq("status", "paid")
      .order("created_at");
    
    if(data) setDues(data);
    setSelectedDues([]);

    // Fetch History
    // Fix: status check should be consistent. Some rows might be 'Paid' or 'paid'. 
    // Also ensuring we fetch all relevant fields.
    const { data: paidData } = await supabase.from("student_dues")
      .select("*, fee_structures(class_name, department)")
      .eq("student_id", student.id)
      .eq("status", "paid")
      .order("updated_at", { ascending: false });
    
    // Fallback if no paid data found with exact match, try case insensitive or check paid_amount > 0
    if(!paidData || paidData.length === 0) {
        const { data: paidDataFallback } = await supabase.from("student_dues")
            .select("*, fee_structures(class_name, department)")
            .eq("student_id", student.id)
            .gt("paid_amount", 0)
            .order("updated_at", { ascending: false });
            
        if(paidDataFallback) setPaidHistory(paidDataFallback);
    } else {
        setPaidHistory(paidData);
    }

    setLoading(false);
  };

  const handleDownloadReceipt = async (receiptContentId: string, filename: string) => {
      const element = document.getElementById(receiptContentId);
      if(!element) return;
      
      try {
          const canvas = await html2canvas(element, { scale: 2 } as any);
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF("p", "mm", "a4");
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
          pdf.save(`${filename}.pdf`);
      } catch (error) {
          console.error("PDF Gen Error", error);
          alert("রসিদ ডাউনলোড করতে সমস্যা হয়েছে");
      }
  };

  const handleHistoryReceipt = (item: any) => {
      // Create a temporary receipt data for viewing/downloading
      setReceiptData({
          student: selectedStudent,
          fees: [item],
          total: item.amount,
          invoiceNo: `REC-${item.id.slice(0,6).toUpperCase()}`,
          date: new Date(item.updated_at || item.created_at)
      });
  };

  const handleCollect = async () => {
    if(selectedDues.length === 0) return;
    setCollecting(true);
    
    try {
       const feesToPay = dues.filter(d => selectedDues.includes(d.id));
       const total = feesToPay.reduce((acc, curr) => acc + curr.amount, 0);
       
       // 1. Update Dues Status
       await supabase.from("student_dues")
         .update({ status: 'paid', paid_amount: total, updated_at: new Date() }) 
         .in("id", selectedDues);

       // 2. Create Transaction
       const { data: { user } } = await supabase.auth.getUser();
       
       const transactions = feesToPay.map(fee => ({
           branch_id: selectedStudent.branch_id,
           category_id: 1, 
           student_id: selectedStudent.student_id, 
           amount: fee.amount,
           description: fee.title,
           type: 'income',
           fund_type: 'general',
           created_by: user?.id,
           due_id: fee.id
       }));
       
       await supabase.from("transactions").insert(transactions);

       // 3. Receipt Data
       setReceiptData({
           student: selectedStudent,
           fees: feesToPay,
           total: total,
           invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
           date: new Date()
       });

       // Refresh
       handleSelectStudent(selectedStudent);
       fetchStudents(); // Refresh list stats

    } catch (e) { console.error(e); alert("Failed"); }
    setCollecting(false);
  };

  // Export Functions
  const exportPDF = () => {
      const doc = new jsPDF();
      doc.text("Student Due List Report", 14, 10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 16);
      
      const tableColumn = ["ID", "Name", "Class", "Roll", "Total Due"];
      const tableRows = students.map(s => [
          s.student_id,
          s.name_bn,
          s.class_name,
          s.roll_no || '-',
          s.totalDue
      ]);
  
      autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 25,
      });
      doc.save("student_due_list.pdf");
  };

  const exportExcel = () => {
      const worksheet = XLSX.utils.json_to_sheet(students.map(s => ({
          ID: s.student_id,
          Name: s.name_bn,
          Class: s.class_name,
          Roll: s.roll_no,
          "Total Due": s.totalDue,
          "Father Name": s.father_name_bn
      })));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
      saveAs(data, "student_due_list.xlsx");
  };

  return (
    <div className="space-y-6">
      
      {/* Stats Summary */}
      {!selectedStudent && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white border-l-4 border-l-red-500 shadow-sm">
                  <CardContent className="p-4">
                      <p className="text-xs font-bold text-gray-500 uppercase">সর্বমোট বকেয়া</p>
                      <h3 className="text-2xl font-bold text-red-600">৳ {toBengaliNumber(totalDue)}</h3>
                  </CardContent>
              </Card>
              <Card className="bg-white border-l-4 border-l-blue-500 shadow-sm">
                  <CardContent className="p-4">
                      <p className="text-xs font-bold text-gray-500 uppercase">মোট শিক্ষার্থী (বকেয়া সহ)</p>
                      <h3 className="text-2xl font-bold text-blue-600">{toBengaliNumber(students.filter(s=>s.totalDue>0).length)} জন</h3>
                  </CardContent>
              </Card>
          </div>
      )}

      <Card>
          <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                  <CardTitle>ফি সংগ্রহ ও বকেয়া তালিকা</CardTitle>
                  {!selectedStudent && (
                      <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={exportPDF} title="PDF Download"><Download className="w-4 h-4 mr-1"/> PDF</Button>
                          <Button variant="outline" size="sm" onClick={exportExcel} title="Excel Export"><FileSpreadsheet className="w-4 h-4 mr-1"/> Excel</Button>
                      </div>
                  )}
              </div>
          </CardHeader>
          <CardContent>
              {!selectedStudent ? (
                  <>
                    <div className="flex flex-col md:flex-row gap-4 mb-6 bg-gray-50 p-4 rounded-lg border">
                        <div className="w-full md:w-1/4">
                            <label className="text-xs font-bold text-gray-500 mb-1 block">শাখা</label>
                            <Select value={filterBranch} onValueChange={setFilterBranch}>
                                <SelectTrigger className="bg-white"><SelectValue placeholder="শাখা" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">সব শাখা</SelectItem>
                                    {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full md:w-1/4">
                            <label className="text-xs font-bold text-gray-500 mb-1 block">শ্রেণি</label>
                            <Select value={filterClass} onValueChange={setFilterClass}>
                                <SelectTrigger className="bg-white"><SelectValue placeholder="শ্রেণি" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">সব শ্রেণি</SelectItem>
                                    {classes.map((c, i) => <SelectItem key={i} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full md:w-1/4">
                            <label className="text-xs font-bold text-gray-500 mb-1 block">পেমেন্ট স্ট্যাটাস</label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="bg-white"><SelectValue placeholder="স্ট্যাটাস" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">সব</SelectItem>
                                    <SelectItem value="due">বকেয়া আছে</SelectItem>
                                    <SelectItem value="paid">পরিশোধিত</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="relative w-full md:w-1/4">
                            <label className="text-xs font-bold text-gray-500 mb-1 block">সার্চ</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4"/>
                                <Input placeholder="নাম বা আইডি..." className="pl-9 bg-white" value={search} onChange={e=>setSearch(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-100">
                                <TableRow>
                                    <TableHead className="w-[50px]">#</TableHead>
                                    <TableHead>শিক্ষার্থী</TableHead>
                                    <TableHead>শ্রেণি ও রোল</TableHead>
                                    <TableHead>শাখা</TableHead>
                                    <TableHead className="text-right">মোট বকেয়া</TableHead>
                                    <TableHead className="text-right">অ্যাকশন</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-green-600"/></TableCell></TableRow>
                                ) : students.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-10 text-gray-400">কোনো তথ্য পাওয়া যায়নি</TableCell></TableRow>
                                ) : (
                                    students.map((s, idx) => (
                                        <TableRow key={s.id} className="hover:bg-green-50/50 cursor-pointer group" onClick={() => handleSelectStudent(s)}>
                                            <TableCell className="font-mono text-gray-500">{toBengaliNumber(idx + 1)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {s.photo_url ? (
                                                        <img
                                                            src={s.photo_url}
                                                            alt={s.name_bn || "Student"}
                                                            className="h-10 w-10 rounded-full object-cover border border-gray-200 bg-white"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-base text-green-700">
                                                            {s.name_bn?.[0] || "?"}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-bold text-gray-800 group-hover:text-green-700">{s.name_bn}</div>
                                                        <div className="text-xs text-gray-500 font-mono">ID: {s.student_id}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{s.class_name}</div>
                                                <div className="text-xs text-gray-500">Roll: {s.roll_no || '-'}</div>
                                            </TableCell>
                                            <TableCell><Badge variant="outline" className="font-normal">{branches.find(b => b.id === s.branch_id)?.name || 'N/A'}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                {s.totalDue > 0 ? (
                                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 font-bold">৳ {toBengaliNumber(s.totalDue)}</Badge>
                                                ) : (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">পরিশোধিত</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right flex justify-end gap-2">
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleSelectStudent(s, 'dues')} title="View Dues">
                                                    <Eye className="w-4 h-4 text-gray-400 group-hover:text-green-600"/>
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleSelectStudent(s, 'history'); }} title="Payment History">
                                                    <History className="w-4 h-4 text-gray-400 group-hover:text-blue-600"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                  </>
              ) : (
                  // Selected Student View (Payment Collection)
                  <div className="animate-in fade-in slide-in-from-right-4">
                      <div className="bg-green-50 p-4 rounded-lg flex justify-between items-center mb-6 border border-green-100 shadow-sm">
                          <div className="flex items-center gap-4">
                              <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center font-bold text-xl text-green-700 border-2 border-green-200">
                                  {selectedStudent.name_bn?.[0]}
                              </div>
                              <div>
                                  <h3 className="font-bold text-lg text-gray-800">{selectedStudent.name_bn}</h3>
                                  <p className="text-sm text-gray-600 font-mono">ID: {selectedStudent.student_id} | Class: {selectedStudent.class_name} | Roll: {selectedStudent.roll_no}</p>
                              </div>
                          </div>
                          <Button variant="outline" onClick={() => { setSelectedStudent(null); setDues([]); }}>তালিকায় ফিরে যান</Button>
                      </div>

                      {loading ? <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto"/></div> : (
                          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                              <TabsList className="grid w-full grid-cols-2 mb-6">
                                  <TabsTrigger value="dues">বকেয়া সমূহ ({dues.length})</TabsTrigger>
                                  <TabsTrigger value="history">পেমেন্ট হিস্টোরি ({paidHistory.length})</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="dues">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              <div className="lg:col-span-2 space-y-4">
                                  <h4 className="font-bold text-gray-700 flex items-center gap-2"><DollarSign className="w-4 h-4"/> বকেয়া ফিস সমূহ</h4>
                                  <div className="border rounded-lg overflow-hidden">
                                      <Table>
                                          <TableHeader className="bg-gray-50">
                                              <TableRow>
                                                  <TableHead className="w-[50px]"><Checkbox checked={selectedDues.length===dues.length && dues.length>0} onCheckedChange={(c) => setSelectedDues(c ? dues.map(d=>d.id) : [])} /></TableHead>
                                                  <TableHead>বিবরণ</TableHead>
                                                  <TableHead>মাসের নাম</TableHead>
                                                  <TableHead className="text-right">পরিমাণ</TableHead>
                                              </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                              {dues.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-green-600">কোনো বকেয়া নেই! সব পরিশোধিত।</TableCell></TableRow> : 
                                              dues.map(d => (
                                                  <TableRow key={d.id} className={selectedDues.includes(d.id) ? "bg-green-50" : ""}>
                                                      <TableCell><Checkbox checked={selectedDues.includes(d.id)} onCheckedChange={() => setSelectedDues(p => p.includes(d.id) ? p.filter(x=>x!==d.id) : [...p, d.id])} /></TableCell>
                                                      <TableCell className="font-medium">
                                                          {d.title}
                                                          <div className="text-[10px] text-gray-400">{d.fee_structures?.department || 'General'}</div>
                                                      </TableCell>
                                                      <TableCell className="text-xs text-gray-500">{format(new Date(d.created_at), 'MMMM yyyy')}</TableCell>
                                                      <TableCell className="text-right font-bold">৳ {toBengaliNumber(d.amount)}</TableCell>
                                                  </TableRow>
                                              ))}
                                          </TableBody>
                                      </Table>
                                  </div>
                              </div>

                              <div>
                                        <Card className="bg-green-50 border-green-200 sticky top-4">
                                            <CardContent className="p-6 space-y-4">
                                                <h4 className="font-bold text-gray-800 border-b border-green-200 pb-2">পেমেন্ট সারাংশ</h4>
                                                <div className="flex justify-between text-sm">
                                                    <span>মোট নির্বাচিত আইটেম:</span>
                                                    <span className="font-bold">{toBengaliNumber(selectedDues.length)} টি</span>
                                                </div>
                                                <div className="flex justify-between text-lg font-bold text-green-700 pt-2 border-t border-green-200">
                                                    <span>মোট টাকা:</span>
                                                    <span>৳ {toBengaliNumber(dues.filter(d=>selectedDues.includes(d.id)).reduce((a,b)=>a+b.amount,0))}</span>
                                                </div>
                                                <Button disabled={selectedDues.length===0 || collecting} onClick={handleCollect} className="w-full bg-green-700 hover:bg-green-800 h-12 text-lg shadow-md mt-4">
                                                    {collecting ? <Loader2 className="animate-spin"/> : "পেমেন্ট নিশ্চিত করুন"}
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="history">
                                  <div className="border rounded-lg overflow-hidden">
                                      <Table>
                                          <TableHeader className="bg-gray-50">
                                              <TableRow>
                                                  <TableHead>পরিশোধের তারিখ</TableHead>
                                                  <TableHead>বিবরণ</TableHead>
                                                  <TableHead className="text-right">পরিমাণ</TableHead>
                                                  <TableHead className="text-right">রসিদ</TableHead>
                                              </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                              {paidHistory.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-400">কোনো পেমেন্ট হিস্টোরি নেই</TableCell></TableRow> : 
                                              paidHistory.map(h => (
                                                  <TableRow key={h.id}>
                                                      <TableCell className="text-sm">{format(new Date(h.updated_at || h.created_at), 'dd MMM yyyy')}</TableCell>
                                                      <TableCell className="font-medium">
                                                          {h.title}
                                                          <div className="text-[10px] text-gray-400">{h.fee_structures?.department || 'General'}</div>
                                                      </TableCell>
                                                      <TableCell className="text-right font-bold text-green-600">৳ {toBengaliNumber(h.paid_amount || h.amount)}</TableCell>
                                                      <TableCell className="text-right">
                                                          <Button size="sm" variant="outline" onClick={() => handleHistoryReceipt(h)}><Download className="w-4 h-4 mr-1"/> রশিদ</Button>
                                                      </TableCell>
                                                  </TableRow>
                                              ))}
                                          </TableBody>
                                      </Table>
                                  </div>
                              </TabsContent>
                          </Tabs>
                      )}
                  </div>
              )}
          </CardContent>
      </Card>

      {/* Receipt Modal */}
      {receiptData && (
          <Dialog open={!!receiptData} onOpenChange={(o) => !o && setReceiptData(null)}>
              <DialogContent className="max-w-[220mm] w-full max-h-[95vh] overflow-y-auto p-0 bg-gray-100">
                  <div className="sticky top-0 z-50 bg-white border-b p-4 flex justify-between items-center print:hidden">
                       <DialogTitle>মানি রসিদ প্রিভিউ</DialogTitle>
                       <div className="flex gap-2">
                           <Button variant="outline" onClick={() => handleDownloadReceipt("payment-slip", `Receipt-${receiptData.invoiceNo}`)}>
                               <Download className="w-4 h-4 mr-2"/> Download PDF
                           </Button>
                           <Button onClick={() => handlePrint()}><Printer className="w-4 h-4 mr-2"/> Print</Button>
                       </div>
                  </div>
                  <div className="p-8 print:p-0 flex justify-center">
                      <PaymentSlip 
                          ref={printRef}
                          student={receiptData.student} 
                          fees={receiptData.fees} 
                          total={receiptData.total} 
                          invoiceNo={receiptData.invoiceNo} 
                          date={receiptData.date} 
                      />
                  </div>
              </DialogContent>
          </Dialog>
      )}
    </div>
  );
}
