"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";
import { Quote, User } from "lucide-react";

export default function DirectorMessage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("home_sections")
        .select("*")
        .eq("section_key", "director")
        .maybeSingle();
      if (data) setData(data);
    };
    fetchData();
  }, []);

  if (!data || !data.is_active) return null;

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-green-50 overflow-hidden h-full flex flex-col relative group">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-[100px] -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
      
      <div className="p-8 md:p-10 relative z-10 flex flex-col h-full">
        {/* Header with Image floating left */}
        <div className="flex flex-col sm:flex-row gap-6 mb-6">
            <div className="flex-shrink-0 mx-auto sm:mx-0">
                <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden ring-2 ring-green-100">
                    {data.image_url ? (
                        <Image 
                            src={data.image_url} 
                            alt={data.title} 
                            fill 
                            className="object-cover" 
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                            <User className="w-8 h-8" />
                        </div>
                    )}
                </div>
            </div>
            
            <div className="text-center sm:text-left pt-2">
                <h2 className="text-2xl font-bold text-gray-800">{data.title}</h2>
                {data.subtitle && (
                    <p className="text-green-600 font-medium text-sm mt-1">{data.subtitle}</p>
                )}
                <div className="h-1 w-12 bg-green-500 rounded-full mt-3 mx-auto sm:mx-0"></div>
            </div>
        </div>

        {/* Content */}
        <div className="prose prose-base text-gray-600 leading-relaxed text-justify flex-1">
            {data.content}
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between text-sm text-gray-400">
            <span className="font-medium">পরিচালকের বার্তা</span>
            <Quote className="w-6 h-6 text-green-200" />
        </div>
      </div>
    </div>
  );
}
