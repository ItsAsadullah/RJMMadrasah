"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSafeSupabaseSession, supabase } from "@/lib/supabase/client";
import Sidebar from "@/components/dashboard/Sidebar";
import Preloader from "@/components/ui/Preloader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // ১. সেশন চেক করার ফাংশন
    const checkUser = async () => {
      try {
        if (!supabase || !supabase.auth) {
          router.replace("/login");
          return;
        }

        const { session, error } = await getSafeSupabaseSession();
        
        if (error || !session) {
          router.replace("/login");
          setLoading(false);
        } else {
          setAuthenticated(true);
          setLoading(false);
        }
      } catch (err) {
        router.replace("/login");
        setLoading(false);
      }
    };

    checkUser();

    // ২. অথেন্টিকেশন স্টেট পরিবর্তনের লিসেনার
    let subscription: any = null;

    if (supabase && supabase.auth) {
      // ফিক্স: সঠিক ফাংশন নাম onAuthStateChange ব্যবহার করা হয়েছে (d নেই)
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          setAuthenticated(false);
          router.replace("/login");
        }
      });
      subscription = data.subscription;
    }

    // ক্লিনআপ ফাংশন
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [router]);

  // লোডিং অবস্থায় ইউজারকে ওয়েট করানো
  if (loading) {
    return <Preloader />;
  }

  // যদি লগইন করা না থাকে তবে কিছু দেখাবে না (রিডাইরেক্ট হবে)
  if (!authenticated) return null;

  return (
    // সম্পূর্ণ স্ক্রিন জুড়ে একটি ফ্লেক্স কন্টেইনার (এটি আগের স্ক্রল সমস্যা ফিক্স করবে)
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden print:h-auto print:block print:overflow-visible">
      
      {/* বাম পাশে সাইডবার */}
      <div className="print:hidden">
        <Sidebar />
      </div>

      {/* ডান পাশে মেইন কনটেন্ট */}
      {/* flex-1: বাকি জায়গা নিবে */}
      {/* overflow-y-auto: শুধু এই অংশটুকু স্ক্রল হবে, সাইডবার ফিক্সড থাকবে */}
      <main className="flex-1 h-full overflow-y-auto p-2 pt-16 md:p-3 md:pt-3 pb-24 scrollbar-thin scrollbar-thumb-gray-200 print:overflow-visible print:h-auto print:p-0 print:block">
        <div className="w-full print:block">
           {children}
        </div>
      </main>
      
    </div>
  );
}
