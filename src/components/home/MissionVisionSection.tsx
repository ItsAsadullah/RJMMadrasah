"use client";

import { Target, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function MissionVisionSection() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("home_sections")
        .select("*")
        .eq("section_key", "mission_vision")
        .maybeSingle();
      if (data) setData(data);
    };
    fetchData();
  }, []);

  const mission = data?.additional_data?.mission || "কুরআন ও সুন্নাহর আলোকে চরিত্রবান ও আদর্শ নারী সমাজ গঠন করা। আধুনিক শিক্ষার সমন্বয়ে যুগোপযোগী শিক্ষা প্রদান।";
  const vision = data?.additional_data?.vision || "শিক্ষার্থীদের মেধা ও মননের সঠিক বিকাশ সাধন। নৈতিক ও মানবিক মূল্যবোধ সম্পন্ন সুনাগরিক হিসেবে গড়ে তোলা।";

  const items = [
    {
      icon: <Target className="w-10 h-10 text-green-600" />,
      title: "আমাদের লক্ষ্য",
      description: mission
    },
    {
      icon: <Eye className="w-10 h-10 text-green-600" />,
      title: "আমাদের উদ্দেশ্য",
      description: vision
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800">{data?.title || "লক্ষ্য ও উদ্দেশ্য"}</h2>
            <div className="h-1.5 w-24 bg-green-500 mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {items.map((item, index) => (
            <div key={index} className="flex flex-col items-center text-center p-8 bg-green-50 rounded-2xl border border-green-100 hover:shadow-lg transition-all group">
              <div className="bg-white p-4 rounded-full shadow-sm mb-6 group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed text-lg">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
