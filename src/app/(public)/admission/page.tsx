"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Calendar, CheckCircle2, FileText, Phone, MapPin } from "lucide-react";

export default function AdmissionLanding() {
  return (
    <div className="min-h-screen bg-white">
      
      {/* 1. Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center bg-green-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1564121211835-e88c852648ab?q=80&w=2070')] bg-cover bg-center opacity-20"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-6">
           <span className="bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider border border-white/30">ভর্তি চলছে</span>
           <h1 className="text-4xl md:text-6xl font-black leading-tight">শিক্ষাবর্ষ ২০২৬</h1>
           <p className="text-green-100 text-lg md:text-xl max-w-2xl mx-auto">রহিমা জান্নাত মহিলা মাদ্রাসায় নতুন শিক্ষাবর্ষে নূরানী, নাজেরা, হিফজ ও কিতাব বিভাগে ভর্তি চলছে।</p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/admission/apply">
                 <Button size="lg" className="bg-white text-green-900 hover:bg-green-50 font-bold h-14 px-8 text-lg rounded-full">অনলাইনে আবেদন করুন <ArrowRight className="ml-2 w-5 h-5"/></Button>
              </Link>
           </div>
        </div>
      </section>

      {/* 2. Marquee Notice */}
      <div className="bg-green-100 py-3 overflow-hidden border-b border-green-200">
         <div className="whitespace-nowrap animate-marquee text-green-800 font-bold text-sm md:text-base">
            📢 সীমিত আসন সংখ্যা! দ্রুত আপনার সন্তানের ভর্তি নিশ্চিত করুন। বিশেষ প্রয়োজনে যোগাযোগ করুন: ০১৭XX-XXXXXX
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 space-y-20">
         
         {/* 3. Requirements & Fees */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Requirements */}
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3"><FileText className="w-8 h-8 text-green-600"/> ভর্তির শর্তাবলী</h2>
                <ul className="space-y-4">
                    {[
                        "জন্ম নিবন্ধন সনদের ফটোকপি (বাধ্যতামূলক)",
                        "শিক্ষার্থীর ২ কপি পাসপোর্ট সাইজের রঙিন ছবি",
                        "পিতা/মাতার এনআইডি কার্ডের ফটোকপি",
                        "আগের মাদ্রাসার ছাড়পত্র (যদি থাকে)",
                        "নির্ধারিত ভর্তি ফরম পূরণ ও ফি প্রদান"
                    ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <span className="text-gray-700 font-medium">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Fee Structure */}
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3"><BookOpen className="w-8 h-8 text-green-600"/> ফি তালিকা</h2>
                <div className="border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-green-600 text-white">
                            <tr>
                                <th className="p-4">বিভাগ/শ্রেণি</th>
                                <th className="p-4">ভর্তি ফি</th>
                                <th className="p-4">মাসিক বেতন</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {[
                                { class: "নূরানী (শিশু - ৩য়)", add: 3000, mon: 800 },
                                { class: "হিফজুল কুরআন", add: 5000, mon: 1500 },
                                { class: "কিতাব বিভাগ", add: 4000, mon: 1200 },
                                { class: "আবাসিক চার্জ", add: 2000, mon: 2500 }
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="p-4 font-bold text-gray-700">{row.class}</td>
                                    <td className="p-4 font-mono">{row.add}/-</td>
                                    <td className="p-4 font-mono">{row.mon}/-</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-gray-500 italic">* এতিম ও গরিব শিক্ষার্থীদের জন্য বিশেষ ছাড়ের ব্যবস্থা রয়েছে।</p>
            </div>
         </div>

         {/* 4. Departments */}
         <section className="text-center space-y-8">
            <h2 className="text-3xl font-bold text-gray-800">আমাদের বিভাগসমূহ</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: "নূরানী ও মক্তব", desc: "শিশুদের জন্য বুনিয়াদি শিক্ষা ও সহীহ কুরআন তেলাওয়াত।", color: "bg-blue-50 text-blue-700 border-blue-100" },
                    { title: "হিফজুল কুরআন", desc: "অভিজ্ঞ হাফেজ দ্বারা ৩ বছরে সম্পূর্ণ কুরআন হিফজ।", color: "bg-green-50 text-green-700 border-green-100" },
                    { title: "কিতাব বিভাগ", desc: "মিজান থেকে দাওরায়ে হাদিস পর্যন্ত গভীর দ্বীনি শিক্ষা।", color: "bg-purple-50 text-purple-700 border-purple-100" }
                ].map((dept, i) => (
                    <div key={i} className={`p-8 rounded-2xl border ${dept.color} hover:shadow-lg transition-all`}>
                        <h3 className="text-xl font-bold mb-2">{dept.title}</h3>
                        <p className="opacity-80">{dept.desc}</p>
                    </div>
                ))}
            </div>
         </section>

      </div>

      {/* 5. Footer CTA */}
      <section className="bg-gray-900 text-white py-12 text-center">
         <div className="max-w-4xl mx-auto px-4 space-y-6">
             <h2 className="text-2xl md:text-3xl font-bold">আপনার সন্তানের উজ্জ্বল ভবিষ্যতের জন্য আজই যোগাযোগ করুন</h2>
             <div className="flex flex-col md:flex-row justify-center gap-6 text-lg">
                <p className="flex items-center justify-center gap-2"><Phone className="w-5 h-5"/> ০১৯৮৮২১৪৫৫৪</p>
                <p className="flex items-center justify-center gap-2"><MapPin className="w-5 h-5"/> হলিধানী বাজার, ঝিনাইদহ সদর</p>
             </div>
         </div>
      </section>

      <style jsx>{`
        @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }
        .animate-marquee {
            display: inline-block;
            animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}