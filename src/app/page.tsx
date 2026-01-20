import HeroSection from "@/components/home/HeroSection";
import NoticeTicker from "@/components/home/NoticeTicker"; // ইম্পোর্ট করা হলো
import { BookOpen, GraduationCap, Users, Clock, CheckCircle2 } from "lucide-react";

export default function Home() {
  
  // মাদ্রাসার বৈশিষ্ট্যসমূহ (ডাটা)
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
    <div className="space-y-0 pb-10"> {/* গ্যাপ কমানো হয়েছে */}
      
      {/* ১. স্ক্রলিং নোটিশ (Navbar এর ঠিক নিচে) */}
      <NoticeTicker />

      {/* বাকি কন্টেন্ট একটু নিচে থাকবে */}
      <div className="space-y-12 mt-4"> 
        
        {/* ২. হিরো সেকশন (ব্যানার) */}
        <HeroSection />

        {/* ৩. বৈশিষ্ট্য সেকশন */}
        <section className="py-4 md:py-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">আমাদের বৈশিষ্ট্যসমূহ</h2>
            <div className="h-1 w-16 md:w-24 bg-green-500 mx-auto mt-2 rounded-full"></div>
            <p className="text-gray-500 mt-3 text-sm md:text-base">কেন আপনার সন্তানের জন্য রহিমা জান্নাত মাদ্রাসা সেরা?</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-green-50 hover:shadow-md hover:border-green-200 transition-all text-center group cursor-pointer">
                <div className="bg-green-50 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-100 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ৪. লক্ষ্য ও উদ্দেশ্য */}
        <section className="bg-green-50 rounded-2xl p-6 md:p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <h2 className="text-2xl font-bold text-green-800">আমাদের লক্ষ্য ও উদ্দেশ্য</h2>
            <p className="text-gray-700 leading-relaxed">
              আমরা বিশ্বাস করি প্রতিটি শিশুই অমিত সম্ভাবনাময়। রহিমা জান্নাত মহিলা মাদ্রাসার লক্ষ্য হলো সেই সম্ভাবনাকে জাগিয়ে তোলা। 
              আমরা চাই আমাদের ছাত্রীরা দ্বীনি ইলমের পাশাপাশি জাগতিক শিক্ষায়ও পারদর্শী হয়ে উঠুক। 
              একজন আদর্শ মা ও দ্বীনের দায়ী হিসেবে তারা যেন সমাজে ভূমিকা রাখতে পারে, সেই লক্ষ্যেই আমাদের পথচলা।
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mt-4">
               <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600"/> সম্পূর্ণ আবাসিক/অনাবাসিক ব্যবস্থা</li>
               <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600"/> সিসি ক্যামেরা দ্বারা নিয়ন্ত্রিত</li>
               <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600"/> বিশুদ্ধ খাবার পানি ও সুষম খাবার</li>
               <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600"/> সার্বক্ষণিক বিদ্যুৎ ও জেনারেটর</li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
}