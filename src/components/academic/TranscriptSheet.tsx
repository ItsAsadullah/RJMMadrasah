import React from 'react';
import Image from 'next/image';

export interface TranscriptMark {
  subjectName: string;
  isOral?: boolean;
  fullMarks: number;
  marksObtained: number | null | string;
  grade: string;
  gp: number;
}

export interface TranscriptSummary {
  totalMarks: number | string;
  totalFullMarks: number | string;
  gpa: number | string;
  grade: string;
}

export interface TranscriptStudent {
  id: string;
  nameBn: string;
  fatherNameBn: string;
  motherNameBn: string;
  className: string;
  rollNo: string | number;
}

export interface TranscriptExam {
  title: string;
  academicYear: string | number;
}

export interface TranscriptBranch {
  address: string;
}

export interface TranscriptProps {
  student: TranscriptStudent;
  exam: TranscriptExam;
  branch: TranscriptBranch;
  marks: TranscriptMark[];
  summary: TranscriptSummary;
}

// --- বাংলা কনভার্সন হেল্পার ---
const toBengaliNumber = (num: string | number) => {
  if (num === null || num === undefined) return "";
  const strNum = String(num);
  const english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'PM', 'AM', '.'];
  const bengali = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯', 'পিএম', 'এএম', '.'];
  let result = '';
  for (let i = 0; i < strNum.length; i++) {
    const char = strNum[i];
    const index = english.indexOf(char);
    result += index !== -1 ? bengali[index] : char;
  }
  return result;
};

export default function TranscriptSheet({ student, exam, branch, marks, summary }: TranscriptProps) {
  // CSS to force A4 size and remove browser margins during print
  const printStyles = `
    @media print {
      @page {
        size: A4;
        margin: 0 !important;
      }
      .watermark-bg {
        -webkit-print-color-adjust: economy !important;
        print-color-adjust: economy !important;
      }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <div 
        id="printable-content" 
        className="bg-white mx-auto relative shadow-2xl print:shadow-none w-[210mm] h-[296mm] p-[10mm] box-border print:p-[10mm] print:m-0 overflow-hidden flex flex-col justify-center print:page-break-after-always" 
        style={{ fontFamily: "'Kalpurush', 'Siyam Rupali', sans-serif" }}
      >
          {/* Outer ornate border container */}
          <div className="relative flex-1 border-[6px] border-emerald-800 p-1.5 rounded-xl box-border overflow-hidden flex flex-col">
              {/* Inner border */}
              <div className="relative h-full border-2 border-emerald-800 rounded-lg flex flex-col p-6 box-border bg-white overflow-hidden">
                  {/* Corner Ornaments (Arabic Calligraphy style vibe) */}
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-[5px] border-l-[5px] border-emerald-900 rounded-tl-2xl pointer-events-none" />
                  <div className="absolute top-0 right-0 w-10 h-10 border-t-[5px] border-r-[5px] border-emerald-900 rounded-tr-2xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[5px] border-l-[5px] border-emerald-900 rounded-bl-2xl pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[5px] border-r-[5px] border-emerald-900 rounded-br-2xl pointer-events-none" />
                  
                  <div className="absolute top-1 left-1 w-6 h-6 border-t-[2px] border-l-[2px] border-emerald-700 rounded-tl-xl pointer-events-none" />
                  <div className="absolute top-1 right-1 w-6 h-6 border-t-[2px] border-r-[2px] border-emerald-700 rounded-tr-xl pointer-events-none" />
                  <div className="absolute bottom-1 left-1 w-6 h-6 border-b-[2px] border-l-[2px] border-emerald-700 rounded-bl-xl pointer-events-none" />
                  <div className="absolute bottom-1 right-1 w-6 h-6 border-b-[2px] border-r-[2px] border-emerald-700 rounded-br-xl pointer-events-none" />

                  {/* Watermark (Logo) */}
                  <div className="watermark-bg absolute inset-0 bg-[url('/images/logo.png')] bg-no-repeat bg-center bg-[length:30rem_30rem] opacity-[0.12] pointer-events-none z-0 grayscale"></div>

                  <div className="relative z-10 flex flex-col h-full">
                      {/* Header */}
                      <div className="text-center relative z-10 mb-6">
                          <div className="flex justify-center mb-2 h-8 relative">
                              <Image src="/images/bismillah.svg" alt="Bismillah" fill className="object-contain" priority />
                          </div>
                          <div className="w-full flex justify-center relative h-16 mb-2">
                              <Image src="/images/long_logo.svg" alt="Madrasa Logo" fill className="object-contain" priority />
                          </div>
                          <p className="text-base font-semibold text-slate-600 mb-3">{branch?.address || "হলিধানী বাজার, ঝিনাইদহ সদর, ঝিনাইদহ"}</p>
                          
                          <div className="inline-block bg-emerald-700 text-white px-8 py-1.5 rounded-full text-xl font-bold uppercase tracking-widest shadow-sm print:bg-emerald-700 print-color-exact mb-3">
                              একাডেমিক ট্রান্সক্রিপ্ট
                          </div>
                          
                          <div className="flex items-center justify-center gap-2">
                              <h2 className="text-lg font-bold text-emerald-800">{exam?.title}</h2>
                              <span className="text-emerald-300 font-bold">|</span>
                              <span className="text-md font-semibold text-emerald-700">শিক্ষাবর্ষ: {toBengaliNumber(exam?.academicYear || "")}</span>
                          </div>
                      </div>

                      {/* Student Info Box */}
                      <div className="relative z-10 mb-6 bg-slate-50/50 border border-slate-200 rounded-xl p-4 text-[13px] print:bg-slate-50/50 print-color-exact shadow-sm">
                          <div className="grid grid-cols-[1fr_1fr_max-content] gap-y-3 gap-x-4">
                              {/* Row 1 */}
                              <div className="flex items-center"><span className="text-slate-500 whitespace-nowrap mr-2">শিক্ষার্থীর নাম:</span> <span className="font-bold text-[15px] text-slate-800 leading-tight">{student.nameBn}</span></div>
                              <div className="flex items-center"><span className="text-slate-500 whitespace-nowrap mr-2">পিতার নাম:</span> <span className="font-semibold text-slate-700 text-[14px] leading-tight">{student.fatherNameBn}</span></div>
                              <div className="flex items-center justify-end"><span className="text-slate-500 whitespace-nowrap mr-2">শ্রেণি:</span> <span className="font-bold text-emerald-800 bg-emerald-100/80 px-3 py-0.5 rounded-full border border-emerald-200 print:bg-emerald-100 whitespace-nowrap">{student.className}</span></div>
                              
                              {/* Row 2 */}
                              <div className="flex items-center"><span className="text-slate-500 whitespace-nowrap mr-2">আইডি নম্বর:</span> <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap">{toBengaliNumber(student.id)}</span></div>
                              <div className="flex items-center"><span className="text-slate-500 whitespace-nowrap mr-2">মাতার নাম:</span> <span className="font-semibold text-slate-700 text-[14px] leading-tight">{student.motherNameBn}</span></div>
                              <div className="flex items-center justify-end"><span className="text-slate-500 whitespace-nowrap mr-2">রোল নম্বর:</span> <span className="font-bold text-[15px] text-slate-800 whitespace-nowrap">{toBengaliNumber(student.rollNo)}</span></div>
                          </div>
                      </div>

                      {/* Result Table */}
                      <div className="relative z-10 mb-4 rounded-xl overflow-hidden border border-emerald-200 print:border-emerald-300">
                          {(() => {
                              const isMany = marks.length > 7;
                              const thPad = isMany ? "p-2" : "p-3";
                              const tdPad = isMany ? "p-1.5" : "p-2.5";
                              const sumPad = isMany ? "p-2" : "p-3";
                              
                              return (
                                  <table className="w-full text-center text-[13px] sm:text-sm border-collapse">
                                      <thead className="bg-emerald-600 text-white print:bg-emerald-600 print:text-white print-color-exact font-semibold tracking-wide">
                                          <tr>
                                              <th className={`${thPad} w-12 border-r border-emerald-500/50`}>নং</th>
                                              <th className={`${thPad} text-left border-r border-emerald-500/50`}>বিষয়ের নাম</th>
                                              <th className={`${thPad} w-24 border-r border-emerald-500/50`}>পূর্ণমান</th>
                                              <th className={`${thPad} w-24 border-r border-emerald-500/50`}>প্রাপ্ত নম্বর</th>
                                              <th className={`${thPad} w-24 border-r border-emerald-500/50`}>লেটার গ্রেড</th>
                                              <th className={`${thPad} w-24`}>গ্রেড পয়েন্ট</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-emerald-100 bg-white/40">
                                          {marks.map((sub, idx) => (
                                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                  <td className={`${tdPad} border-r border-emerald-100 text-slate-500`}>{toBengaliNumber(idx + 1)}</td>
                                                  <td className={`${tdPad} text-left font-semibold text-slate-800 border-r border-emerald-100`}>
                                                    {sub.subjectName}{sub.isOral ? ' (মৌখিক)' : ''}
                                                  </td>
                                                  <td className={`${tdPad} border-r border-emerald-100 text-slate-600`}>{toBengaliNumber(sub.fullMarks || 100)}</td>
                                                  <td className={`${tdPad} font-bold text-emerald-700 border-r border-emerald-100 text-base`}>
                                                    {sub.marksObtained !== null && sub.marksObtained !== undefined && sub.marksObtained !== "" ? toBengaliNumber(sub.marksObtained) : '-'}
                                                  </td>
                                                  <td className={`${tdPad} border-r border-emerald-100`}>
                                                      <span className={`font-bold ${sub.grade === 'F' ? 'text-red-600' : 'text-slate-700'}`}>{sub.grade}</span>
                                                  </td>
                                                  <td className={`${tdPad} font-semibold text-slate-700`}>{toBengaliNumber(sub.gp ? sub.gp.toFixed(2) : "0.00")}</td>
                                              </tr>
                                          ))}
                                          {/* Final Summary Row */}
                                          <tr className="font-bold bg-emerald-50/50 print:bg-emerald-50/50 print-color-exact border-t-2 border-emerald-200">
                                              <td colSpan={2} className={`${sumPad} text-right pr-4 text-emerald-900 uppercase tracking-wider border-r border-emerald-200`}>সর্বমোট</td>
                                              <td className={`${sumPad} text-center text-emerald-800 border-r border-emerald-200`}>
                                                  {toBengaliNumber(summary.totalFullMarks)}
                                              </td>
                                              <td className={`${sumPad} text-center text-emerald-800 text-lg border-r border-emerald-200`}>{toBengaliNumber(summary.totalMarks)}</td>
                                              <td className={`${sumPad} text-center text-emerald-800 text-lg border-r border-emerald-200`}>{summary.grade}</td>
                                              <td className={`${sumPad} text-center text-emerald-800 text-lg`}>
                                                {toBengaliNumber(typeof summary.gpa === 'number' ? summary.gpa.toFixed(2) : summary.gpa)}
                                              </td>
                                          </tr>
                                      </tbody>
                                  </table>
                              );
                          })()}
                      </div>

                      {/* Grading Scale */}
                      <div className="relative z-10 mb-4 flex justify-center">
                          <div className="w-full max-w-2xl border border-slate-200 rounded-lg overflow-hidden flex bg-white/40 text-[10px]">
                              <div className="bg-slate-100/50 p-2 flex items-center justify-center font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap print:bg-slate-100/50 print-color-exact">
                                  গ্রেডিং সিস্টেম
                              </div>
                              <div className="flex-1 grid grid-cols-6 divide-x divide-slate-200 text-center">
                                  <div className="p-1.5"><div className="font-bold text-slate-800">৮০-১০০</div><div className="text-emerald-600 font-bold">A+ (5.00)</div></div>
                                  <div className="p-1.5"><div className="font-bold text-slate-800">৭০-৭৯</div><div className="text-emerald-600 font-bold">A (4.00)</div></div>
                                  <div className="p-1.5"><div className="font-bold text-slate-800">৬০-৬৯</div><div className="text-emerald-600 font-bold">A- (3.50)</div></div>
                                  <div className="p-1.5"><div className="font-bold text-slate-800">৫০-৫৯</div><div className="text-blue-600 font-bold">B (3.00)</div></div>
                                  <div className="p-1.5"><div className="font-bold text-slate-800">৪০-৪৯</div><div className="text-amber-600 font-bold">C (2.00)</div></div>
                                  <div className="p-1.5"><div className="font-bold text-slate-800">৩৩-৩৯</div><div className="text-orange-600 font-bold">D (1.00)</div></div>
                              </div>
                          </div>
                      </div>

                      {/* Footer Signatures */}
                      <div className="relative z-10 flex justify-between items-end mt-auto pb-0 pt-4">
                          <div className="text-center">
                              <div className="w-40 border-t border-slate-400 mb-2"></div>
                              <p className="font-semibold text-sm text-slate-700">শ্রেণি শিক্ষকের স্বাক্ষর</p>
                          </div>
                          <div className="text-center">
                              <div className="w-40 border-t border-slate-400 mb-2"></div>
                              <p className="font-semibold text-sm text-slate-700">অধ্যক্ষের স্বাক্ষর</p>
                          </div>
                          <div className="text-center">
                              <div className="w-40 border-t border-slate-400 mb-2"></div>
                              <p className="font-semibold text-sm text-slate-700">অভিভাবকের স্বাক্ষর</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </>
  );
}
