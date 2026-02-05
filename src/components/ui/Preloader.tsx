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

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Logo Animation */}
        <div className="relative w-32 h-32 md:w-40 md:h-40 animate-bounce-slow">
          <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20" />
          <div className="relative w-full h-full bg-white rounded-full shadow-xl p-4 flex items-center justify-center border-4 border-green-50">
             <Image
               src="/images/logo.png"
               alt="Madrasa Logo"
               width={120}
               height={120}
               className="object-contain"
               priority
             />
          </div>
        </div>

        {/* Text/Brand */}
        <div className="flex flex-col items-center animate-fade-in-up">
           <div className="relative w-64 h-16 md:w-80 md:h-20">
              <Image 
                src="/images/long_logo.svg"
                alt="Rahima Jannat Mohila Madrasa"
                fill
                className="object-contain"
              />
           </div>
           <p className="text-green-600 font-medium text-sm mt-2 tracking-wider animate-pulse">
             লোডিং হচ্ছে... {progress}%
           </p>
        </div>

        {/* Progress Bar */}
        <div className="w-64 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-4">
           <div 
             className="h-full bg-green-600 rounded-full transition-all duration-300 ease-out"
             style={{ width: `${progress}%` }}
           />
        </div>
      </div>
    </div>
  );
}
