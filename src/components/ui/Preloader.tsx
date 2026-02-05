"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function Preloader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 2;
      });
    }, 20);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 bg-[url('/images/pattern.png')] bg-repeat" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Long Logo Animation */}
        <div className="flex flex-col items-center animate-fade-in-up">
           <div className="relative w-[350px] h-[120px] md:w-[650px] md:h-[220px] animate-bounce-slow">
              <Image 
                src="/images/long_logo.svg"
                alt="Rahima Jannat Mohila Madrasa"
                fill
                className="object-contain"
                priority
              />
           </div>
           <p className="text-green-600 font-medium text-lg mt-4 tracking-wider animate-pulse">
             লোডিং হচ্ছে... {progress}%
           </p>
        </div>

        {/* Progress Bar */}
        <div className="w-80 h-2 bg-gray-100 rounded-full overflow-hidden">
           <div 
             className="h-full bg-green-600 rounded-full transition-all duration-300 ease-out"
             style={{ width: `${progress}%` }}
           />
        </div>
      </div>
    </div>
  );
}
