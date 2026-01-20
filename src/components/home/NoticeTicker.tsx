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

  if (notices.length === 0) return null;

  return (
    <div className="bg-white border-b border-green-100 h-10 relative flex items-center shadow-sm w-full overflow-hidden group">
      
      {/* Label (বাম পাশে ফিক্সড - Z-Index দিয়ে উপরে রাখা হয়েছে) */}
      <div className="bg-green-600 text-white px-4 h-full absolute left-0 z-20 flex items-center gap-2 shadow-[4px_0_10px_rgba(0,0,0,0.1)] pr-6" style={{clipPath: "polygon(0 0, 100% 0, 92% 100%, 0% 100%)"}}>
        <Bell className="w-4 h-4 animate-pulse" />
        <span className="text-sm font-bold pr-2">নোটিশ:</span>
      </div>

      {/* স্ক্রলিং কন্টেইনার */}
      <div className="flex items-center w-full">
        {/* অ্যানিমেশন র‍্যাপার - এটি বিরামহীনভাবে ঘুরবে */}
        <div className="flex animate-marquee whitespace-nowrap will-change-transform">
          
          {/* নোটিশ সেট ১ */}
          {notices.map((notice, index) => (
            <Link 
              key={`set1-${index}`} 
              href="/notice" 
              className="text-sm font-medium text-gray-700 hover:text-green-700 inline-flex items-center gap-2 transition-colors mx-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 block"></span>
              {notice.title}
            </Link>
          ))}

          {/* নোটিশ সেট ২ (ডুপ্লিকেট - স্মুথ লুপের জন্য) */}
          {notices.map((notice, index) => (
            <Link 
              key={`set2-${index}`} 
              href="/notice" 
              className="text-sm font-medium text-gray-700 hover:text-green-700 inline-flex items-center gap-2 transition-colors mx-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 block"></span>
              {notice.title}
            </Link>
          ))}

        </div>
      </div>

      {/* CSS Animation */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); } /* মোট দৈর্ঘ্যের অর্ধেক (এক সেট) সরে গিয়ে রিসেট হবে */
        }
        
        .animate-marquee {
          animation: marquee 15s linear infinite; /* স্পিড কন্ট্রোল করতে সময় (40s) বাড়ান/কমান */
          min-width: 100%;
        }

        /* মাউস হোভার করলে স্ক্রল থামবে */
        .group:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}