"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";
import { Info } from "lucide-react";

export default function AboutSection() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("home_sections")
        .select("*")
        .eq("section_key", "about")
        .single();
      if (data) setData(data);
    };
    fetchData();
  }, []);

  if (!data || !data.is_active) return null;

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
          
          {/* Content */}
          <div className="w-full lg:w-1/2 space-y-8">
            <div className="flex items-center gap-4">
                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600">
                    <Info className="w-6 h-6" />
                </span>
                <span className="text-green-600 font-bold uppercase tracking-widest text-sm">আমাদের সম্পর্কে</span>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                {data.title.split(' ').map((word: string, i: number) => (
                    <span key={i} className={i === 1 ? "text-green-600" : ""}>{word} </span>
                ))}
            </h2>

            <div className="prose prose-lg text-gray-600 leading-relaxed text-lg text-justify">
                {data.content}
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center hover:bg-green-50 hover:border-green-200 transition-colors">
                    <h3 className="text-3xl font-black text-green-600 mb-1">১৫+</h3>
                    <p className="text-sm text-gray-500 font-medium">বছরের অভিজ্ঞতা</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center hover:bg-green-50 hover:border-green-200 transition-colors">
                    <h3 className="text-3xl font-black text-green-600 mb-1">৫০০+</h3>
                    <p className="text-sm text-gray-500 font-medium">শিক্ষার্থী</p>
                </div>
            </div>
          </div>

          {/* Image */}
          <div className="w-full lg:w-1/2 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-green-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
            
            <div className="relative h-[500px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white group rotate-2 hover:rotate-0 transition-all duration-500">
              {data.image_url ? (
                <Image 
                    src={data.image_url} 
                    alt={data.title} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-700" 
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    ছবি নেই
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-tr from-green-900/40 to-transparent"></div>
              
              {/* Badge */}
              <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg max-w-[200px] transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <p className="text-sm font-bold text-gray-800 leading-tight">সুশিক্ষিত জাতি গঠনে আমরা অঙ্গীকারবদ্ধ</p>
              </div>
            </div>
            
            {/* Decorative Dots */}
            <div className="absolute -bottom-10 -left-10 grid grid-cols-6 gap-2 opacity-50">
                {[...Array(24)].map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-green-200"></div>
                ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
