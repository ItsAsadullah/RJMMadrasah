import HeroSection from "@/components/home/HeroSection";
import NoticeTicker from "@/components/home/NoticeTicker";
import { BookOpen, GraduationCap, Users, Clock, CheckCircle2 } from "lucide-react";

export default function Home() {
  
  const features = [
    {
      icon: <BookOpen className="h-8 w-8 text-green-600" />,
      title: "কুরআন শিক্ষা",
      desc: "সহীহ ও শুদ্ধভাবে কুরআন তিলাওয়াত, নাজেরা ও হিফজ শিক্ষা প্রদান।"
    },
    {
      icon: <GraduationCap className="h-8 w-8 text-green-600" />,
      title: "মানসম্মত শিক্ষা",
      desc: "অভিজ্ঞ শিক্ষকমণ্ডলী দ্বারা পাঠদান ও নিয়মিত মানোন্নয়ন এবং কাউন্সিলিং।"
    },
    {
      icon: <Users className="h-8 w-8 text-green-600" />,
      title: "আলাদা ক্যাম্পাস",
      desc: "বালিকাদের জন্য সম্পূর্ণ পর্দা মেইনটেইন করে নিরাপদ ও আলাদা ক্যাম্পাস।"
    },
    {
      icon: <Clock className="h-8 w-8 text-green-600" />,
      title: "নিয়মিত ক্লাস",
      desc: "রুটিন মাফিক ক্লাস, সাপ্তাহিক পরীক্ষা এবং প্রগ্রেস রিপোর্ট প্রদান।"
    }
  ];

  return (
    <div className="flex flex-col w-full">
      
      {/* ১. নোটিশ টিকার (পুরো স্ক্রিন জুড়ে) */}
      <div className="w-full bg-white border-b border-green-100">
        <NoticeTicker />
      </div>

      {/* ২. হিরো সেকশন (কম্পোনেন্টের ভেতরেই কন্টেইনার হ্যান্ডেল করা হয়েছে) */}
      <HeroSection />

      {/* ৩. মেইন কন্টেন্ট (মাঝখানে সীমাবদ্ধ থাকবে) */}
      <div className="w-full bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
          
          {/* বৈশিষ্ট্য সেকশন */}
          <section>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800">আমাদের বৈশিষ্ট্যসমূহ</h2>
              <div className="h-1.5 w-24 bg-green-500 mx-auto mt-4 rounded-full"></div>
              <p className="text-gray-500 mt-4 text-base md:text-lg">কেন আপনার সন্তানের জন্য রহিমা জান্নাত মাদ্রাসা সেরা?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all text-center group cursor-pointer">
                  <div className="bg-green-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-green-600 group-hover:rotate-6 transition-all">
                    <div className="group-hover:text-white transition-colors">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* লক্ষ্য ও উদ্দেশ্য সেকশন */}
          <section className="bg-gradient-to-br from-green-600 to-green-800 rounded-[2rem] p-8 md:p-16 text-white shadow-2xl relative overflow-hidden group">
            {/* ব্যাকগ্রাউন্ড ডেকোরেশন */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <h2 className="text-3xl md:text-5xl font-black leading-tight">আমাদের লক্ষ্য ও উদ্দেশ্য</h2>
                <p className="text-green-50 text-base md:text-lg leading-loose opacity-90 max-w-2xl">
                  আমরা বিশ্বাস করি প্রতিটি শিশুই অমিত সম্ভাবনাময়। রহিমা জান্নাত মহিলা মাদ্রাসার লক্ষ্য হলো সেই সম্ভাবনাকে জাগিয়ে তোলা। 
                  একজন আদর্শ মা ও দ্বীনের দায়ী হিসেবে তারা যেন সমাজে ভূমিকা রাখতে পারে, সেই লক্ষ্যেই আমাদের পথচলা।
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                   {[
                     "সম্পূর্ণ আবাসিক/অনাবাসিক ব্যবস্থা",
                     "সিসি ক্যামেরা দ্বারা নিয়ন্ত্রিত",
                     "বিশুদ্ধ খাবার পানি ও সুষম খাবার",
                     "সার্বক্ষণিক বিদ্যুৎ ও জেনারেটর"
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
                       <CheckCircle2 className="w-5 h-5 text-green-300 flex-shrink-0" />
                       <span className="text-sm font-medium">{item}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}