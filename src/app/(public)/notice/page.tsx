"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
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
  Filter
} from "lucide-react";

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

  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setNotices(data || []);
    setLoading(false);
  };

  // অ্যাডভান্সড ফিল্টার লজিক
  const filteredNotices = notices.filter(notice => {
    // ১. নাম/শিরোনাম দিয়ে সার্চ
    const matchesTitle = notice.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    // ২. তারিখ দিয়ে ফিল্টার
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

  const handleView = (notice: Notice) => {
    setSelectedNotice(notice);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* হেডার সেকশন */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-2">
            <Bell className="w-8 h-8 text-green-700" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">নোটিশ বোর্ড</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            মাদ্রাসার সকল প্রকার বিজ্ঞপ্তি, ছুটির ঘোষণা এবং পরীক্ষার রুটিন এখানে প্রকাশ করা হয়।
          </p>
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

            {/* ক্লিয়ার বাটন (যদি ফিল্টার থাকে) */}
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
            মোট {filteredNotices.length} টি বিজ্ঞপ্তি পাওয়া গেছে
          </div>
        )}

        {/* নোটিশ গ্রিড */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-medium text-gray-600">কোনো বিজ্ঞপ্তি পাওয়া যায়নি</h3>
            <p className="text-gray-400 mt-2">আপনার সার্চ ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
            {(searchTerm || filterDate) && (
              <Button onClick={clearFilters} variant="link" className="text-green-600 mt-2">
                সব ফিল্টার মুছে ফেলুন
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredNotices.map((notice) => (
              <div 
                key={notice.id} 
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all cursor-pointer group flex flex-col h-full"
                onClick={() => handleView(notice)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                    <Calendar className="w-4 h-4 text-green-600" />
                    {new Date(notice.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  {(notice.file_url || notice.google_drive_link) && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium border border-blue-100">
                      ফাইল সংযুক্ত
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-green-700 transition-colors line-clamp-2">
                  {notice.title}
                </h3>
                
                {/* HTML কন্টেন্টের প্রিভিউ */}
                <div 
                  className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: notice.content }}
                />

                <div className="flex items-center text-green-600 font-medium text-sm group-hover:translate-x-1 transition-transform border-t pt-4 mt-auto">
                  বিস্তারিত দেখুন <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* বিস্তারিত দেখার মোডাল */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold text-gray-800 leading-tight pr-8">
              {selectedNotice?.title}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 mt-2 text-gray-500">
              <Calendar className="w-4 h-4" />
              প্রকাশিত: {selectedNotice && new Date(selectedNotice.created_at).toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6 space-y-6">
            {/* মেইন কন্টেন্ট */}
            <div 
              className="prose prose-green prose-sm sm:prose-base max-w-none text-gray-700
                [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold
                [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:bg-gray-50 [&_blockquote]:py-2"
              dangerouslySetInnerHTML={{ __html: selectedNotice?.content || "<p>কোনো বিবরণ নেই</p>" }}
            />

            {/* ডাউনলোড বাটন */}
            {(selectedNotice?.file_url || selectedNotice?.google_drive_link) && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-6">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Download className="w-4 h-4" /> প্রয়োজনীয় ফাইল ও লিংক:
                </h4>
                <div className="flex flex-wrap gap-3">
                  {selectedNotice.file_url && (
                    <a href={selectedNotice.file_url} target="_blank" className="flex items-center gap-2 bg-white text-green-700 px-4 py-2.5 rounded-lg border border-green-200 hover:bg-green-50 hover:shadow-sm transition-all text-sm font-medium">
                      <FileText className="w-4 h-4" /> ডাউনলোড করুন
                    </a>
                  )}
                  {selectedNotice.google_drive_link && (
                    <a href={selectedNotice.google_drive_link} target="_blank" className="flex items-center gap-2 bg-white text-blue-700 px-4 py-2.5 rounded-lg border border-blue-200 hover:bg-blue-50 hover:shadow-sm transition-all text-sm font-medium">
                      <LinkIcon className="w-4 h-4" /> গুগল ড্রাইভ লিংক
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end pt-6 border-t mt-6">
            <Button onClick={() => setIsModalOpen(false)} className="bg-gray-800 text-white hover:bg-gray-900">
              বন্ধ করুন
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}