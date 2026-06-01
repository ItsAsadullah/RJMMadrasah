import React from "react";
import { format } from "date-fns";

const toBengaliNumber = (num: any) => String(num).replace(/[0-9]/g, c => "০১২৩৪৫৬৭৮৯"[parseInt(c)]);

interface StudentPaymentReportProps {
    student: any;
    transactions: any[];
}

export default React.forwardRef<HTMLDivElement, StudentPaymentReportProps>(function StudentPaymentReport({ student, transactions }, ref) {
    const totalPaid = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return (
        <div
            ref={ref}
            className="bg-white text-black w-[210mm] mx-auto min-h-[297mm] p-[15mm] print:p-0 flex flex-col print:m-0 border border-transparent"
            style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        >
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="text-center pb-4 border-b-2 border-emerald-700 mb-6">
                    <img src="/images/bismillah.svg" alt="Bismillah" className="h-6 mx-auto mb-2 opacity-80" />
                    <img src="/images/long_logo.svg" alt="Logo" className="h-10 mx-auto mb-2" />
                    <p className="text-[12px] text-gray-700 font-medium">হলিধানী বাজার শাখা, ঝিনাইদহ</p>
                    <p className="text-[10px] text-gray-500 mt-1">মোবাইল: ০১৭১২-৩৪৫৬৭৮</p>
                    <h2 className="text-xl font-bold mt-4 bg-emerald-100 text-emerald-800 inline-block px-6 py-1.5 rounded-full border border-emerald-200">
                        শিক্ষার্থীর পেমেন্ট রিপোর্ট
                    </h2>
                </div>

                {/* Student Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-[13px]">
                        <div>
                            <div className="flex mb-2"><span className="w-20 text-gray-500">নাম</span> <span className="mr-2">:</span> <span className="font-bold">{student?.name_bn}</span></div>
                            <div className="flex mb-2"><span className="w-20 text-gray-500">আইডি</span> <span className="mr-2">:</span> <span className="font-mono">{student?.student_id}</span></div>
                            <div className="flex mb-2"><span className="w-20 text-gray-500">শ্রেণি</span> <span className="mr-2">:</span> <span>{student?.class_name}</span></div>
                        </div>
                        <div>
                            <div className="flex mb-2"><span className="w-20 text-gray-500">রোল</span> <span className="mr-2">:</span> <span>{toBengaliNumber(student?.roll_number ?? student?.roll_no ?? "") || "-"}</span></div>
                            <div className="flex mb-2"><span className="w-20 text-gray-500">শাখা</span> <span className="mr-2">:</span> <span>{student?.branch_name || student?.branches?.name || "-"}</span></div>
                            <div className="flex mb-2"><span className="w-20 text-gray-500">রিপোর্টের তারিখ</span> <span className="mr-2">:</span> <span className="font-mono">{format(new Date(), "dd/MM/yyyy")}</span></div>
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="flex-1">
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="border-b-2 border-emerald-600 bg-emerald-50 text-emerald-900">
                                <th className="py-2.5 px-3 text-left font-semibold">তারিখ</th>
                                <th className="py-2.5 px-3 text-left font-semibold">বিবরণ</th>
                                <th className="py-2.5 px-3 text-left font-semibold">রসিদ নং</th>
                                <th className="py-2.5 px-3 text-right font-semibold">পরিমাণ (৳)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-10 text-center text-gray-400 font-medium">কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি</td>
                                </tr>
                            ) : (
                                transactions.map((t) => {
                                    const receiptMatch = (t.description || "").match(/রসিদ:\s*(INV-\d+)/);
                                    const receiptNo = receiptMatch ? receiptMatch[1] : `REC-${String(t.id).padStart(6, '0')}`;
                                    const desc = (t.description || "ফি পেমেন্ট").split(" | রসিদ:")[0];
                                    
                                    return (
                                        <tr key={t.id} className="hover:bg-gray-50">
                                            <td className="py-2 px-3 text-gray-600 font-mono">
                                                {t.transaction_date ? format(new Date(t.transaction_date), "dd/MM/yyyy") : "-"}
                                            </td>
                                            <td className="py-2 px-3 font-medium text-gray-800">{desc}</td>
                                            <td className="py-2 px-3 text-gray-500 font-mono">{receiptNo}</td>
                                            <td className="py-2 px-3 text-right font-bold text-gray-900">
                                                {toBengaliNumber(t.amount)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Totals */}
                <div className="mt-8 pt-4 border-t-2 border-gray-800 flex justify-end">
                    <div className="w-64">
                        <div className="flex justify-between items-center text-lg font-bold text-green-700">
                            <span>সর্বমোট প্রদান:</span>
                            <span>৳ {toBengaliNumber(totalPaid)}</span>
                        </div>
                    </div>
                </div>
                
                {/* Signatures */}
                <div className="mt-24 pt-4 border-t border-dashed border-gray-300 flex justify-between text-[11px] text-gray-500">
                    <div>প্রস্তুতকারকের স্বাক্ষর</div>
                    <div>কর্তৃপক্ষের স্বাক্ষর</div>
                </div>
                
                <div className="mt-8 text-center text-[10px] text-gray-400">
                    এই রিপোর্টটি স্বয়ংক্রিয়ভাবে তৈরি করা হয়েছে। 
                </div>
            </div>
        </div>
    );
});
