"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { Bell } from "lucide-react";

export default function NoticeTicker() {
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotices = async () => {
      const { data } = await supabase
        .from("notices")
        .select("id, title")
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (data) setNotices(data);
    };
    fetchNotices();
  }, []);

  return (
    <div className="bg-white border-b-2 border-green-600 h-12 relative flex items-center shadow-md w-full overflow-hidden group">
      {/* Islamic Pattern Background */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
      
      {/* Label (Islamic Shape) */}
      <div className="bg-green-700 text-white h-full absolute left-0 z-20 flex items-center shadow-[4px_0_15px_rgba(0,0,0,0.2)]">
        <div className="px-5 h-full flex items-center gap-2 bg-green-800 relative z-10">
            <Bell className="w-5 h-5 animate-swing" />
            <span className="text-base font-bold tracking-wide">নোটিশ:</span>
        </div>
        {/* Decorative Arrow/Triangle */}
        <div className="h-full w-8 bg-green-800 relative -ml-4 z-0 transform skew-x-[-20deg] border-r-2 border-green-600"></div>
      </div>

      {/* স্ক্রলিং কন্টেইনার */}
      <div className="flex items-center w-full pl-36 md:pl-40 relative z-10">
        {notices.length === 0 ? (
            <div className="text-gray-500 font-medium italic text-sm animate-pulse px-4">
                বর্তমানে কোনো নতুন নোটিশ নেই। নিয়মিত ভিজিট করুন।
            </div>
        ) : (
            /* অ্যানিমেশন র‍্যাপার - এটি বিরামহীনভাবে ঘুরবে */
            <div className="flex animate-marquee whitespace-nowrap will-change-transform">
            
            {/* নোটিশ সেট ১ */}
            {notices.map((notice, index) => (
                <Link 
                key={`set1-${index}`} 
                href="/notice" 
                className="text-base font-medium text-gray-800 hover:text-green-700 inline-flex items-center gap-2 transition-colors mx-8 font-kalpurush"
                >
                <span className="w-2 h-2 rounded-full bg-green-600 block shadow-sm shadow-green-200"></span>
                {notice.title}
                </Link>
            ))}

            {/* নোটিশ সেট ২ (ডুপ্লিকেট - স্মুথ লুপের জন্য) */}
            {notices.map((notice, index) => (
                <Link 
                key={`set2-${index}`} 
                href="/notice" 
                className="text-base font-medium text-gray-800 hover:text-green-700 inline-flex items-center gap-2 transition-colors mx-8 font-kalpurush"
                >
                <span className="w-2 h-2 rounded-full bg-green-600 block shadow-sm shadow-green-200"></span>
                {notice.title}
                </Link>
            ))}

            </div>
        )}
      </div>

      {/* CSS Animation */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        .animate-marquee {
          animation: marquee 30s linear infinite;
          min-width: 100%;
        }

        @keyframes swing {
            0%, 100% { transform: rotate(0deg); }
            20% { transform: rotate(15deg); }
            40% { transform: rotate(-10deg); }
            60% { transform: rotate(5deg); }
            80% { transform: rotate(-5deg); }
        }

        .animate-swing {
            animation: swing 2s infinite ease-in-out;
            transform-origin: top center;
        }

        .group:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}