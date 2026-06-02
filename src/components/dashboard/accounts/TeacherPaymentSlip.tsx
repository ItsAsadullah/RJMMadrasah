import React from 'react';
import { format } from "date-fns";

interface TeacherPaymentSlipProps {
    teacher: any;
    salaryRecord: any;
}

const toBengaliNumber = (num: any) =>
    num != null ? String(num).replace(/[0-9]/g, c => "০১২৩৪৫৬৭৮৯"[parseInt(c)]) : "-";

const bengaliMonths = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

// Helper function to convert number to Bengali words
const bengaliWords: { [key: number]: string } = {
  0: "শূন্য", 1: "এক", 2: "দুই", 3: "তিন", 4: "চার", 5: "পাঁচ", 6: "ছয়", 7: "সাত", 8: "আট", 9: "নয়",
  10: "দশ", 11: "এগারো", 12: "বারো", 13: "তেরো", 14: "চৌদ্দ", 15: "পনেরো", 16: "ষোল", 17: "সতেরো", 18: "আঠারো", 19: "উনিশ",
  20: "বিশ", 21: "একুশ", 22: "বাইশ", 23: "তেইশ", 24: "চব্বিশ", 25: "পঁচিশ", 26: "ছাব্বিশ", 27: "সাতাশ", 28: "আঠাশ", 29: "ঊনত্রিশ",
  30: "ত্রিশ", 31: "একত্রিশ", 32: "বত্রিশ", 33: "তেত্রিশ", 34: "চৌত্রিশ", 35: "পঁয়ত্রিশ", 36: "ছত্রিশ", 37: "সাঁইত্রিশ", 38: "আটত্রিশ", 39: "ঊনচল্লিশ",
  40: "চল্লিশ", 41: "একচল্লিশ", 42: "বিয়াল্লিশ", 43: "তেতাল্লিশ", 44: "চুয়াল্লিশ", 45: "পঁয়তাল্লিশ", 46: "ছেচল্লিশ", 47: "সাতচল্লিশ", 48: "আটচল্লিশ", 49: "ঊনপঞ্চাশ",
  50: "পঞ্চাশ", 51: "একান্ন", 52: "বায়ান্ন", 53: "তিপ্পান্ন", 54: "চুয়ান্ন", 55: "পঞ্চান্ন", 56: "ছাপ্পান্ন", 57: "সাতান্ন", 58: "আটান্ন", 59: "ঊনষাট",
  60: "ষাট", 61: "একষট্টি", 62: "বাষট্টি", 63: "তেষট্টি", 64: "চৌষট্টি", 65: "পঁয়ষট্টি", 66: "ছেষট্টি", 67: "সাতষট্টি", 68: "আটষট্টি", 69: "ঊনসত্তর",
  70: "সত্তর", 71: "একাত্তর", 72: "বাহাত্তর", 73: "তিয়াত্তর", 74: "চুয়াত্তর", 75: "পঁচাত্তর", 76: "ছিয়াত্তর", 77: "সাতাত্তর", 78: "আটাত্তর", 79: "ঊনাশি",
  80: "আশি", 81: "একাশি", 82: "বিরাশি", 83: "তিরাশি", 84: "চুরাশি", 85: "পঁচাশি", 86: "ছিয়াশি", 87: "সাতাশি", 88: "অষ্টআশি", 89: "ঊননব্বই",
  90: "নব্বই", 91: "একানব্বই", 92: "বিরানব্বই", 93: "তিরানব্বই", 94: "চুরানব্বই", 95: "পঁচানব্বই", 96: "ছিয়ানব্বই", 97: "সাতানব্বই", 98: "আটানব্বই", 99: "নিরানব্বই"
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
    if (hundred > 0) words += bengaliWords[hundred] + " শত ";
    if (num > 0) words += bengaliWords[num];
    
    return words.trim();
}

export default React.forwardRef<HTMLDivElement, TeacherPaymentSlipProps>(function TeacherPaymentSlip({ teacher, salaryRecord }, ref) {
    if (!teacher || !salaryRecord) return null;

    const invoiceNo = `TS-${salaryRecord.id.substring(0, 8).toUpperCase()}`;
    const isBonus = salaryRecord.payment_type === 'bonus' || salaryRecord.payment_type === 'allowance';
    let periodText = "";
    if (isBonus) {
        periodText = salaryRecord.payment_type === 'bonus' ? 'বোনাস' : 'ভাতা';
        if (salaryRecord.remarks) periodText += ` (${salaryRecord.remarks})`;
    } else {
        periodText = `বেতন: ${bengaliMonths[salaryRecord.salary_month - 1]} ${toBengaliNumber(salaryRecord.salary_year)}`;
    }

    return (
        <div ref={ref} className="w-[105mm] bg-white text-black p-[5mm] text-[11px] leading-snug mx-auto border" style={{ minHeight: '148mm' }}>
            {/* Header Section */}
            <div className="text-center border-b pb-2 mb-3">
                <img src="/images/bismillah.svg" alt="Bismillah" className="h-4 mx-auto mb-1 opacity-80" />
                <h1 className="text-lg font-bold text-gray-900 leading-tight">রাহিমা জান্নাত মডেল মাদ্রাসা</h1>
                <p className="text-[9px] text-gray-700">হলিধানী বাজার শাখা, ঝিনাইদহ</p>
                <p className="text-[9px] text-gray-600">মোবাইল: ০১৭১২-৩৪৫৬৭৮</p>
                <div className="mt-2 inline-block px-3 py-0.5 border border-gray-400 font-bold rounded text-[10px]">
                    পেমেন্ট ভাউচার (শিক্ষক/স্টাফ)
                </div>
            </div>

            {/* Meta Information */}
            <div className="flex justify-between text-[10px] mb-3">
                <div>
                    <span className="text-gray-600">ভাউচার নং:</span> <span className="font-bold font-mono">{invoiceNo}</span>
                </div>
                <div>
                    <span className="text-gray-600">তারিখ:</span> <span className="font-bold">{format(new Date(salaryRecord.payment_date || salaryRecord.created_at), 'dd/MM/yyyy')}</span>
                </div>
            </div>

            {/* Teacher Details Box */}
            <div className="border border-gray-300 rounded p-2 mb-3 grid grid-cols-2 gap-x-2 gap-y-1">
                <div className="col-span-2">
                    <span className="text-gray-500 w-16 inline-block">নাম</span>: <span className="font-bold">{teacher.name}</span>
                </div>
                <div>
                    <span className="text-gray-500 w-16 inline-block">পদবী</span>: <span className="font-semibold">{teacher.designation || "-"}</span>
                </div>
                <div>
                    <span className="text-gray-500 w-12 inline-block">শাখা</span>: <span className="font-semibold">{teacher.branches?.name || "-"}</span>
                </div>
                <div className="col-span-2">
                    <span className="text-gray-500 w-16 inline-block">মোবাইল</span>: <span className="font-mono font-semibold">{toBengaliNumber(teacher.phone) || "-"}</span>
                </div>
            </div>

            {/* Payment Details Table */}
            <table className="w-full mb-3 border-collapse">
                <thead>
                    <tr className="border-b border-t border-gray-400 bg-gray-50">
                        <th className="py-1 px-2 text-left font-bold">বিবরণ</th>
                        <th className="py-1 px-2 text-right font-bold w-20">টাকা</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-b border-gray-200 border-dashed">
                        <td className="py-2 px-2">
                            {periodText}
                        </td>
                        <td className="py-2 px-2 text-right font-bold">
                            {toBengaliNumber(salaryRecord.net_amount)}
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr className="border-t border-b border-gray-400 bg-gray-50">
                        <td className="py-1 px-2 text-right font-bold">সর্বমোট প্রদান:</td>
                        <td className="py-1 px-2 text-right font-bold text-[12px]">
                            ৳ {toBengaliNumber(salaryRecord.net_amount)}
                        </td>
                    </tr>
                </tfoot>
            </table>

            {/* Payment Method & In Words */}
            <div className="text-[10px] mb-8">
                <div className="mb-1">
                    <span className="text-gray-600">পেমেন্ট মেথড:</span> <span className="font-semibold capitalize">{salaryRecord.payment_method}</span>
                </div>
                <div className="bg-gray-50 p-1.5 rounded border">
                    <span className="font-bold text-gray-700">কথায়: </span> 
                    {numberToBengaliWords(salaryRecord.net_amount)} টাকা মাত্র।
                </div>
            </div>

            {/* Signatures */}
            <div className="flex justify-between mt-8 pt-4">
                <div className="text-center w-24 border-t border-gray-400">
                    <span className="text-[9px] text-gray-500">প্রদানকারীর স্বাক্ষর</span>
                </div>
                <div className="text-center w-24 border-t border-gray-400">
                    <span className="text-[9px] text-gray-500">গ্রহীতার স্বাক্ষর</span>
                </div>
            </div>
            
            <div className="mt-4 text-center text-[8px] text-gray-400">
                এই ভাউচারটি স্বয়ংক্রিয়ভাবে তৈরি করা হয়েছে।
            </div>
        </div>
    );
});
