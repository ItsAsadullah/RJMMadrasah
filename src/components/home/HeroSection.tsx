"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative h-[600px] md:h-[700px] w-full flex items-center justify-center overflow-hidden">
      
      {/* ১. ব্যাকগ্রাউন্ড ইমেজ (পুরো স্ক্রিন জুড়ে) */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1564121211835-e88c852648ab?q=80&w=2070&auto=format&fit=crop')", 
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* কালো/সবুজ শেড (Overlay) */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 via-green-800/80 to-green-900/40" />
      </div>

      {/* ২. প্রধান লেখা ও বাটন (মাঝখানে সীমাবদ্ধ থাকবে) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
        <div className="max-w-3xl space-y-8">
            {/* অ্যানিমেশন ইফেক্ট */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <span className="inline-block py-1.5 px-4 rounded-full bg-white/20 text-white text-sm font-medium backdrop-blur-sm border border-white/30 mb-6 shadow-lg">
                বিসমিল্লাহির রাহমানির রাহীম
                </span>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                রহিমা জান্নাত <br/> <span className="text-green-300">মহিলা মাদ্রাসা</span>
                </h1>
                <p className="text-gray-100 text-lg md:text-xl mt-6 leading-relaxed opacity-90 max-w-2xl">
                কুরআন ও সুন্নাহর আলোকে আদর্শ নারী গড়ার একটি নির্ভরযোগ্য দ্বীনি শিক্ষা প্রতিষ্ঠান। 
                আধুনিক শিক্ষার সমন্বয়ে আমরা গড়ে তুলছি আগামীর ভবিষ্যৎ।
                </p>
            </motion.div>
            
            {/* বাটনসমূহ */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4 mt-8"
            >
              <Link href="/admission">
                <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white font-bold text-lg h-14 px-8 shadow-lg shadow-green-900/20 border-2 border-transparent">
                  <BookOpen className="mr-2 h-5 w-5" />
                  ভর্তি তথ্য দেখুন
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-green-800 font-bold text-lg h-14 px-8 bg-transparent">
                  যোগাযোগ করুন
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
        </div>
      </div>
    </section>
  );
}