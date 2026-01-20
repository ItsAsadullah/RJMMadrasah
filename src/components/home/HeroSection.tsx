"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative h-[500px] md:h-[600px] flex items-center justify-center overflow-hidden rounded-2xl md:rounded-3xl my-2 md:my-4 mx-0 shadow-lg md:shadow-2xl">
      
      {/* ব্যাকগ্রাউন্ড ইমেজ */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          // একটি সুন্দর ইসলামিক আর্কিটেকচার বা মাদ্রাসার ডামি ছবি
          backgroundImage: "url('https://images.unsplash.com/photo-1564121211835-e88c852648ab?q=80&w=2070&auto=format&fit=crop')", 
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* কালো/সবুজ শেড (Overlay) যেন লেখা স্পষ্ট দেখা যায় */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 to-green-800/60" />
      </div>

      {/* প্রধান লেখা ও বাটন */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-6">
        
        {/* অ্যানিমেশন ইফেক্ট */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <span className="inline-block py-1 px-3 rounded-full bg-white/20 text-white text-xs md:text-sm font-medium backdrop-blur-sm border border-white/30 mb-4">
            বিসমিল্লাহির রাহমানির রাহীম
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            রহিমা জান্নাত <span className="text-green-300">মহিলা মাদ্রাসা</span>
            </h1>
            <p className="text-gray-100 text-sm md:text-xl mt-4 max-w-2xl mx-auto leading-relaxed opacity-90">
            কুরআন ও সুন্নাহর আলোকে আদর্শ নারী গড়ার একটি নির্ভরযোগ্য দ্বীনি শিক্ষা প্রতিষ্ঠান। 
            আধুনিক শিক্ষার সমন্বয়ে আমরা গড়ে তুলছি আগামীর ভবিষ্যৎ।
            </p>
        </motion.div>
        
        {/* বাটনসমূহ */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
        >
          <Link href="/admission">
            <Button size="lg" className="bg-white text-green-800 hover:bg-gray-100 w-full sm:w-auto font-bold text-base h-12 shadow-lg">
              <BookOpen className="mr-2 h-5 w-5" />
              ভর্তি তথ্য দেখুন
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 hover:text-white w-full sm:w-auto font-bold text-base h-12 bg-transparent">
              যোগাযোগ করুন
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}