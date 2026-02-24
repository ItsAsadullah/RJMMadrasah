import type { Metadata } from "next";
import ContactClient from "@/components/pages/ContactClient";

export const metadata: Metadata = {
  title: "যোগাযোগ করুন",
  description:
    "রহিমা জান্নাত মহিলা মাদ্রাসার সাথে যোগাযোগ করুন। হলিধানী বাজার ও চাঁন্দুয়ালী শাখার ঠিকানা, ফোন নম্বর এবং ইমেইল পাবেন এখানে।",
  alternates: { canonical: "https://rjmm.edu.bd/contact" },
  openGraph: {
    title: "যোগাযোগ — রহিমা জান্নাত মহিলা মাদ্রাসা",
    description:
      "হলিধানী বাজার ও চাঁন্দুয়ালী শাখার ঠিকানা, ফোন নম্বর এবং ইমেইল।",
    url: "https://rjmm.edu.bd/contact",
    images: [{ url: "https://rjmm.edu.bd/og-image.png", width: 1200, height: 630, alt: "রহিমা জান্নাত মহিলা মাদ্রাসা" }],
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
