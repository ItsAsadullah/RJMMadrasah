"use client";

import { Users, GraduationCap, FileText, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function DashboardPage() {
  // ডামি ডেটা (পরে আমরা ডেটাবেস থেকে আনব)
  const stats = [
    {
      title: "মোট শিক্ষার্থী",
      value: "১,২৫০",
      change: "+১২%",
      trend: "up",
      icon: <Users className="h-6 w-6 text-blue-600" />,
      bg: "bg-blue-100",
    },
    {
      title: "মোট শিক্ষক/শিক্ষিকা",
      value: "৪৫",
      change: "+২ জন",
      trend: "up",
      icon: <GraduationCap className="h-6 w-6 text-green-600" />,
      bg: "bg-green-100",
    },
    {
      title: "আজকের উপস্থিতি",
      value: "৯২%",
      change: "-৩%",
      trend: "down",
      icon: <FileText className="h-6 w-6 text-purple-600" />,
      bg: "bg-purple-100",
    },
    {
      title: "চলতি মাসে আয়",
      value: "৳ ১,৮০,০০০",
      change: "+৮%",
      trend: "up",
      icon: <Wallet className="h-6 w-6 text-orange-600" />,
      bg: "bg-orange-100",
    },
  ];

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
              <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
                stat.trend === "up" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
              }`}>
                {stat.change}
                {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              </span>
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
          <h2 className="text-lg font-bold text-gray-800 mb-4">সাম্প্রতিক নোটিশ</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                <div className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded">
                  ১২ই মে
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-800">ঈদুল ফিতরের ছুটি ঘোষণা</h4>
                  <p className="text-xs text-gray-500 mt-1">আগামী ১৫ই মে থেকে মাদ্রাসা বন্ধ থাকবে...</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* কুইক অ্যাকশন বা শর্টকাট */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">দ্রুত এক্সেস</h2>
          <div className="grid grid-cols-2 gap-4">
             <button className="p-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all flex flex-col items-center gap-2">
                <Users className="h-6 w-6" />
                <span className="text-sm font-medium">নতুন ভর্তি</span>
             </button>
             <button className="p-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all flex flex-col items-center gap-2">
                <FileText className="h-6 w-6" />
                <span className="text-sm font-medium">নোটিশ আপলোড</span>
             </button>
             <button className="p-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all flex flex-col items-center gap-2">
                <Wallet className="h-6 w-6" />
                <span className="text-sm font-medium">বেতন গ্রহণ</span>
             </button>
             <button className="p-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all flex flex-col items-center gap-2">
                <GraduationCap className="h-6 w-6" />
                <span className="text-sm font-medium">রেজাল্ট এন্ট্রি</span>
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}