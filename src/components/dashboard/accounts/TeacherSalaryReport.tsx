import React from "react";
import { format } from "date-fns";

const toBengaliNumber = (num: any) => String(num).replace(/[0-9]/g, c => "০১২৩৪৫৬৭৮৯"[parseInt(c)]);

interface TeacherSalaryReportProps {
    teacher: any;
    year: number;
    monthlyData: any[];
}

export default React.forwardRef<HTMLDivElement, TeacherSalaryReportProps>(function TeacherSalaryReport({ teacher, year, monthlyData }, ref) {
    const totalPaid = monthlyData.reduce((sum, m) => sum + m.paidAmount, 0);
    const totalDue = monthlyData.reduce((sum, m) => sum + m.dueAmount, 0);

    return (
        <div
            ref={ref}
            className="bg-white text-black w-[210mm] mx-auto min-h-[297mm] p-[15mm] print:p-0 flex flex-col print:m-0 border border-transparent"
            style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        >
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="text-center pb-4 border-b-2 border-teal-700 mb-6">
                    <img src="/images/bismillah.svg" alt="Bismillah" className="h-6 mx-auto mb-2 opacity-80" />
                    <img src="/images/long_logo.svg" alt="Logo" className="h-10 mx-auto mb-2" />
                    <p className="text-[12px] text-gray-700 font-medium">হলিধানী বাজার শাখা, ঝিনাইদহ</p>
                    <p className="text-[10px] text-gray-500 mt-1">মোবাইল: ০১৭১২-৩৪৫৬৭৮</p>
                    <h2 className="text-xl font-bold mt-4 bg-teal-100 text-teal-800 inline-block px-6 py-1.5 rounded-full border border-teal-200">
                        শিক্ষক বেতন রিপোর্ট ({toBengaliNumber(year)})
                    </h2>
                </div>

                {/* Teacher Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-[13px]">
                        <div>
                            <div className="flex mb-2"><span className="w-24 text-gray-500">নাম</span> <span className="mr-2">:</span> <span className="font-bold text-gray-900">{teacher?.name}</span></div>
                            <div className="flex mb-2"><span className="w-24 text-gray-500">পদবী</span> <span className="mr-2">:</span> <span>{teacher?.designation || "-"}</span></div>
                            <div className="flex mb-2"><span className="w-24 text-gray-500">শাখা</span> <span className="mr-2">:</span> <span>{teacher?.branches?.name || "-"}</span></div>
                        </div>
                        <div>
                            <div className="flex mb-2"><span className="w-24 text-gray-500">মোবাইল</span> <span className="mr-2">:</span> <span className="font-mono">{teacher?.phone || "-"}</span></div>
                            <div className="flex mb-2"><span className="w-24 text-gray-500">নির্ধারিত বেতন</span> <span className="mr-2">:</span> <span className="font-bold text-teal-700">৳ {toBengaliNumber(teacher?.salary_amount || 0)}</span></div>
                            <div className="flex mb-2"><span className="w-24 text-gray-500">রিপোর্টের তারিখ</span> <span className="mr-2">:</span> <span className="font-mono">{format(new Date(), "dd/MM/yyyy")}</span></div>
                        </div>
                    </div>
                </div>

                {/* Monthly Table */}
                <div className="flex-1">
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="border-b-2 border-teal-600 bg-teal-50 text-teal-900">
                                <th className="py-2.5 px-3 text-left font-semibold">মাস</th>
                                <th className="py-2.5 px-3 text-center font-semibold">স্ট্যাটাস</th>
                                <th className="py-2.5 px-3 text-center font-semibold">পেমেন্ট মেথড</th>
                                <th className="py-2.5 px-3 text-right font-semibold">প্রদান (৳)</th>
                                <th className="py-2.5 px-3 text-right font-semibold">বকেয়া (৳)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {monthlyData.map((m, idx) => (
                                <tr key={idx} className={m.paidAmount > 0 ? "hover:bg-gray-50" : "bg-red-50/20 text-gray-400"}>
                                    <td className="py-2.5 px-3 font-medium">
                                        {m.monthName}
                                        {m.paymentDates.length > 0 && (
                                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                {m.paymentDates.map((d: string) => format(new Date(d), "dd/MM")).join(", ")}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                        {m.status === 'Paid' ? (
                                            <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded text-[11px] font-bold border border-green-100">পরিশোধিত</span>
                                        ) : m.status === 'Partial' ? (
                                            <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] font-bold border border-blue-100">আংশিক</span>
                                        ) : m.status === 'Due' ? (
                                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-bold border border-amber-100">বকেয়া</span>
                                        ) : (
                                            <span className="text-gray-400 text-[11px]">-</span>
                                        )}
                                    </td>
                                    <td className="py-2.5 px-3 text-center capitalize text-xs">
                                        {m.paymentMethods.length > 0 ? Array.from(new Set(m.paymentMethods)).join(", ") : "-"}
                                    </td>
                                    <td className={`py-2.5 px-3 text-right font-bold ${m.paidAmount > 0 ? 'text-gray-900' : ''}`}>
                                        {m.paidAmount > 0 ? toBengaliNumber(m.paidAmount) : "-"}
                                    </td>
                                    <td className={`py-2.5 px-3 text-right font-bold ${m.dueAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                        {m.dueAmount > 0 ? toBengaliNumber(m.dueAmount) : "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Totals */}
                <div className="mt-8 pt-4 border-t-2 border-gray-800 flex justify-end">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between items-center text-sm font-bold text-gray-600">
                            <span>মোট বকেয়া:</span>
                            <span className="text-red-600">৳ {toBengaliNumber(totalDue)}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold text-teal-700 pt-2 border-t">
                            <span>সর্বমোট প্রদান:</span>
                            <span>৳ {toBengaliNumber(totalPaid)}</span>
                        </div>
                    </div>
                </div>
                
                {/* Signatures */}
                <div className="mt-24 pt-4 border-t border-dashed border-gray-300 flex justify-between text-[11px] text-gray-500">
                    <div>প্রস্তুতকারকের স্বাক্ষর</div>
                    <div>অধ্যক্ষের স্বাক্ষর</div>
                </div>
                
                <div className="mt-8 text-center text-[10px] text-gray-400">
                    এই রিপোর্টটি স্বয়ংক্রিয়ভাবে তৈরি করা হয়েছে। 
                </div>
            </div>
        </div>
    );
});
