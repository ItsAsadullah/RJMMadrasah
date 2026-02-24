import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "আমাদের সম্পর্কে",
  description:
    "রহিমা জান্নাত মহিলা মাদ্রাসার প্রতিষ্ঠার ইতিহাস, লক্ষ্য ও উদ্দেশ্য, শাখাসমূহ এবং শিক্ষা কার্যক্রম সম্পর্কে বিস্তারিত জানুন।",
  alternates: { canonical: "https://rjmm.edu.bd/about" },
  openGraph: {
    title: "আমাদের সম্পর্কে — রহিমা জান্নাত মহিলা মাদ্রাসা",
    description:
      "প্রতিষ্ঠানের ইতিহাস, লক্ষ্য ও উদ্দেশ্য এবং শাখাসমূহ সম্পর্কে জানুন।",
    url: "https://rjmm.edu.bd/about",
    images: [{ url: "https://rjmm.edu.bd/og-image.png", width: 1200, height: 630, alt: "রহিমা জান্নাত মহিলা মাদ্রাসা" }],
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">আমাদের সম্পর্কে</h1>
      </div>
    </div>
  );
}
