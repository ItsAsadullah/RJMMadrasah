"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Layers, ArrowRight } from "lucide-react";

export default function DepartmentsSection() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("home_sections")
        .select("*")
        .eq("section_key", "departments")
        .maybeSingle();
      if (data) setData(data);
    };
    fetchData();
  }, []);

  if (!data || !data.is_active || !data.additional_data?.items?.length) return null;

  const departments = data.additional_data.items;

  return (
    <section className="py-24 bg-gray-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-white rounded-full shadow-md text-green-600 font-bold mb-6 border border-green-100">
                <Layers className="w-5 h-5" />
                <span>আমাদের বিভাগসমূহ</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight mb-4">{data.title || "বিভাগসমূহ"}</h2>
            <div className="h-1.5 w-24 bg-gradient-to-r from-green-400 to-green-600 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {departments.map((dept: string, index: number) => (
                <div key={index} className="group relative bg-white p-8 rounded-3xl shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer">
                    {/* Hover Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors backdrop-blur-sm">
                            <span className="text-2xl font-bold text-green-600 group-hover:text-white transition-colors">{dept.charAt(0)}</span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-white transition-colors">{dept}</h3>
                        <p className="text-sm text-gray-500 group-hover:text-green-100 transition-colors mt-auto pt-4 border-t border-gray-100 group-hover:border-white/20">
                            বিস্তারিত দেখুন
                        </p>
                        
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                            <ArrowRight className="w-6 h-6 text-white" />
                        </div>
                    </div>

                    {/* Decorative Circle */}
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-green-50 rounded-full group-hover:bg-white/10 transition-colors"></div>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
}
