import { BookOpen, GraduationCap, ShieldCheck, HeartHandshake } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "সহীহ কুরআন শিক্ষা",
    desc: "আন্তর্জাতিক মানের কারিকুলাম অনুসরণ করে অভিজ্ঞ হাফেজ ও কারী দ্বারা সহীহ ও শুদ্ধভাবে কুরআন তিলাওয়াত, নাজেরা ও হিফজ শিক্ষা প্রদান করা হয়। প্রতিটি ছাত্রীর জন্য বিশেষ যত্ন ও তাজবীদ ক্লাসের ব্যবস্থা রয়েছে।"
  },
  {
    icon: GraduationCap,
    title: "মানসম্মত শিক্ষা",
    desc: "ইসলামী শিক্ষার পাশাপাশি আধুনিক সাধারণ শিক্ষার (বাংলা, ইংরেজি, গণিত) সুষম সমন্বয়। অভিজ্ঞ ও উচ্চশিক্ষিত শিক্ষকমণ্ডলী দ্বারা পাঠদান এবং নিয়মিত মানোন্নয়ন ও কাউন্সিলিং করা হয়।"
  },
  {
    icon: ShieldCheck,
    title: "নিরাপদ ও মনোরম পরিবেশ",
    desc: "বালিকাদের জন্য সম্পূর্ণ পর্দা মেইনটেইন করে সিসি ক্যামেরা দ্বারা নিয়ন্ত্রিত নিরাপদ ও আলাদা ক্যাম্পাস। মনোরম ও কোলাহলমুক্ত পরিবেশে পাঠদানের সুব্যবস্থা নিশ্চিত করা হয়।"
  },
  {
    icon: HeartHandshake,
    title: "নৈতিক ও চারিত্রিক গঠন",
    desc: "শুধুমাত্র পুথিগত বিদ্যা নয়, বরং সুন্নতী জিন্দেগী যাপন, আদব-কায়দা ও নৈতিক চরিত্র গঠনের প্রতি বিশেষ গুরুত্ব দেওয়া হয়। নিয়মিত তারবিয়াতী মজলিসের মাধ্যমে আমল-আখলাক সুন্দর করা হয়।"
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-8 md:py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800">আমাদের বৈশিষ্ট্যসমূহ</h2>
        <div className="h-1.5 w-24 bg-green-500 mx-auto mt-4 rounded-full"></div>
        <p className="text-gray-500 mt-4 text-base md:text-lg max-w-2xl mx-auto">
          কেন আপনার সন্তানের জন্য রহিমা জান্নাত মহিলা মাদ্রাসা সেরা? আমাদের অনন্য বৈশিষ্ট্যগুলো জানুন।
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 text-center group cursor-default h-full flex flex-col items-center">
            {/* Icon Wrapper */}
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6 group-hover:bg-green-600 transition-all duration-300 relative overflow-hidden">
                {/* Background Effect */}
                <div className="absolute inset-0 bg-green-600 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-full origin-center opacity-100" />
                
                {/* Icon */}
                <feature.icon className="h-10 w-10 text-green-600 group-hover:text-white transition-colors duration-300 relative z-10" />
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-4 group-hover:text-green-700 transition-colors">{feature.title}</h3>
            <p className="text-gray-600 leading-relaxed text-[15px] text-justify md:text-center">
              {feature.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
