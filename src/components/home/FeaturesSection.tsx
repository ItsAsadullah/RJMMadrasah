import { BookOpen, GraduationCap, ShieldCheck, HeartHandshake, Check } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "সহীহ কুরআন শিক্ষা",
    points: [
      "আন্তর্জাতিক মানের কারিকুলাম অনুসরণ",
      "অভিজ্ঞ হাফেজ ও কারী দ্বারা পাঠদান",
      "সহীহ মাখরাজ ও তাজবীদ শিক্ষা",
      "নাজেরা ও হিফজ বিভাগের বিশেষ যত্ন"
    ]
  },
  {
    icon: GraduationCap,
    title: "মানসম্মত শিক্ষা",
    points: [
      "ইসলামী ও আধুনিক শিক্ষার সুষম সমন্বয়",
      "বাংলা, ইংরেজি ও গণিত বিষয়ে গুরুত্বারোপ",
      "অভিজ্ঞ ও উচ্চশিক্ষিত শিক্ষকমণ্ডলী",
      "নিয়মিত মানোন্নয়ন ও কাউন্সিলিং"
    ]
  },
  {
    icon: ShieldCheck,
    title: "নিরাপদ ও মনোরম পরিবেশ",
    points: [
      "বালিকাদের জন্য সম্পূর্ণ পর্দা মেইনটেইন",
      "সিসি ক্যামেরা দ্বারা নিয়ন্ত্রিত ক্যাম্পাস",
      "মনোরম ও কোলাহলমুক্ত পরিবেশ",
      "নিরাপদ ও আলাদা ক্যাম্পাস নিশ্চিতকরণ"
    ]
  },
  {
    icon: HeartHandshake,
    title: "নৈতিক ও চারিত্রিক গঠন",
    points: [
      "সুন্নতী জিন্দেগী যাপনের অনুশীলন",
      "আদব-কায়দা ও শিষ্টাচার শিক্ষা",
      "নিয়মিত তারবিয়াতী মজলিস",
      "আমল-আখলাক সুন্দর করার প্রচেষ্টা"
    ]
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
          <div key={index} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group cursor-default h-full flex flex-col items-center">
            {/* Icon Wrapper */}
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-5 group-hover:bg-green-600 transition-all duration-300 relative overflow-hidden shrink-0">
                {/* Background Effect */}
                <div className="absolute inset-0 bg-green-600 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-full origin-center opacity-100" />
                
                {/* Icon */}
                <feature.icon className="h-8 w-8 text-green-600 group-hover:text-white transition-colors duration-300 relative z-10" />
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-5 group-hover:text-green-700 transition-colors text-center h-14 flex items-center justify-center">{feature.title}</h3>
            
            <ul className="space-y-3 w-full text-left px-1">
              {feature.points.map((point, idx) => (
                <li key={idx} className="flex items-start text-gray-600 text-[15px] group/item">
                  <span className="mr-3 text-green-500 mt-0.5 bg-green-50 rounded-full p-1 group-hover/item:bg-green-100 transition-colors">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
