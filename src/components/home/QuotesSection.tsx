"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Quote, BookOpen } from "lucide-react";

export default function QuotesSection() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("home_sections")
        .select("*")
        .eq("section_key", "islamic_quotes")
        .single();
      if (data) setData(data);
    };
    fetchData();
  }, []);

  if (!data || !data.is_active) return null;

  const type = data.additional_data?.type || 'other';
  const quran = data.additional_data?.quran;
  const hadith = data.additional_data?.hadith;
  const other = data.additional_data?.other;

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-green-50 overflow-hidden h-full flex flex-col relative group hover:shadow-2xl transition-all duration-500">
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-[0.03]"></div>
        
        {/* Header Section */}
        <div className={`p-8 text-white relative overflow-hidden ${type === 'hadith' ? 'bg-gradient-to-br from-blue-600 to-blue-800' : type === 'other' ? 'bg-gradient-to-br from-gray-600 to-gray-800' : 'bg-gradient-to-br from-green-600 to-green-800'}`}>
            <div className="absolute top-0 right-0 opacity-10 transform translate-x-8 -translate-y-8">
                <BookOpen className="w-32 h-32 rotate-12" />
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            
            <div className="relative z-10 text-center">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/20">
                    <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold tracking-wide">
                    {data.title || "আজকের বাণী"}
                </h3>
                <div className="h-1 w-16 bg-white/30 mx-auto mt-3 rounded-full"></div>
            </div>
        </div>
        
        {/* Content Section */}
        <div className="p-8 md:p-10 flex-1 flex flex-col justify-center relative bg-gradient-to-b from-gray-50/50 to-white">
            <Quote className="absolute top-8 left-8 w-12 h-12 text-gray-100 transform -scale-x-100" />
            
            <div className="relative z-10 text-center space-y-6">
                
                {/* Quran Content */}
                {type === 'quran' && quran && (
                    <>
                        {quran.arabic && (
                            <div className="font-amiri text-2xl md:text-3xl text-gray-800 leading-loose mb-4 font-bold" dir="rtl">
                                {quran.arabic}
                            </div>
                        )}
                        <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed font-medium">
                            {quran.bengali}
                        </div>
                        <div className="pt-4">
                            <div className="inline-flex flex-col items-center gap-1">
                                <span className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                    {quran.surah}
                                </span>
                                {quran.ayah && <span className="text-xs text-gray-500">আয়াতঃ {quran.ayah}</span>}
                            </div>
                        </div>
                    </>
                )}

                {/* Hadith Content */}
                {type === 'hadith' && hadith && (
                    <>
                         {hadith.arabic && (
                            <div className="font-amiri text-xl md:text-2xl text-gray-800 leading-loose mb-4 font-bold" dir="rtl">
                                {hadith.arabic}
                            </div>
                        )}
                        <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed font-medium">
                            {hadith.bengali}
                        </div>
                        <div className="pt-4">
                            <div className="inline-flex flex-col items-center gap-1">
                                <span className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                    {hadith.book}
                                </span>
                                {hadith.number && <span className="text-xs text-gray-500">হাদিস নংঃ {hadith.number}</span>}
                            </div>
                        </div>
                    </>
                )}

                {/* Other Content */}
                {type === 'other' && other && (
                    <>
                        <div className="prose prose-lg max-w-none text-gray-700 leading-loose font-medium italic relative">
                            <span className="text-4xl text-gray-200 absolute -top-4 -left-2">“</span>
                            {other.text}
                            <span className="text-4xl text-gray-200 absolute -bottom-8 -right-2">”</span>
                        </div>
                        {other.source && (
                            <div className="pt-4">
                                <div className="inline-flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-bold shadow-sm border border-gray-200">
                                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></span>
                                    {other.source}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <Quote className="absolute bottom-8 right-8 w-12 h-12 text-gray-100" />
        </div>
    </div>
  );
}
