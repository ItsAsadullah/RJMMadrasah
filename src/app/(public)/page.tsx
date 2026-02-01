import HeroSection from "@/components/home/HeroSection";
import NoticeTicker from "@/components/home/NoticeTicker";
import DirectorMessage from "@/components/home/DirectorMessage";
import QuotesSection from "@/components/home/QuotesSection";
import AboutSection from "@/components/home/AboutSection";
import MissionVisionSection from "@/components/home/MissionVisionSection";
import DepartmentsSection from "@/components/home/DepartmentsSection";
import BranchesSection from "@/components/home/BranchesSection";
import TeachersSection from "@/components/home/TeachersSection";
import { BookOpen, GraduationCap, Users, Clock } from "lucide-react";

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
    <div className="flex flex-col w-full font-[Kalpurush]">
      
      {/* ১. নোটিশ টিকার */}
      <div className="w-full bg-white border-b border-green-100">
        <NoticeTicker />
      </div>

      {/* ২. হিরো সেকশন */}
      <HeroSection />

      {/* ৩. মেইন কন্টেন্ট */}
      <div className="w-full bg-gray-50/50">
        
        {/* ৪. পরিচালকের বাণী ও ইসলামিক বাণী (Grid Layout) */}
        <section className="py-16 container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Director Message (7 Columns) */}
                <div className="lg:col-span-7 h-full">
                    <DirectorMessage />
                </div>
                
                {/* Right: Islamic Quotes (5 Columns) */}
                <div className="lg:col-span-5 h-full">
                    <QuotesSection />
                </div>
            </div>
        </section>

        {/* ৫. আমাদের সম্পর্কে */}
        <AboutSection />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
          
          {/* বৈশিষ্ট্য সেকশন (Static) */}
          <section>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800">আমাদের বৈশিষ্ট্যসমূহ</h2>
              <div className="h-1.5 w-24 bg-green-500 mx-auto mt-4 rounded-full"></div>
              <p className="text-gray-500 mt-4 text-base md:text-lg">কেন আপনার সন্তানের জন্য রহিমা জান্নাত মহিলা মাদ্রাসা সেরা?</p>
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

          {/* লক্ষ্য ও উদ্দেশ্য (Dynamic) */}
          <MissionVisionSection />

          {/* শাখা পরিচিতি (Dynamic) */}
          <BranchesSection />

          {/* গর্বিত শিক্ষকমণ্ডলী (Dynamic) */}
          <TeachersSection />

          {/* বিভাগসমূহ (Dynamic) */}
          <DepartmentsSection />

        </div>
      </div>
    </div>
  );
}
