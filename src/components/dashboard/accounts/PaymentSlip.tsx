import React from 'react';
import Image from "next/image";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PaymentSlipProps {
  student: any;
  fees: any[];
  total: number;
  invoiceNo: string;
  date: Date;
}

const toBengaliNumber = (num: any) => String(num).replace(/[0-9]/g, c => "০১২৩৪৫৬৭৮৯"[parseInt(c)]);

const ReceiptCopy = ({ title, student, fees, total, invoiceNo, date }: any) => (
  <div className="border-2 border-gray-800 p-8 relative h-[48%] flex flex-col justify-between">
      {/* Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none transform -rotate-45 z-0">
          <span className="text-8xl font-black text-red-500 border-8 border-red-500 p-4 rounded-xl">PAID</span>
      </div>

      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-4 relative z-10">
          <div className="text-sm font-bold mb-1">বিসমিল্লাহির রাহমানির রাহীম</div>
          <div className="flex justify-center items-center gap-4 mb-2">
              <Image src="/logo.png" width={60} height={60} alt="Logo" className="w-16 h-16"/>
              <div>
                  <h2 className="text-3xl font-bold text-green-900">রাহিমা জান্নাত মহিলা মাদ্রাসা</h2>
                  <p className="text-sm font-semibold mt-1">হোল্ডিং নং-৫২/১, রোড-৩, ব্লক-ডি, দক্ষিণ বনশ্রী, খিলগাঁও, ঢাকা-১২১৯</p>
                  <p className="text-sm font-semibold">মোবাইল: ০১৭XXXXXXXX</p>
              </div>
          </div>
          <div className="mt-2 inline-block bg-gray-900 text-white px-6 py-1 text-sm font-bold rounded-full uppercase tracking-wider">{title}</div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 text-sm mb-4 relative z-10">
          <div className="space-y-1.5">
              <div className="flex"><span className="w-20 font-bold">নাম:</span> <span>{student.name_bn}</span></div>
              <div className="flex"><span className="w-20 font-bold">আইডি:</span> <span className="font-mono">{student.student_id}</span></div>
              <div className="flex"><span className="w-20 font-bold">শ্রেণি:</span> <span>{student.class_name}</span></div>
              <div className="flex"><span className="w-20 font-bold">শাখা:</span> <span>{student.branch_id === 1 ? 'হলিধানী' : 'চাঁন্দুয়ালী'}</span></div>
          </div>
          <div className="space-y-1.5 text-right">
              <div className="flex justify-end"><span className="font-bold mr-2">রসিদ নং:</span> <span className="font-mono">{invoiceNo}</span></div>
              <div className="flex justify-end"><span className="font-bold mr-2">তারিখ:</span> <span className="font-mono">{format(new Date(date), "dd/MM/yyyy")}</span></div>
              <div className="flex justify-end"><span className="font-bold mr-2">রোল নং:</span> <span className="font-mono">{student.roll_no || '-'}</span></div>
              <div className="flex justify-end"><span className="font-bold mr-2">সেশন:</span> <span className="font-mono">{student.academic_year}</span></div>
          </div>
      </div>

      {/* Table */}
      <div className="flex-1 relative z-10">
        <Table className="border-2 border-gray-300 w-full">
            <TableHeader>
                <TableRow className="bg-gray-100 h-10 border-b-2 border-gray-300">
                    <TableHead className="h-10 py-2 text-sm font-bold text-black border-r border-gray-300 w-16 text-center">ক্রমিক</TableHead>
                    <TableHead className="h-10 py-2 text-sm font-bold text-black border-r border-gray-300">বিবরণ</TableHead>
                    <TableHead className="h-10 py-2 text-sm font-bold text-black text-right w-32">পরিমাণ (টাকা)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {fees.map((f:any, i:number) => (
                    <TableRow key={i} className="h-8 border-b border-gray-200">
                        <TableCell className="h-8 py-1 text-sm border-r border-gray-300 text-center font-mono">{toBengaliNumber(i + 1)}</TableCell>
                        <TableCell className="h-8 py-1 text-sm border-r border-gray-300">{f.description || f.title}</TableCell>
                        <TableCell className="h-8 py-1 text-sm text-right font-mono font-bold">{toBengaliNumber(f.amount)}/-</TableCell>    
                    </TableRow>
                ))}
                {/* Fill empty rows to maintain height if needed, or just let it expand */}
            </TableBody>
        </Table>
      </div>

      {/* Total */}
      <div className="flex justify-end mt-2 relative z-10">
          <div className="border-2 border-gray-800 px-4 py-2 rounded flex gap-8 items-center bg-gray-50">
              <span className="font-bold text-lg">সর্বমোট টাকা:</span>
              <span className="font-bold text-xl font-mono">৳ {toBengaliNumber(total)}/-</span>
          </div>
      </div>

      {/* Signatures */}
      <div className="mt-16 flex justify-between text-xs relative z-10">
          <div className="text-center">
              <div className="border-t-2 border-black w-40 mb-1"></div>
              <p className="font-bold">আদায়কারীর স্বাক্ষর</p>
          </div>
          <div className="text-center">
              <div className="border-t-2 border-black w-40 mb-1"></div>
              <p className="font-bold">কর্তৃপক্ষের স্বাক্ষর</p>
          </div>
      </div>
  </div>
);

export default React.forwardRef<HTMLDivElement, PaymentSlipProps>(function PaymentSlip({ student, fees, total, invoiceNo, date }, ref) {
  return (
    <div ref={ref} id="payment-slip" className="bg-white text-black w-full max-w-[210mm] mx-auto p-8 print:p-0 print:w-full h-auto min-h-[297mm] flex flex-col justify-between">
       <ReceiptCopy title="অফিস কপি" student={student} fees={fees} total={total} invoiceNo={invoiceNo} date={date} />
       
       <div className="border-b-2 border-dashed border-gray-400 my-4 flex items-center justify-center relative py-4">
           <span className="bg-white px-2 text-gray-500 text-xs absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">Cutting Line ✂</span>
       </div>

       <ReceiptCopy title="শিক্ষার্থী কপি" student={student} fees={fees} total={total} invoiceNo={invoiceNo} date={date} />
    </div>
  );
});
