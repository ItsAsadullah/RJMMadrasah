import type { Metadata } from "next";
import AdmissionClient from "@/components/pages/AdmissionClient";

export const metadata: Metadata = {
  title: "ভর্তি তথ্য ২০২৬",
  description:
    "রহিমা জান্নাত মহিলা মাদ্রাসায় শিক্ষাবর্ষ ২০২৬-এ নূরানী, হিফজুল কুরআন ও কিতাব বিভাগে ভর্তি চলছে। ভর্তির শর্তাবলী, ফি তালিকা ও আবেদন প্রক্রিয়া জানুন।",
  alternates: { canonical: "https://rjmm.edu.bd/admission" },
  openGraph: {
    type: "website",
    title: "ভর্তি ২০২৬ — রহিমা জান্নাত মহিলা মাদ্রাসা",
    description:
      "নূরানী, হিফজুল কুরআন ও কিতাব বিভাগে সীমিত আসনে ভর্তি চলছে। দ্রুত আবেদন করুন।",
    url: "https://rjmm.edu.bd/admission",
    images: [{ url: "https://rjmm.edu.bd/og-image.png", width: 1200, height: 630, alt: "রহিমা জান্নাত মহিলা মাদ্রাসা" }],
  },
};

export default function AdmissionPage() {
  return <AdmissionClient />;
}
