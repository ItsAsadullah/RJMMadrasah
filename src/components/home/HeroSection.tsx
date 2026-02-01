"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { HeroContent } from "@/types";

export default function HeroSection() {
  const [slides, setSlides] = useState<HeroContent[]>([]);
  const [promos, setPromos] = useState<HeroContent[]>([]);
  const [videos, setVideos] = useState<HeroContent[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentPromo, setCurrentPromo] = useState(0);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(100);
  const videoRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('hero_content')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (data) {
        setSlides(data.filter(item => item.section === 'main_slider'));
        setPromos(data.filter(item => item.section === 'promo_banner'));
        setVideos(data.filter(item => item.section === 'video'));
      }
    };
    fetchData();
  }, []);

  // Main Slider Timer
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 10000); // 10 seconds duration
    return () => clearInterval(timer);
  }, [slides.length]);

  // Promo Slider Timer
  useEffect(() => {
    if (promos.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % promos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [promos.length]);

  const defaultBg = "https://images.unsplash.com/photo-1564121211835-e88c852648ab?q=80&w=2070&auto=format&fit=crop";

  const getVideoId = (url: string) => {
    try {
        const parts = url.split('/');
        return parts[parts.length - 1].split('?')[0];
    } catch (e) {
        return '';
    }
  };

  const getEmbedUrl = (url: string) => {
    try {
        const videoId = getVideoId(url);
        if (!videoId) return url;
        // Clean URL to prevent double query params
        return `https://www.youtube-nocookie.com/embed/${videoId}`;
    } catch (e) {
        return url;
    }
  };

  const toggleMute = () => {
    if (videoRef.current && videoRef.current.contentWindow) {
        const action = isMuted ? 'unMute' : 'mute';
        videoRef.current.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: action,
            args: []
        }), '*');
        
        if (isMuted) {
             // If unmuting, ensure volume is up
             videoRef.current.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: 'setVolume',
                args: [volume]
            }), '*');
        }
        
        setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseInt(e.target.value);
      setVolume(newVolume);
      
      if (videoRef.current && videoRef.current.contentWindow) {
          videoRef.current.contentWindow.postMessage(JSON.stringify({
              event: 'command',
              func: 'setVolume',
              args: [newVolume]
          }), '*');
          
          if (newVolume > 0 && isMuted) {
              // Auto unmute if volume is dragged up
              videoRef.current.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: 'unMute',
                args: []
            }), '*');
            setIsMuted(false);
          } else if (newVolume === 0 && !isMuted) {
             // Auto mute if volume is 0
              videoRef.current.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: 'mute',
                args: []
            }), '*');
            setIsMuted(true);
          }
      }
  };

  // Reset mute state when video changes
  useEffect(() => {
    setIsMuted(true);
    setVolume(100); 
  }, [currentVideo]);

  const YouTubeVolumeIcon = () => (
    <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%" fill="currentColor">
      <path d="M8,21 L12,21 L17,26 L17,10 L12,15 L8,15 L8,21 Z M19,14 L19,22 C20.48,21.32 21.5,19.77 21.5,18 C21.5,16.23 20.48,14.68 19,14 Z M19,8 L19,10 C22.64,10.93 25.5,14.25 25.5,18 C25.5,21.75 22.64,25.08 19,26 L19,28 C23.83,27.08 27.5,22.8 27.5,18 C27.5,13.2 23.83,8.92 19,8 Z"></path>
    </svg>
  );

  const YouTubeMuteIcon = () => (
    <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%" fill="currentColor">
      <path d="M8,21 L12,21 L17,26 L17,10 L12,15 L8,15 L8,21 Z M19,14 L19,22 C20.48,21.32 21.5,19.77 21.5,18 C21.5,16.23 20.48,14.68 19,14 Z M26,18 L29.53,21.53 L28.47,22.59 L25,19.06 L21.53,22.59 L20.47,21.53 L24,18 L20.47,14.47 L21.53,13.41 L25,16.94 L28.47,13.41 L29.53,14.47 L26,18 Z"></path>
       {/* Note: The above path is a generic cross. A more accurate YouTube mute often has a slash. 
           Let's use a standard path that resembles the "Speaker with X" or "Slash" commonly seen. 
           Actually, let's use the exact path for Mute from standard icon sets that look like YouTube's.
       */}
       <path d="m 21.48,17.98 c 0,-1.77 -1.02,-3.29 -2.5,-4.03 v 2.21 l 2.45,2.45 c .03,-0.2 .05,-0.41 .05,-0.63 z m 2.5,0 c 0,0.94 -0.2,1.82 -0.54,2.64 l 1.51,1.51 c 0.66,-1.24 1.03,-2.65 1.03,-4.15 0,-4.28 -2.99,-7.86 -7,-8.76 v 2.05 c 2.89,0.86 5,3.54 5,6.71 z M 9.25,8.98 l -1.27,1.26 4.72,4.73 H 7.98 v 6 H 11.98 l 5,5 v -6.73 l 4.25,4.25 c -0.67,0.52 -1.42,0.93 -2.25,1.18 v 2.06 c 1.38,-0.31 2.63,-0.95 3.69,-1.81 l 2.04,2.05 1.27,-1.27 -9,-9 -7.73,-7.73 z M 16.98,8.98 v -3.97 c -1.26,0.34 -2.42,0.93 -3.43,1.68 l 3.43,3.43 z" fill="currentColor"></path>
    </svg>
  );

  return (
    <section className="w-full max-w-[95%] xl:max-w-[1800px] mx-auto p-4 lg:p-6 gap-4 grid grid-cols-1 lg:grid-cols-12 h-auto lg:h-[700px]">
      
      {/* 1. Left Frame: Main Banner (8 cols) */}
      <div className="lg:col-span-8 relative rounded-2xl overflow-hidden shadow-2xl h-[400px] sm:h-[500px] lg:h-full group">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
            style={{
              backgroundImage: `url('${slides[currentSlide]?.content_url || defaultBg}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </AnimatePresence>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 via-green-800/60 to-transparent" />

        {/* Text Content */}
        <div className="relative z-10 h-full flex flex-col justify-center px-4 sm:px-6 md:px-12 text-white">
            <AnimatePresence mode="wait">
            <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                    <motion.span 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="block"
                    >
                        {slides[currentSlide]?.title}
                    </motion.span>
                    <motion.span 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-green-300 block mt-2"
                    >
                        {slides[currentSlide]?.subtitle}
                    </motion.span>
                </h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="text-gray-100 text-sm sm:text-lg md:text-xl mt-4 sm:mt-6 leading-relaxed opacity-90 max-w-2xl bg-black/20 p-3 sm:p-4 rounded-lg backdrop-blur-sm border-l-4 border-green-400"
                >
                    {slides[currentSlide]?.link}
                </motion.p>
            </motion.div>
            </AnimatePresence>
            
            <motion.div 
                key={`btn-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8"
            >
              <Link href="/admission">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg shadow-lg hover:shadow-green-500/30 transition-all duration-300 transform hover:scale-105 relative overflow-hidden group/btn w-full sm:w-auto">
                  <span className="relative z-10 flex items-center justify-center">
                    <BookOpen className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    ভর্তি তথ্য দেখুন
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-green-800 font-bold h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg shadow-lg bg-white/10 backdrop-blur-sm transition-all duration-300 transform hover:scale-105 group/btn-outline w-full sm:w-auto">
                  <span className="flex items-center justify-center">
                    যোগাযোগ করুন
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover/btn-outline:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
            </motion.div>
        </div>

        {/* Slider Controls */}
        {slides.length > 1 && (
            <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                <Button size="icon" variant="secondary" onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)} className="rounded-full bg-white/20 hover:bg-white/40 text-white border-none">
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="secondary" onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)} className="rounded-full bg-white/20 hover:bg-white/40 text-white border-none">
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        )}
      </div>

      {/* Right Column (4 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-4 h-full">
        
        {/* 2. Right Top: Promo Banners */}
        <div className="flex-1 relative rounded-2xl overflow-hidden shadow-lg bg-white group min-h-[250px] border border-gray-100">
            {promos.length > 0 ? (
                <div className="relative w-full h-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentPromo}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0"
                        >
                            <Link href={promos[currentPromo]?.link || '#'}>
                                <img 
                                    src={promos[currentPromo].content_url} 
                                    alt="Promo" 
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                                />
                            </Link>
                        </motion.div>
                    </AnimatePresence>
                     {/* Promo Controls */}
                    {promos.length > 1 && (
                        <div className="absolute bottom-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full bg-black/20 text-white" onClick={() => setCurrentPromo((prev) => (prev + 1) % promos.length)}>
                                <ChevronRight className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                    <span className="text-sm">No Promo Content</span>
                </div>
            )}
        </div>

        {/* 3. Right Bottom: Video */}
        <div className="flex-1 rounded-2xl overflow-hidden shadow-lg bg-white min-h-[250px] relative group border border-gray-100">
            {videos.length > 0 ? (
                <>
                    <iframe 
                        ref={videoRef}
                        key={currentVideo}
                        src={`${getEmbedUrl(videos[currentVideo].content_url)}?enablejsapi=1&autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&showinfo=0&loop=1&playlist=${getVideoId(videos[currentVideo].content_url)}`} 
                        title="Madrasa Video"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                    />
                     {/* Video Controls */}
                     <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent">
                        
                        {/* Left Side: Volume Control */}
                        <div className="flex items-center gap-2 group/volume">
                             <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-white hover:bg-white/20 p-1.5" onClick={toggleMute}>
                                {isMuted || volume === 0 ? <YouTubeMuteIcon /> : <YouTubeVolumeIcon />}
                            </Button>
                            
                            {/* Volume Slider */}
                            <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 ease-out flex items-center">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                />
                            </div>
                        </div>

                        {/* Right Side: Next Button */}
                        {videos.length > 1 && (
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/60" onClick={() => setCurrentVideo((prev) => (prev + 1) % videos.length)}>
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        )}
                     </div>
                </>
            ) : (
                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                    <span className="text-sm">No Video Content</span>
                </div>
            )}
        </div>

      </div>
    </section>
  );
}
