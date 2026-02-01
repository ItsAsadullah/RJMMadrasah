import Image from "next/image";
import { format } from "date-fns";

export default function StudentPrintProfile({ student }: { student: any }) {
  if (!student) return null;

  return (
    <div id="printable-area" className="hidden print:flex print:items-center print:justify-center print:w-full print:h-full bg-white text-black font-sans absolute top-0 left-0 z-[9999]">
      
      {/* A4 সাইজ কন্টেইনার */}
      <div className="w-[210mm] h-[297mm] relative bg-white box-border shadow-none overflow-hidden">
        
        {/* প্যাডিং */}
        <div className="w-full h-full pt-[8mm] pb-[20mm] px-[10mm] relative flex flex-col justify-between">
            
            {/* --- ওয়াটারমার্ক --- */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div className="opacity-[0.08] w-[500px] h-[500px] relative">
                    <Image src="/logo.png" alt="Watermark" fill className="object-contain grayscale" />
                </div>
            </div>

            {/* --- বর্ডার ফ্রেম --- */}
            <div className="absolute top-[8mm] bottom-[20mm] left-[10mm] right-[10mm] border-[3px] border-double border-green-900 pointer-events-none z-10 rounded-lg"></div>
            
            {/* --- কন্টেন্ট ফ্রেম --- */}
            <div className="h-full border border-green-700 p-6 flex flex-col justify-between relative z-20 m-[3px] rounded-md bg-white/40">
                
                {/* কোণার ডিজাইন */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-900"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-900"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-900"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-900"></div>

                {/* --- HEADER SECTION --- */}
                <div>
                    {/* আরবি হেডার (ছোট করা হয়েছে) */}
                    <div className="text-center -mt-2 mb-1 text-green-900">
                        <h2 className="text-lg font-bold font-arabic">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</h2>
                    </div>

                    {/* ইনস্টিটিউশন হেডার */}
                    <div className="flex items-start justify-between border-b-2 border-green-900 pb-2 mb-3">
                        <div className="w-20 h-20 relative flex-shrink-0 mt-1">
                            <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
                        </div>
                        <div className="text-center flex-1 px-2 pt-1">
                            {/* মাদ্রাসার নাম (Hind Siliguri Font & Bold) */}
                            <h1 className="text-3xl font-hind font-bold text-green-800 leading-none scale-y-105">
                                রহিমা জান্নাত মহিলা মাদ্রাসা
                            </h1>
                            <div className="mt-1 flex flex-col items-center">
                                <span className="bg-green-800 text-white px-3 py-0.5 rounded-full text-[11px] tracking-wide font-medium mb-1">
                                    স্থাপিত: ২০২১ ইং
                                </span>
                                {/* শাখার নাম আলাদা করে দেখানো (শাখা: শব্দটি বাদ) */}
                                <p className="text-sm font-bold text-gray-800">
                                    {student.branch_id === 1 ? 'হলিধানী বাজার শাখা' : 'চাঁন্দুয়ালী বাজার শাখা'}, ঝিনাইদহ সদর
                                </p>
                                <p className="text-xs font-bold text-green-900 mt-0.5">মোবাইল: ০১৯৮৮২১৪৫৫৪</p>
                            </div>
                            
                            <div className="mt-2">
                                <span className="bg-green-100 text-green-900 px-6 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest border border-green-800 shadow-sm print:bg-green-100 print:text-green-900">
                                    শিক্ষার্থী প্রোফাইল
                                </span>
                            </div>
                        </div>
                        <div className="w-20 h-24 border-2 border-green-900 p-0.5 flex items-center justify-center bg-gray-50 flex-shrink-0 mt-1 shadow-sm">
                            {student.photo_url ? (
                                <img src={student.photo_url} alt="Student" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center">
                                    <span className="text-[9px] text-gray-400 block">ছবি</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* একাডেমিক তথ্য বক্স */}
                    <div className="mb-4 border-2 border-green-800 rounded-md overflow-hidden shadow-sm">
                        <div className="bg-green-800 text-white text-center font-bold py-1 uppercase text-xs print:bg-green-800 print:text-white">
                            একাডেমিক তথ্য (অফিস ব্যবহার)
                        </div>
                        <div className="grid grid-cols-4 gap-2 p-2 text-[12px] bg-green-50/50 font-medium">
                            <div><span className="font-bold text-green-900">শিক্ষাবর্ষ:</span> {student.academic_year}</div>
                            <div><span className="font-bold text-green-900">আইডি নং:</span> {student.birth_reg_no ? student.birth_reg_no.slice(-6) : 'N/A'}</div>
                            <div className="col-span-2 text-right"><span className="font-bold text-green-900">ভর্তির তারিখ:</span> {format(new Date(student.created_at), 'dd/MM/yyyy')}</div>
                            
                            <div><span className="font-bold text-green-900">শ্রেণি:</span> {student.class_name}</div>
                            <div><span className="font-bold text-green-900">বিভাগ:</span> {student.department}</div>
                            <div><span className="font-bold text-green-900">শাখা:</span> {student.branch_id === 1 ? 'হলিধানী' : 'চাঁন্দুয়ালী'}</div>
                            <div className="text-right"><span className="font-bold text-green-900">আবাসন:</span> {student.residential_status === 'residential' ? 'আবাসিক' : 'অনাবাসিক'}</div>
                        </div>
                    </div>
                </div>

                {/* --- MIDDLE SECTION (Data) --- */}
                <div className="flex-1 space-y-4">
                    
                    {/* 1. Student Info */}
                    <section>
                        <div className="flex items-center gap-2 border-b-2 border-green-800 mb-2 pb-1">
                            <div className="w-3 h-3 bg-green-900 rotate-45 transform flex-shrink-0"></div>
                            <h3 className="text-sm font-bold uppercase text-green-900">শিক্ষার্থীর তথ্য</h3>
                        </div>

                        <div className="border border-green-800/60 p-3 rounded-lg bg-white/50">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[13px]">
                                <Row label="নাম (বাংলায়)" value={student.name_bn} />
                                <Row label="Name (English)" value={student.name_en} />
                                <Row label="জন্ম সনদ নং" value={student.birth_reg_no} />
                                <Row label="জন্ম তারিখ" value={student.dob ? format(new Date(student.dob), 'dd MMM yyyy') : '-'} />
                                <Row label="রক্তের গ্রুপ" value={student.blood_group} />
                                <Row label="বয়স" value={student.age_info} />
                            </div>
                        </div>
                    </section>

                    {/* 2. Parents Info */}
                    <section>
                        <div className="flex items-center gap-2 border-b-2 border-green-800 mb-4 pb-1">
                            <div className="w-3 h-3 bg-green-900 rotate-45 transform flex-shrink-0"></div>
                            <h3 className="text-sm font-bold uppercase text-green-900">অভিভাবকের তথ্য</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mt-3 text-[13px]">
                            {/* Father */}
                            <div className="relative border border-green-800 p-3 pt-4 rounded bg-white">
                                <span className="absolute -top-3 left-3 bg-green-100 text-green-900 px-2 py-0.5 font-bold text-[11px] border border-green-800 rounded print:bg-green-100">
                                    পিতার তথ্য
                                </span>
                                <div className="space-y-1">
                                    <Row label="নাম" value={student.father_name_bn} width="w-14" />
                                    <Row label="পেশা" value={student.father_occupation} width="w-14" />
                                    <Row label="মোবাইল" value={student.father_mobile} width="w-14" />
                                    <Row label="NID" value={student.father_nid} width="w-14" />
                                </div>
                            </div>
                            {/* Mother */}
                            <div className="relative border border-green-800 p-3 pt-4 rounded bg-white">
                                <span className="absolute -top-3 left-3 bg-green-100 text-green-900 px-2 py-0.5 font-bold text-[11px] border border-green-800 rounded print:bg-green-100">
                                    মাতার তথ্য
                                </span>
                                <div className="space-y-1">
                                    <Row label="নাম" value={student.mother_name_bn} width="w-14" />
                                    <Row label="পেশা" value={student.mother_occupation} width="w-14" />
                                    <Row label="মোবাইল" value={student.mother_mobile} width="w-14" />
                                    <Row label="NID" value={student.mother_nid} width="w-14" />
                                </div>
                            </div>
                        </div>
                        
                        {/* Local Guardian (Updated Layout) */}
                        <div className="mt-3 border border-green-800 px-3 py-2 rounded flex items-center gap-1 text-[12px] bg-green-50/30 print:bg-green-50">
                            <span className="font-bold text-green-900 whitespace-nowrap w-24">স্থানীয় অভিভাবক :</span>
                            <span className="border-b border-dotted border-black flex-1 px-1 h-4 leading-4 font-medium text-center">{student.guardian_name || ''}</span>
                            
                            <span className="font-bold text-green-900 ml-2">সম্পর্ক :</span>
                            <span className="border-b border-dotted border-black w-24 px-1 h-4 leading-4 text-center font-medium">{student.guardian_relation || ''}</span>
                            
                            <span className="font-bold text-green-900 ml-2">মোবাইল :</span>
                            <span className="border-b border-dotted border-black w-32 px-1 h-4 leading-4 text-center font-mono font-medium">{student.guardian_mobile || ''}</span>
                        </div>
                    </section>

                    {/* 3. Address */}
                    <section>
                        <div className="flex items-center gap-2 border-b-2 border-green-800 mb-2 pb-1">
                            <div className="w-3 h-3 bg-green-900 rotate-45 transform flex-shrink-0"></div>
                            <h3 className="text-sm font-bold uppercase text-green-900">ঠিকানা</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6 text-[12px]">
                            {/* বর্তমান ঠিকানা */}
                            <div className="border border-green-800/60 p-2 rounded bg-white/50">
                                <div className="flex gap-2">
                                    <span className="font-bold text-green-900 whitespace-nowrap">গ্রাম:</span>
                                    <span className="border-b border-dotted border-gray-400 flex-1 h-4 leading-4">{student.present_village || ''}</span>
                                </div>
                                <div className="flex gap-2 mt-1">
                                    <span className="font-bold text-green-900 whitespace-nowrap">ডাকঘর:</span>
                                    <span className="border-b border-dotted border-gray-400 flex-1 h-4 leading-4">{student.present_union ? `${student.present_union} ${student.present_postcode ? `(${student.present_postcode})` : ''}` : ''}</span>
                                </div>
                                <div className="flex gap-2 mt-1">
                                    <span className="font-bold text-green-900 whitespace-nowrap">উপজেলা:</span>
                                    <span className="border-b border-dotted border-gray-400 w-1/3 h-4 leading-4">{student.present_upazila || ''}</span>
                                    <span className="font-bold text-green-900 whitespace-nowrap ml-auto">জেলা:</span>
                                    <span className="border-b border-dotted border-gray-400 w-1/3 h-4 leading-4">{student.present_district || ''}</span>
                                </div>
                            </div>
                            
                            {/* স্থায়ী ঠিকানা */}
                            <div className="border border-green-800/60 p-2 rounded bg-white/50">
                                <div className="flex gap-2">
                                    <span className="font-bold text-green-900 whitespace-nowrap">গ্রাম:</span>
                                    <span className="border-b border-dotted border-gray-400 flex-1 h-4 leading-4">{student.perm_village || ''}</span>
                                </div>
                                <div className="flex gap-2 mt-1">
                                    <span className="font-bold text-green-900 whitespace-nowrap">ডাকঘর:</span>
                                    <span className="border-b border-dotted border-gray-400 flex-1 h-4 leading-4">{student.perm_union ? `${student.perm_union} ${student.perm_postcode ? `(${student.perm_postcode})` : ''}` : ''}</span>
                                </div>
                                <div className="flex gap-2 mt-1">
                                    <span className="font-bold text-green-900 whitespace-nowrap">উপজেলা:</span>
                                    <span className="border-b border-dotted border-gray-400 w-1/3 h-4 leading-4">{student.perm_upazila || ''}</span>
                                    <span className="font-bold text-green-900 whitespace-nowrap ml-auto">জেলা:</span>
                                    <span className="border-b border-dotted border-gray-400 w-1/3 h-4 leading-4">{student.perm_district || ''}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* অঙ্গীকারনামা */}
                    <div className="mt-1">
                        <p className="text-[11px] text-justify text-gray-800 italic leading-snug px-1 font-medium">
                            আমি এই মর্মে অঙ্গীকার করছি যে, উপরে প্রদত্ত সকল তথ্য সত্য। মাদ্রাসার নিয়ম-শৃঙ্খলা মেনে চলতে আমি ও আমার অভিভাবক বাধ্য থাকিব।
                        </p>
                    </div>

                </div>

                {/* --- FOOTER SECTION --- */}
                <div className="mt-auto pt-2">
                    {/* স্বাক্ষর */}
                    <div className="flex justify-between items-end pb-1 px-4 mt-8">
                        <div className="text-center">
                            <div className="w-40 border-t border-black border-dashed mb-1"></div>
                            <p className="font-bold text-[11px] text-green-900">অভিভাবকের স্বাক্ষর</p>
                        </div>
                        <div className="text-center">
                            <div className="w-40 border-t border-black border-dashed mb-1"></div>
                            <p className="font-bold text-[11px] text-green-900">অধ্যক্ষের স্বাক্ষর ও সিল</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}

// Custom Row Component
const Row = ({ label, value, width = "w-24" }: { label: string, value: any, width?: string }) => (
    <div className="flex items-end">
        <span className={`${width} font-semibold text-gray-800 flex-shrink-0 text-[12px] whitespace-nowrap`}>{label} :</span>
        <span className="flex-1 font-medium text-black border-b border-dotted border-gray-400 pl-2 text-[13px] h-5 leading-5 truncate">
            {value || ''}
        </span>
    </div>
);