"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import PaymentSlip from "@/components/dashboard/accounts/PaymentSlip";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useReactToPrint } from "react-to-print";

const toBengaliNumber = (num: any) => String(num).replace(/[0-9]/g, c => "০১২৩৪৫৬৭৮৯"[parseInt(c)]);

export default function PaymentHistory({ studentId }: { studentId: string }) {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const getTxId = (p: any) => String(p?.transaction_id ?? p?.tx_id ?? p?.reference ?? p?.id ?? "");
  const selectedTxId = getTxId(selectedPayment);

  const handlePrint = useReactToPrint({
      contentRef: printRef,
      documentTitle: `Receipt_${selectedTxId || "doc"}`,
      onAfterPrint: () => console.log("Printed")
  });

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    setLoading(true);
    // Fetch Student Info
    const { data: stu } = await supabase.from("students").select("*").eq("student_id", studentId).single();
    if (stu) setStudent(stu);

    // Fetch Transactions
    // Trying to match by student_id (custom ID) as used in FeeCollection
    const { data: trans } = await supabase.from("transactions")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });
      
    if (trans) setPayments(trans);
    setLoading(false);
  };

  const handleDownloadPDF = async () => {
      const element = document.getElementById("payment-slip");
      if(!element) return;
      
      try {
          const canvas = await html2canvas(element, { scale: 2, useCORS: true } as any);
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF("p", "mm", "a4");
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
          pdf.save(`Receipt_${selectedTxId ? selectedTxId.slice(0, 6) : "doc"}.pdf`);
      } catch (error) {
          console.error("PDF Gen Error", error);
      }
  };

  if (loading) return <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-green-600"/></div>;
  if (payments.length === 0) return <div className="text-center py-10 text-gray-400 border rounded-xl p-10 bg-gray-50">কোনো পেমেন্ট ইতিহাস পাওয়া যায়নি</div>;

  return (
    <div className="space-y-6">
       {/* Summary Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-green-50 p-4 rounded-xl border border-green-100">
               <p className="text-xs font-bold text-green-600 uppercase">মোট পরিশোধিত</p>
               <h3 className="text-2xl font-bold text-green-700">৳ {toBengaliNumber(payments.reduce((sum, p) => sum + (p.type === 'income' ? p.amount : 0), 0))}</h3>
           </div>
           <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
               <p className="text-xs font-bold text-blue-600 uppercase">সর্বশেষ পেমেন্ট</p>
               <h3 className="text-2xl font-bold text-blue-700">৳ {toBengaliNumber(payments[0]?.amount || 0)}</h3>
               <p className="text-xs text-blue-400 mt-1">{payments[0] ? format(new Date(payments[0].created_at), 'dd MMM yyyy') : '-'}</p>
           </div>
       </div>

       {/* Table */}
       <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
           <Table>
               <TableHeader className="bg-gray-50">
                   <TableRow>
                       <TableHead>তারিখ</TableHead>
                       <TableHead>বিবরণ</TableHead>
                       <TableHead>পেমেন্ট মেথড</TableHead>
                       <TableHead>ট্রানজেকশন আইডি</TableHead>
                       <TableHead className="text-right">পরিমাণ</TableHead>
                       <TableHead className="text-right">রসিদ</TableHead>
                   </TableRow>
               </TableHeader>
              <TableBody>
                  {payments.map((payment, idx) => {
                      const txId = getTxId(payment);
                      const txIdShort = txId ? txId.slice(0, 8).toUpperCase() : "-";
                      return (
                      <TableRow key={txId || String(idx)}>
                           <TableCell className="font-mono text-gray-600">{format(new Date(payment.created_at), 'dd/MM/yyyy')}</TableCell>
                           <TableCell className="font-medium text-gray-800">{payment.description}</TableCell>
                           <TableCell><span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs">{payment.payment_method || 'Cash'}</span></TableCell>
                          <TableCell className="font-mono text-xs text-gray-500">{txIdShort}</TableCell>
                           <TableCell className="text-right font-bold text-green-600">৳ {toBengaliNumber(payment.amount)}</TableCell>
                           <TableCell className="text-right">
                               <Dialog>
                                   <DialogTrigger asChild>
                                       <Button size="sm" variant="outline" className="h-8 gap-2" onClick={() => setSelectedPayment(payment)}>
                                           <Printer className="w-3 h-3"/> রসিদ
                                       </Button>
                                   </DialogTrigger>
                                   <DialogContent className="max-w-[220mm] w-full max-h-[95vh] overflow-y-auto p-0 bg-gray-100">
                                       <div className="sticky top-0 z-50 bg-white border-b p-4 flex justify-between items-center print:hidden">
                                           <h3 className="font-bold">মানি রসিদ প্রিভিউ</h3>
                                           <div className="flex gap-2">
                                               <Button variant="outline" onClick={handleDownloadPDF}><Download className="w-4 h-4 mr-2"/> Download PDF</Button>
                                               <Button onClick={() => handlePrint()}><Printer className="w-4 h-4 mr-2"/> Print</Button>
                                           </div>
                                       </div>
                                       <div className="p-8 print:p-0 flex justify-center">
                                            {student && selectedPayment && (
                                                <PaymentSlip 
                                                    ref={printRef}
                                                    student={student} 
                                                    fees={[{ title: selectedPayment.description, amount: selectedPayment.amount }]} 
                                                    total={selectedPayment.amount} 
                                                    invoiceNo={`INV-${selectedTxId ? selectedTxId.slice(0, 6).toUpperCase() : "DOC"}`} 
                                                    date={selectedPayment.created_at} 
                                                />
                                            )}
                                       </div>
                                   </DialogContent>
                               </Dialog>
                           </TableCell>
                       </TableRow>
                      );
                  })}
               </TableBody>
           </Table>
       </div>
    </div>
  );
}
