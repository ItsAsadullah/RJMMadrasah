"use client";

import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import Preloader from "@/components/ui/Preloader";
import { useState, useEffect } from "react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ১.৫ সেকেন্ড পর লোডিং বন্ধ হবে (প্রিলোডার এনিমেশন শেষ হওয়ার জন্য)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Preloader />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* পাবলিক ন্যাভবার */}
      <Navbar />
      
      {/* মেইন কন্টেন্ট: এখানে কন্টেইনার দেওয়া হয়নি যাতে ব্যানার পুরো স্ক্রিন নিতে পারে */}
      <main className="flex-grow">
        {children}
      </main>
      
      {/* ফুটার */}
      <Footer />
    </div>
  );
}