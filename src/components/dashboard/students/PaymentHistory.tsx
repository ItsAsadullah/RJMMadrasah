"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, Download, FileText, X } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import PaymentSlip from "@/components/dashboard/accounts/PaymentSlip";
import html2canvas from "html2canvas";
import { useReactToPrint } from "react-to-print";
import StudentPaymentReport from "@/components/dashboard/accounts/StudentPaymentReport";

const toBengaliNumber = (num: any) => String(num).replace(/[0-9]/g, c => "০১২৩৪৫৬৭৮৯"[parseInt(c)]);

export default function PaymentHistory({ studentId }: { studentId: string }) {
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState<any[]>([]);
    const [student, setStudent] = useState<any>(null);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    const getTxId = (p: any) => String(p?.transaction_id ?? p?.tx_id ?? p?.reference ?? p?.id ?? "");
    const selectedTxId = getTxId(selectedPayment);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Receipt_${selectedTxId || "doc"}`,
        onAfterPrint: () => console.log("Printed")
    });

    const handlePrintReport = useReactToPrint({
        contentRef: reportRef,
        documentTitle: `Payment_Report_${student?.student_id || 'Print'}`,
        suppressErrors: true
    });

    async function fetchData() {
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
    }

    useEffect(() => {
      fetchData();
    }, [studentId]);

    const [savingImage, setSavingImage] = useState(false);

    const handleSaveImage = async () => {
        const studentCopyNode = document.getElementById("student-copy-area");
        if (!studentCopyNode) {
            alert("রসিদ খুজে পাওয়া যায়নি!");
            return;
        }
        
        try {
            setSavingImage(true);
            const canvas = await html2canvas(studentCopyNode, { 
                useCORS: true, 
                backgroundColor: '#ffffff'
            });
            const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
            const link = document.createElement("a");
            link.download = `Receipt_${selectedTxId ? selectedTxId.slice(0, 6) : "doc"}.jpg`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error("Error saving image:", error);
            alert("ছবি সেভ করতে সমস্যা হয়েছে।");
        } finally {
            setSavingImage(false);
        }
    };

    if (loading) return <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-green-600"/></div>;
    if (payments.length === 0) return <div className="text-center py-10 text-gray-400 border rounded-xl p-10 bg-gray-50">কোনো পেমেন্ট ইতিহাস পাওয়া যায়নি</div>;

    const groupedPayments = Object.values(payments.reduce((acc: any, payment) => {
        const txId = getTxId(payment);
        const txIdShort = txId ? txId.slice(0, 8).toUpperCase() : "-";
        
        let desc = payment.description || "ফি পেমেন্ট";
        const receiptMatch = desc.match(/রসিদ:\s*(INV-\d+)/);
        let receiptNo = receiptMatch ? receiptMatch[1] : txIdShort;
        
        if (!acc[receiptNo]) {
            acc[receiptNo] = {
                receiptNo,
                date: payment.created_at,
                payment_method: payment.payment_method,
                txId: txId,
                items: [],
                total: 0
            };
        }
        
        desc = desc.split(" | রসিদ:")[0];
        acc[receiptNo].items.push({
            description: desc,
            amount: payment.amount
        });
        acc[receiptNo].total += Number(payment.amount || 0);
        
        return acc;
    }, {})).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <>
      <div className="space-y-6 relative">
         {/* Action Buttons */}
         <div className="flex justify-end absolute -top-14 right-0">
             {payments.length > 0 && (
                 <Button onClick={() => setReportModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                     <FileText className="w-4 h-4 mr-2" /> পেমেন্ট রিপোর্ট
                 </Button>
             )}
         </div>

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
                    {groupedPayments.map((group: any, idx) => {
                        return (
                        <TableRow key={group.receiptNo || String(idx)}>
                             <TableCell className="text-sm font-mono text-gray-600">{group.date ? format(new Date(group.date), 'dd/MM/yyyy') : '-'}</TableCell>
                             <TableCell className="font-medium text-gray-800">
                                 {group.items.map((item: any, i: number) => {
                                     let titlePart = item.description;
                                     let subPart = "";
                                     if (item.description.includes("|||")) {
                                         const parts = item.description.split("|||");
                                         titlePart = parts[0].trim();
                                         subPart = parts[1].trim();
                                     }
                                     return (
                                         <div key={i} className={i > 0 ? "mt-2 pt-2 border-t border-gray-100" : ""}>
                                             <div className="font-bold">{titlePart}</div>
                                             {subPart && <div className="text-xs text-gray-500 font-normal mt-0.5">{subPart}</div>}
                                         </div>
                                     );
                                 })}
                             </TableCell>
                             <TableCell><span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs">{group.payment_method || 'cash'}</span></TableCell>
                            <TableCell className="font-mono text-xs text-gray-500">{group.receiptNo}</TableCell>
                             <TableCell className="text-right font-bold text-green-600">৳ {toBengaliNumber(group.total)}</TableCell>
                             <TableCell className="text-right">
                                 <Dialog>
                                     <DialogTrigger asChild>
                                         <Button size="sm" variant="outline" className="h-8 gap-2" onClick={() => setSelectedPayment(group)}>
                                             <Printer className="w-3 h-3"/> রসিদ
                                         </Button>
                                     </DialogTrigger>
                                     <DialogContent className="max-w-[900px] w-[95vw] max-h-[90vh] flex flex-col overflow-hidden p-0 bg-gray-100">
                                         <div className="bg-white border-b p-4 flex justify-between items-center print:hidden shrink-0 z-10 shadow-sm">
                                             <DialogTitle className="font-bold text-lg">মানি রসিদ প্রিভিউ</DialogTitle>
                                             <div className="flex gap-2">
                                                 <Button variant="outline" onClick={handleSaveImage} disabled={savingImage} className="text-emerald-700 border-emerald-200">
                                                     {savingImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Download className="w-4 h-4 mr-2"/>}
                                                     সেভ করুন (JPG)
                                                 </Button>
                                                 <Button onClick={() => handlePrint()} className="bg-blue-600 hover:bg-blue-700">
                                                     <Printer className="w-4 h-4 mr-2"/> প্রিন্ট করুন
                                                 </Button>
                                                 <Button variant="ghost" size="icon" onClick={() => setSelectedPayment(null)} className="text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-full ml-1">
                                                     <X className="w-5 h-5"/>
                                                 </Button>
                                             </div>
                                         </div>
                                         <div className="p-4 sm:p-8 print:p-0 flex justify-center overflow-auto flex-1 bg-gray-100/50 custom-scrollbar">
                                                 {student && selectedPayment && (
                                                     <PaymentSlip 
                                                         ref={printRef}
                                                         student={student} 
                                                         fees={selectedPayment.items.map((i: any) => ({ description: i.description, amount: i.amount }))} 
                                                         total={selectedPayment.total} 
                                                         invoiceNo={selectedPayment.receiptNo}
                                                         date={selectedPayment.date}
                                                         paymentMethod={selectedPayment.payment_method || "cash"}
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
                        {student && (
                            <StudentPaymentReport 
                                ref={reportRef}
                                student={student}
                                transactions={payments}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
      </>
    );
}
