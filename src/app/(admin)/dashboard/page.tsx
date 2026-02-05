"use client";

import { useEffect, useState } from "react";
import { Users, GraduationCap, FileText, Wallet, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { getDashboardStats } from "./actions";
import Link from "next/link";

const toBengaliNumber = (num: any) => String(num).replace(/[0-9]/g, c => "০১২৩৪৫৬৭৮৯"[parseInt(c)]);

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    attendancePercentage: 0,
    totalIncome: 0,
    notices: [] as any[]
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await getDashboardStats();
        setData(stats);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const stats = [
    {
      title: "মোট শিক্ষার্থী",
      value: toBengaliNumber(data.totalStudents),
      change: "অ্যাক্টিভ", // Static for now
      trend: "neutral",
      icon: <Users className="h-6 w-6 text-blue-600" />,
      bg: "bg-blue-100",
    },
    {
      title: "মোট শিক্ষক/শিক্ষিকা",
      value: toBengaliNumber(data.totalTeachers),
      change: "বর্তমান",
      trend: "neutral",
      icon: <GraduationCap className="h-6 w-6 text-green-600" />,
      bg: "bg-green-100",
    },
    {
      title: "আজকের উপস্থিতি",
      value: `${toBengaliNumber(data.attendancePercentage)}%`,
      change: "গড়",
      trend: "neutral",
      icon: <FileText className="h-6 w-6 text-purple-600" />,
      bg: "bg-purple-100",
    },
    {
      title: "চলতি মাসে আয়",
      value: `৳ ${toBengaliNumber(data.totalIncome)}`,
      change: "হিসাব",
      trend: "up",
      icon: <Wallet className="h-6 w-6 text-orange-600" />,
      bg: "bg-orange-100",
    },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-10 h-10 animate-spin text-green-600" /></div>;
  }

  return (
    <div className="space-y-8">
      
      {/* হেডার */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ড্যাশবোর্ড ওভারভিউ</h1>
        <p className="text-sm text-gray-500">স্বাগতম, অ্যাডমিন প্যানেলে ফিরে আসার জন্য ধন্যবাদ।</p>
      </div>

      {/* স্ট্যাটাস কার্ড গ্রিড */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-3 rounded-lg`}>
                {stat.icon}
              </div>
              {/* Trend removed for simplicity or keep as static */}
            </div>
            <h3 className="text-gray-500 text-sm font-medium">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* রিসেন্ট অ্যাক্টিভিটি এবং কুইক অ্যাকশন (নিচের অংশ) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* রিসেন্ট নোটিশ */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-bold text-gray-800">সাম্প্রতিক নোটিশ</h2>
             <Link href="/dashboard/notices" className="text-xs text-green-600 hover:underline">সব দেখুন</Link>
          </div>
          
          <div className="space-y-4">
            {data.notices.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">কোনো নোটিশ নেই</p>
            ) : (
                data.notices.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                    <div className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded min-w-[80px] text-center">
                      {new Date(item.created_at).toLocaleDateString('bn-BD')}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800">{item.title}</h4>
                      {/* <p className="text-xs text-gray-500 mt-1">বিস্তারিত দেখতে ক্লিক করুন...</p> */}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* কুইক অ্যাকশন বা শর্টকাট */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">দ্রুত এক্সেস</h2>
          <div className="grid grid-cols-2 gap-4">
             <Link href="/dashboard/students/add" className="p-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all flex flex-col items-center gap-2">
                <Users className="h-6 w-6" />
                <span className="text-sm font-medium">নতুন ভর্তি</span>
             </Link>
             <Link href="/dashboard/notices" className="p-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all flex flex-col items-center gap-2">
                <FileText className="h-6 w-6" />
                <span className="text-sm font-medium">নোটিশ আপলোড</span>
             </Link>
             <Link href="/dashboard/accounts" className="p-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all flex flex-col items-center gap-2">
                <Wallet className="h-6 w-6" />
                <span className="text-sm font-medium">বেতন গ্রহণ</span>
             </Link>
             <Link href="/dashboard/results" className="p-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all flex flex-col items-center gap-2">
                <GraduationCap className="h-6 w-6" />
                <span className="text-sm font-medium">রেজাল্ট এন্ট্রি</span>
             </Link>
          </div>
        </div>

      </div>
    </div>
  );
}