"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { Quote, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type QuoteItem = {
  id: number;
  type: "quran" | "hadith" | "other";
  arabic?: string;
  bengali?: string;
  surah?: string;
  ayah?: string;
  book?: string;
  number?: string;
  text?: string;
  source?: string;
};

function normalizeQuotes(additional_data: any): QuoteItem[] {
  if (!additional_data) return [];
  if (Array.isArray(additional_data.quotes) && additional_data.quotes.length > 0) {
    return additional_data.quotes;
  }
  const type = additional_data.type;
  if (!type) return [];
  if (type === "quran" && additional_data.quran) return [{ id: 1, type: "quran", ...additional_data.quran }];
  if (type === "hadith" && additional_data.hadith) return [{ id: 1, type: "hadith", ...additional_data.hadith }];
  if (type === "other" && additional_data.other) return [{ id: 1, type: "other", ...additional_data.other }];
  return [];
}

export default function QuotesSection() {
  const [data, setData] = useState<any>(null);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("home_sections")
        .select("*")
        .eq("section_key", "islamic_quotes")
        .maybeSingle();
      if (data) setData(data);
    };
    fetchData();
  }, []);

  const quotes: QuoteItem[] = data ? normalizeQuotes(data.additional_data) : [];

  const next = useCallback(() => {
    if (quotes.length <= 1) return;
    setDirection(1);
    setCurrent((prev) => (prev + 1) % quotes.length);
  }, [quotes.length]);

  const prev = () => {
    if (quotes.length <= 1) return;
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + quotes.length) % quotes.length);
  };

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  useEffect(() => {
    if (quotes.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, quotes.length]);

  if (!data || !data.is_active || quotes.length === 0) return null;

  const quote = quotes[current];

  const headerColor =
    quote.type === "hadith"
      ? "bg-gradient-to-br from-blue-600 to-blue-800"
      : quote.type === "other"
      ? "bg-gradient-to-br from-gray-600 to-gray-800"
      : "bg-gradient-to-br from-green-600 to-green-800";

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-green-50 overflow-hidden h-full flex flex-col relative group hover:shadow-2xl transition-all duration-500">
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-[0.03]"></div>

      {/* Header Section */}
      <div className={`p-8 text-white relative overflow-hidden ${headerColor}`}>
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-8 -translate-y-8">
          <BookOpen className="w-32 h-32 rotate-12" />
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="relative z-10 text-center">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold tracking-wide">
            {data.title || "à¦•à§à¦°à¦†à¦¨ à¦“ à¦¹à¦¾à¦¦à¦¿à¦¸à§‡à¦° à¦¬à¦¾à¦£à§€"}
          </h3>
          <div className="h-1 w-16 bg-white/30 mx-auto mt-3 rounded-full"></div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-8 md:p-10 flex-1 flex flex-col justify-between relative bg-gradient-to-b from-gray-50/50 to-white">
        <Quote className="absolute top-8 left-8 w-12 h-12 text-gray-100 transform -scale-x-100" />

        {/* Animated Quote */}
        <div className="relative z-10 text-center min-h-[200px] flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="w-full space-y-5"
            >
              {quote.type === "quran" && (
                <>
                  {quote.arabic && (
                    <div className="font-amiri text-2xl md:text-3xl text-gray-800 leading-loose font-bold" dir="rtl">
                      {quote.arabic}
                    </div>
                  )}
                  <div className="text-gray-600 leading-relaxed font-medium text-base whitespace-pre-line">
                    {quote.bengali}
                  </div>
                  <div className="pt-2 inline-flex flex-col items-center gap-1">
                    <span className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                      {quote.surah}
                    </span>
                    {quote.ayah && <span className="text-xs text-gray-500">à¦†à¦¯à¦¼à¦¾à¦¤à¦ƒ {quote.ayah}</span>}
                  </div>
                </>
              )}

              {quote.type === "hadith" && (
                <>
                  {quote.arabic && (
                    <div className="font-amiri text-xl md:text-2xl text-gray-800 leading-loose font-bold" dir="rtl">
                      {quote.arabic}
                    </div>
                  )}
                  <div className="text-gray-600 leading-relaxed font-medium text-base whitespace-pre-line">
                    {quote.bengali}
                  </div>
                  <div className="pt-2 inline-flex flex-col items-center gap-1">
                    <span className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      {quote.book}
                    </span>
                    {quote.number && <span className="text-xs text-gray-500">à¦¹à¦¾à¦¦à¦¿à¦¸ à¦¨à¦‚à¦ƒ {quote.number}</span>}
                  </div>
                </>
              )}

              {quote.type === "other" && (
                <>
                  <div className="text-gray-700 leading-loose font-medium text-base italic whitespace-pre-line relative px-6">
                    <span className="text-4xl text-gray-200 absolute -top-4 left-0 select-none">"</span>
                    {quote.text}
                    <span className="text-4xl text-gray-200 absolute -bottom-6 right-0 select-none">"</span>
                  </div>
                  {quote.source && (
                    <div className="pt-6">
                      <div className="inline-flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-bold shadow-sm border border-gray-200">
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></span>
                        {quote.source}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Controls */}
        {quotes.length > 1 && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              {quotes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === current ? "w-5 h-2.5 bg-green-500" : "w-2.5 h-2.5 bg-gray-200 hover:bg-gray-400"
                  }`}
                  aria-label={`à¦¬à¦¾à¦£à§€ ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={prev} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-green-100 text-gray-500 hover:text-green-700 flex items-center justify-center transition-colors" aria-label="à¦†à¦—à§‡à¦° à¦¬à¦¾à¦£à§€">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-400 font-medium">{current + 1} / {quotes.length}</span>
              <button onClick={next} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-green-100 text-gray-500 hover:text-green-700 flex items-center justify-center transition-colors" aria-label="à¦ªà¦°à§‡à¦° à¦¬à¦¾à¦£à§€">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <Quote className="absolute bottom-8 right-8 w-12 h-12 text-gray-100" />
      </div>
    </div>
  );
}
