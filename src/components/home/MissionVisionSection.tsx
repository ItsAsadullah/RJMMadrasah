"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { CheckCircle2, Target } from "lucide-react";

export default function MissionVisionSection() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("home_sections")
        .select("*")
        .eq("section_key", "mission_vision")
        .single();
      if (data) setData(data);
    };
    fetchData();
  }, []);

  if (!data || !data.is_active) return null;

  return (
    <section className="bg-gradient-to-br from-green-700 to-green-900 rounded-[2rem] p-8 md:p-16 text-white shadow-2xl relative overflow-hidden group my-16 mx-4 md:mx-0">
        {/* ব্যাকগ্রাউন্ড ডেকোরেশন */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-10 -mb-10 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start gap-12">
            <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Target className="w-6 h-6 text-green-100" />
                    </div>
                    <span className="text-green-100 font-bold uppercase tracking-wider">আমাদের লক্ষ্য</span>
                </div>
                
                <h2 className="text-3xl md:text-5xl font-black leading-tight">{data.title}</h2>
                <div className="text-green-50 text-base md:text-lg leading-loose opacity-90 max-w-3xl whitespace-pre-wrap">
                    {data.content}
                </div>
            </div>
        </div>
    </section>
  );
}
