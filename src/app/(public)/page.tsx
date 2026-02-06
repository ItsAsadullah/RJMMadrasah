import HeroSection from "@/components/home/HeroSection";
import NoticeTicker from "@/components/home/NoticeTicker";
import DirectorMessage from "@/components/home/DirectorMessage";
import QuotesSection from "@/components/home/QuotesSection";
import AboutSection from "@/components/home/AboutSection";
import MissionVisionSection from "@/components/home/MissionVisionSection";
import DepartmentsSection from "@/components/home/DepartmentsSection";
import BranchesSection from "@/components/home/BranchesSection";
import TeachersSection from "@/components/home/TeachersSection";
import FeaturesSection from "@/components/home/FeaturesSection";

export default function Home() {
  
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
          
          {/* বৈশিষ্ট্য সেকশন */}
          <FeaturesSection />

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
