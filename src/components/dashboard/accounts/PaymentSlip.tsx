import React from 'react';
import { format } from "date-fns";

interface PaymentSlipProps {
    student: any;
    fees: any[];
    total: number;
    invoiceNo: string;
    date: Date;
    paymentMethod?: string;
}

// Helper functions
const toBengaliNumber = (num: any) =>
    num != null ? String(num).replace(/[0-9]/g, c => "০১২৩৪৫৬৭৮৯"[parseInt(c)]) : "-";

const bengaliWords: { [key: number]: string } = {
  0: "শূন্য", 1: "এক", 2: "দুই", 3: "তিন", 4: "চার", 5: "পাঁচ", 6: "ছয়", 7: "সাত", 8: "আট", 9: "নয়",
  10: "দশ", 11: "এগারো", 12: "বারো", 13: "তেরো", 14: "চৌদ্দ", 15: "পনেরো", 16: "ষোলো", 17: "সতেরো", 18: "আঠারো", 19: "উনিশ",
  20: "বিশ", 21: "একুশ", 22: "বাইশ", 23: "তেইশ", 24: "চব্বিশ", 25: "পঁচিশ", 26: "ছাব্বিশ", 27: "সাতাশ", 28: "আঠাশ", 29: "উনত্রিশ",
  30: "ত্রিশ", 31: "একত্রিশ", 32: "বত্রিশ", 33: "তেত্রিশ", 34: "চৌত্রিশ", 35: "পঁয়ত্রিশ", 36: "ছত্রিশ", 37: "সাঁইত্রিশ", 38: "আটত্রিশ", 39: "উনচল্লিশ",
  40: "চল্লিশ", 41: "একচল্লিশ", 42: "বিয়াল্লিশ", 43: "তেতাল্লিশ", 44: "চুয়াল্লিশ", 45: "পঁয়তাল্লিশ", 46: "ছেচল্লিশ", 47: "সাতচল্লিশ", 48: "আটচল্লিশ", 49: "উনপঞ্চাশ",
  50: "পঞ্চাশ", 51: "একান্ন", 52: "বায়ান্ন", 53: "তিপ্পান্ন", 54: "চুয়ান্ন", 55: "পঞ্চান্ন", 56: "ছাপ্পান্ন", 57: "সাতান্ন", 58: "আটান্ন", 59: "উনষাট",
  60: "ষাট", 61: "একষট্টি", 62: "বাষট্টি", 63: "তেষট্টি", 64: "চৌষট্টি", 65: "পঁয়ষট্টি", 66: "ছেষট্টি", 67: "সাতষট্টি", 68: "আটষট্টি", 69: "উনসত্তর",
  70: "সত্তর", 71: "একাত্তর", 72: "বাহাত্তর", 73: "তিয়াত্তর", 74: "চুয়াত্তর", 75: "পঁচাত্তর", 76: "ছিয়াত্তর", 77: "সাতাত্তর", 78: "আটাত্তর", 79: "উনআশি",
  80: "আশি", 81: "একাশি", 82: "বিরাশি", 83: "তিরাশি", 84: "চুরাশি", 85: "পঁচাশি", 86: "ছিয়াশি", 87: "সাতাশি", 88: "অষ্টআশি", 89: "উননব্বই",
  90: "নব্বই", 91: "একানব্বই", 92: "বিরানব্বই", 93: "তিরানব্বই", 94: "চুরানব্বই", 95: "পঁচানব্বই", 96: "ছিয়ানব্বই", 97: "সাতানব্বই", 98: "আটানব্বই", 99: "নিরানব্বই"
};

function numberToBengaliWords(num: number): string {
    if (!num || isNaN(num)) return bengaliWords[0];
    if (num === 0) return bengaliWords[0];
    let words = '';
    
    let crore = Math.floor(num / 10000000);
    num %= 10000000;
    let lakh = Math.floor(num / 100000);
    num %= 100000;
    let thousand = Math.floor(num / 1000);
    num %= 1000;
    let hundred = Math.floor(num / 100);
    num %= 100;
    
    if (crore > 0) words += numberToBengaliWords(crore) + " কোটি ";
    if (lakh > 0) words += bengaliWords[lakh] + " লক্ষ ";
    if (thousand > 0) words += bengaliWords[thousand] + " হাজার ";
    if (hundred > 0) words += bengaliWords[hundred] + "শত ";
    if (num > 0) words += bengaliWords[num];
    
    return words.trim();
}

const getBranchName = (student: any) => (
    student?.branch_name ||
    student?.branches?.name ||
    ({ "1": "হলিধানী", "2": "চাঁন্দুয়ালী", "6": "হলিধানী বাজার শাখা", "7": "চাঁন্দুয়ালী বাজার শাখা" } as Record<string, string>)[String(student?.branch_id)] ||
    "-"
);

const getAddress = (student: any) =>
    student?.branch_address || student?.branches?.address || "হলিধানী বাজার, ঝিনাইদহ";

const getPaymentMethodBengali = (method: string) => {
    const map: Record<string, string> = {
        'cash': 'নগদ অর্থ',
        'bkash': 'বিকাশ',
        'nagad': 'নগদ',
        'rocket': 'রকেট',
        'upay': 'উপায়',
        'bank': 'ব্যাংক'
    };
    return map[method?.toLowerCase()] || method || 'নগদ অর্থ';
};

const ReceiptCopy = ({ id, title, student, fees, total, invoiceNo, date, paymentMethod }: any) => (
    <div id={id} className="h-[135mm] relative bg-white rounded-xl border border-gray-200 p-6 flex flex-col shadow-sm print:shadow-none print:border-gray-300 print:rounded-none overflow-hidden">

        {/* Top Accent Color Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-600 print:bg-emerald-600"></div>

        {/* Background Watermark */}
        <div className="absolute inset-0 flex justify-center items-center opacity-[0.04] pointer-events-none z-0">
            <img src="/images/logo.png" alt="" className="w-80 h-80 object-contain grayscale" />
        </div>

        {/* Header section */}
        {/* Header section */}
        <div className="relative z-10 flex flex-col items-center pb-3 border-b-2 border-emerald-700 mb-4">
            <div className="absolute top-0 right-0 flex flex-col items-end gap-1">
                <span className="px-3 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full print:border print:border-emerald-600">
                    {title}
                </span>
                <span className="px-2 py-0.5 bg-gray-50 text-gray-700 text-[10px] font-bold rounded border border-gray-200 tracking-widest uppercase">
                    মানি রসিদ
                </span>
            </div>
            
            <div className="mb-2">
                <img src="/images/bismillah.svg" alt="Bismillah" className="h-4 object-contain" />
            </div>
            <img src="/images/long_logo.svg" alt="Rahima Jannat Madrasa" className="h-10 object-contain mb-1" />
            
            <p className="text-[11px] text-gray-700 font-medium">{getAddress(student)}</p>
            {student?.branch_phone && (
                <p className="text-[10px] font-medium text-gray-500 flex items-center gap-1 mt-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    মোবাইল: {toBengaliNumber(student.branch_phone)}
                </p>
            )}
        </div>

        {/* Modern Info Grid */}
        <div className="relative z-10 bg-gray-50/80 rounded-lg border border-gray-100 p-4 mb-4 grid grid-cols-12 gap-4">
            <div className="col-span-7 space-y-2">
                <div className="flex text-[13px]"><span className="w-16 text-gray-500">নাম</span> <span className="mr-2 text-gray-400">:</span> <span className="font-semibold text-gray-900">{student.name_bn}</span></div>
                <div className="flex text-[13px]"><span className="w-16 text-gray-500">আইডি</span> <span className="mr-2 text-gray-400">:</span> <span className="font-mono font-medium text-gray-900">{student.student_id}</span></div>
                <div className="flex text-[13px]"><span className="w-16 text-gray-500">শ্রেণি</span> <span className="mr-2 text-gray-400">:</span> <span className="font-medium text-gray-900">{student.class_name}</span></div>
            </div>
            <div className="col-span-5 space-y-2">
                <div className="flex text-[13px]"><span className="w-16 text-gray-500">রসিদ নং</span> <span className="mr-2 text-gray-400">:</span> <span className="font-mono font-medium text-gray-900">{invoiceNo}</span></div>
                <div className="flex text-[13px]"><span className="w-16 text-gray-500">তারিখ</span> <span className="mr-2 text-gray-400">:</span> <span className="font-mono font-medium text-gray-900">{format(new Date(date), "dd/MM/yyyy")}</span></div>
                <div className="flex text-[13px]"><span className="w-16 text-gray-500">শাখা</span> <span className="mr-2 text-gray-400">:</span> <span className="font-medium text-gray-900">{getBranchName(student)}</span></div>
            </div>
        </div>

        {/* Clean Table */}
        <div className="relative z-10 flex-1">
            <table className="w-full text-[13px]">
                <thead>
                    <tr className="border-b-2 border-emerald-600 bg-emerald-50/50 text-emerald-900">
                        <th className="py-2 px-3 text-left font-semibold w-16 rounded-tl-md">ক্রমিক</th>
                        <th className="py-2 px-3 text-left font-semibold">আদায়ের বিবরণ</th>
                        <th className="py-2 px-3 text-right font-semibold w-36 rounded-tr-md">টাকার পরিমাণ</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {fees.map((f: any, i: number) => {
                        const rawDesc = f.description || f.title || "";
                        let titlePart = rawDesc;
                        let subPart = "";
                        
                        if (rawDesc.includes("|||")) {
                            const parts = rawDesc.split("|||");
                            titlePart = parts[0].trim();
                            subPart = parts[1].trim();
                        }
                        
                        return (
                        <tr key={i} className="hover:bg-gray-50/50">
                            <td className="py-2 px-3 text-left font-mono text-gray-600 align-top pt-3">{toBengaliNumber(i + 1)}</td>
                            <td className="py-2 px-3 text-left text-gray-800 align-top pt-3">
                                <div className="font-bold">{titlePart}</div>
                            </td>
                            <td className="py-2 px-3 text-right align-top pt-3">
                                {subPart ? (
                                    <div className="text-[12px] font-semibold text-gray-800 flex flex-col gap-0.5 items-end">
                                        {subPart.split("•").map((part: string, idx: number) => (
                                            <div key={idx}>{part.trim()}</div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="font-mono font-semibold text-gray-900 text-[14px]">৳ {toBengaliNumber(f.amount)}/-</div>
                                )}
                            </td>
                        </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>

        {/* Footer / Total section */}
        <div className="relative z-10 mt-4 mb-8">
            <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex-1 mr-6 flex flex-col gap-1.5">
                    <div className="flex items-end">
                        <span className="text-[12px] font-medium text-gray-500 mr-2">কথায়:</span>
                        <span className="text-[12px] font-bold text-gray-800 border-b border-dashed border-gray-400 pb-0.5 inline-block">
                            {numberToBengaliWords(total)} টাকা মাত্র।
                        </span>
                    </div>
                    {paymentMethod && (
                    <div className="flex items-center">
                        <span className="text-[12px] font-medium text-gray-500 mr-2">পেমেন্ট মেথড:</span>
                        <span className="text-[12px] font-bold text-gray-800">
                            {getPaymentMethodBengali(paymentMethod)}
                        </span>
                    </div>
                    )}
                </div>
                <div className="flex items-center gap-4 shrink-0 px-4 py-1.5 bg-emerald-600 text-white rounded-md shadow-sm">
                    <span className="text-[13px] font-medium opacity-90">সর্বমোট</span>
                    <span className="font-mono text-lg font-bold">৳ {toBengaliNumber(total)}/-</span>
                </div>
            </div>
        </div>

        {/* Electronic Signature Disclaimer */}
        <div className="relative z-10 mt-auto pt-3 text-center border-t border-dashed border-gray-200">
            <p className="text-[10px] text-gray-400 font-medium">এই বেতন স্লিপটি ইলেকট্রনিকভাবে তৈরি করা হয়েছে। কোনো স্বাক্ষরের প্রয়োজন নেই।</p>
        </div>
    </div>
);

export default React.forwardRef<HTMLDivElement, PaymentSlipProps>(function PaymentSlip({ student, fees, total, invoiceNo, date, paymentMethod }, ref) {
    return (
        // Added print styles directly to parent to enforce background colors during print
        <div
            ref={ref}
            id="printable-area"
            className="bg-white text-black w-[210mm] min-w-[210mm] shrink-0 mx-auto min-h-[297mm] flex flex-col justify-between overflow-hidden print:m-0 border border-transparent"
            style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        >
            <div className="p-[10mm] print:py-[12mm] print:px-[5mm] flex-1 flex flex-col justify-between">

                <ReceiptCopy title="অফিস কপি" student={student} fees={fees} total={total} invoiceNo={invoiceNo} date={date} paymentMethod={paymentMethod} />

                {/* Modernized Cut-line */}
                <div className="relative flex items-center justify-center my-6 opacity-60 print:my-4">
                    <div className="absolute w-full border-t-2 border-dashed border-gray-300"></div>
                    <div className="bg-white px-4 text-gray-400 text-[10px] font-bold z-10 flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>
                        ছেঁড়ার অংশ
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform scale-x-[-1]"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>
                    </div>
                </div>

                <ReceiptCopy id="student-copy-area" title="শিক্ষার্থী কপি" student={student} fees={fees} total={total} invoiceNo={invoiceNo} date={date} paymentMethod={paymentMethod} />

            </div>
        </div>
    );
});