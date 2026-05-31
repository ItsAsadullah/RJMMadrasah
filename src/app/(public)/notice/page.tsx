"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Bell, 
  Calendar, 
  Search, 
  FileText, 
  Download, 
  Link as LinkIcon, 
  Loader2,
  ChevronRight,
  X,
  Filter,
  Printer,
  Paperclip
} from "lucide-react";
import NoticeDetail from "@/components/notice/NoticeDetail";

type Notice = {
  id: string;
  title: string;
  content: string;
  file_url: string;
  google_drive_link: string;
  created_at: string;
};

export default function PublicNoticePage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  // ফিল্টার স্টেট
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Selected notice for detail view
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  async function fetchNotices() {
    setLoading(true);
    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setNotices(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchNotices();
  }, []);

  // অ্যাডভান্সড ফিল্টার লজিক
  const filteredNotices = notices.filter(notice => {
    // ১. নাম/শিরোনাম দিয়ে সার্চ
    const matchesTitle = notice.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    // ২. তারিখ দিয়ে ফিল্টার
    let matchesDate = true;
    if (filterDate) {
      const noticeDate = new Date(notice.created_at).toISOString().split('T')[0]; // YYYY-MM-DD ফরম্যাট
      matchesDate = noticeDate === filterDate;
    }

    return matchesTitle && matchesDate;
  });

  // ফিল্টার রিসেট ফাংশন
  const clearFilters = () => {
    setSearchTerm("");
    setFilterDate("");
  };

  // If a notice is selected, show the detail view
  if (selectedNotice) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-6 sm:py-10 px-4 sm:px-6">
        <NoticeDetail 
          notice={selectedNotice} 
          onBack={() => setSelectedNotice(null)} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* হেডার সেকশন — ইম্প্রুভড ডিজাইন */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-emerald-100 to-green-50 rounded-full mb-2 shadow-sm">
            <Bell className="w-8 h-8 text-emerald-700" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight">
            নোটিশ বোর্ড
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            মাদ্রাসার সকল প্রকার বিজ্ঞপ্তি, ছুটির ঘোষণা এবং পরীক্ষার রুটিন এখানে প্রকাশ করা হয়।
            যেকোনো নোটিশে ক্লিক করে PDF ডাউনলোড বা প্রিন্ট করতে পারবেন।
          </p>
          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-medium border border-emerald-100">
              <Printer className="w-3.5 h-3.5" /> প্রিন্ট করুন
            </span>
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-100">
              <Download className="w-3.5 h-3.5" /> PDF ডাউনলোড
            </span>
          </div>
        </div>

        {/* সার্চ এবং ফিল্টার সেকশন */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            
            {/* সার্চ ইনপুট */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                type="text" 
                placeholder="নোটিশ খুঁজুন (শিরোনাম)..." 
                className="pl-10 h-12 text-base rounded-xl border-gray-200 focus:ring-green-500 focus:border-green-500 bg-gray-50/50 focus:bg-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* তারিখ ফিল্টার */}
            <div className="relative w-full md:w-auto">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <Input 
                type="date" 
                className="pl-10 h-12 w-full md:w-48 text-base rounded-xl border-gray-200 focus:ring-green-500 bg-gray-50/50 focus:bg-white transition-all cursor-pointer"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>

            {/* ক্লিয়ার বাটন (যদি ফিল্টার থাকে) */}
            {(searchTerm || filterDate) && (
              <Button 
                onClick={clearFilters}
                variant="ghost" 
                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-12 px-4 rounded-xl flex items-center gap-2"
              >
                <X className="w-4 h-4" /> রিসেট
              </Button>
            )}
          </div>
        </div>

        {/* রেজাল্ট কাউন্ট */}
        {!loading && (
          <div className="text-center text-sm text-gray-500">
            মোট {filteredNotices.length} টি বিজ্ঞপ্তি পাওয়া গেছে
          </div>
        )}

        {/* নোটিশ গ্রিড — উন্নত ডিজাইন */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-medium text-gray-600">কোনো বিজ্ঞপ্তি পাওয়া যায়নি</h3>
            <p className="text-gray-400 mt-2">আপনার সার্চ ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
            {(searchTerm || filterDate) && (
              <Button onClick={clearFilters} variant="link" className="text-green-600 mt-2">
                সব ফিল্টার মুছে ফেলুন
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {filteredNotices.map((notice, index) => (
              <div 
                key={notice.id} 
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 cursor-pointer group flex flex-col h-full overflow-hidden"
                onClick={() => setSelectedNotice(notice)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Green top accent */}
                <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600 group-hover:h-2 transition-all duration-300"></div>
                
                <div className="p-5 sm:p-6 flex flex-col h-full">
                  {/* Date and attachment badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-medium">
                        {new Date(notice.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    {(notice.file_url || notice.google_drive_link) && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium border border-blue-100 flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        ফাইল সংযুক্ত
                      </span>
                    )}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                    {notice.title}
                  </h3>
                  
                  {/* HTML কন্টেন্টের প্রিভিউ */}
                  <div 
                    className="text-gray-500 text-sm line-clamp-3 mb-4 flex-grow leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: notice.content }}
                  />

                  {/* Bottom action row */}
                  <div className="flex items-center justify-between border-t pt-4 mt-auto">
                    <div className="flex items-center text-emerald-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                      বিস্তারিত দেখুন <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Printer className="w-3 h-3" /> PDF
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}