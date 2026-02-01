"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { MapPin, GitBranch } from "lucide-react";

export default function BranchesSection() {
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    const fetchBranches = async () => {
      const { data } = await supabase
        .from("branches")
        .select("*")
        .eq("is_active", true)
        .order("id", { ascending: true });
      if (data) setBranches(data);
    };
    fetchBranches();
  }, []);

  if (branches.length === 0) return null;

  return (
    <section className="py-24 bg-white relative">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <span className="p-2 bg-green-100 rounded-lg text-green-600">
                        <GitBranch className="w-6 h-6" />
                    </span>
                    <span className="text-green-600 font-bold uppercase tracking-widest text-sm">আমাদের শাখাসমূহ</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">ছড়িয়ে ছিটিয়ে থাকা <span className="text-green-600">জ্ঞানের প্রদীপ</span></h2>
            </div>
            
            <div className="hidden md:block">
                <p className="text-gray-500 max-w-md text-right">আমাদের প্রতিটি শাখায় রয়েছে অভিজ্ঞ শিক্ষকমণ্ডলী এবং মনোরম পরিবেশ।</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {branches.map((branch, index) => (
                <div key={branch.id} className="group relative bg-white rounded-[2rem] border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden hover:-translate-y-2">
                    {/* Map Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/2000px-World_map_blank_without_borders.svg.png')] bg-cover bg-center"></div>
                    
                    <div className="relative p-8 z-10 h-full flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-green-200 transform group-hover:scale-110 transition-transform duration-500">
                                {branch.name[0]}
                            </div>
                            <div className="bg-green-50 px-3 py-1 rounded-full text-xs font-bold text-green-700">
                                শাখা #{index + 1}
                            </div>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-green-600 transition-colors">{branch.name}</h3>
                        
                        {branch.address && (
                            <div className="flex items-start gap-3 text-gray-500 mt-auto bg-gray-50 p-4 rounded-xl group-hover:bg-green-50/50 transition-colors">
                                <MapPin className="w-5 h-5 mt-0.5 text-green-500 flex-shrink-0" />
                                <p className="text-sm leading-relaxed font-medium">{branch.address}</p>
                            </div>
                        )}
                        
                        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-green-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tl-[100px]"></div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
}
