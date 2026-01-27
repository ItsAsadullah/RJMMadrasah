"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { 
  Menu, 
  X, 
  UserCircle, 
  Phone, 
  Home, 
  FileText, 
  GraduationCap, 
  Bell, 
  LayoutDashboard, 
  LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    
    // ১. স্ক্রল হ্যান্ডেলার
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);

    // ২. সেশন চেক করার ফাংশন
    const checkUser = async () => {
      if (supabase && supabase.auth) {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      }
    };
    
    checkUser();

    // ৩. রিয়েল-টাইম অথ স্টেট লিসেনার (অটো-আপডেটের জন্য গুরুত্বপূর্ণ)
    let authListener: any = null;

    if (supabase && supabase.auth && typeof supabase.auth.onAuthStateChanged === 'function') {
      const { data } = supabase.auth.onAuthStateChanged((event, session) => {
        // ইভেন্ট যাই হোক (SIGNED_IN, SIGNED_OUT, INITIAL_SESSION), আমরা স্টেট আপডেট করব
        setUser(session?.user ?? null);
        
        // যদি লগইন বা লগআউট হয়, নেক্সট জেএস এর রাউটার রিফ্রেশ করা ভালো যেন সার্ভার কম্পোনেন্ট ডাটা আপডেট হয়
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          router.refresh();
        }
      });
      authListener = data.subscription;
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, [router]);

  const handleLogout = async () => {
    if (supabase && supabase.auth) {
      await supabase.auth.signOut();
      setUser(null);
      setIsOpen(false);
      router.push("/");
      router.refresh();
    }
  };

  const navLinks = [
    { name: "হোম", path: "/", icon: <Home className="w-5 h-5" /> },
    { name: "ভর্তি তথ্য", path: "/admission", icon: <FileText className="w-5 h-5" /> },
    { name: "ফলাফল", path: "/result", icon: <GraduationCap className="w-5 h-5" /> },
    { name: "নোটিশ", path: "/notice", icon: <Bell className="w-5 h-5" /> },
    { name: "যোগাযোগ", path: "/contact", icon: <Phone className="w-5 h-5" /> },
  ];

  // হাইড্রেশন এরর এড়াতে মাউন্ট না হওয়া পর্যন্ত কিছু রেন্ডার করব না
  if (!mounted) return (
    <div className="h-16 w-full bg-white border-b border-green-100 animate-pulse" />
  );

  return (
    <>
      <nav
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300 border-b border-green-100",
          scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-white shadow-sm"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-green-100 shadow-sm group-hover:scale-105 transition-transform bg-green-50 flex items-center justify-center">
                  <Image src="/logo.png" alt="Logo" fill className="object-cover" sizes="40px" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-bold text-primary leading-tight">রহিমা জান্নাত</span>
                <span className="text-[10px] sm:text-xs text-gray-500 font-medium">মহিলা মাদ্রাসা</span>
              </div>
            </Link>

            {/* ডেস্কটপ মেনু */}
            <div className="hidden md:flex space-x-1 items-center">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary hover:bg-green-50 transition-all"
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="ml-4 flex items-center gap-2">
                {user ? (
                  <>
                    <Link href="/dashboard">
                      <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50 shadow-sm">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        ড্যাশবোর্ড
                      </Button>
                    </Link>
                    <Button onClick={handleLogout} variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2">
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </>
                ) : (
                  <Link href="/login">
                    <Button className="bg-primary hover:bg-green-700 text-white shadow-md font-bold">
                      <UserCircle className="w-4 h-4 mr-2" />
                      লগইন
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="md:hidden flex items-center">
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* মোবাইল ড্রয়ার */}
      <div 
        className={cn(
          "fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={() => setIsOpen(false)}
      >
        <div
          className={cn(
            "absolute top-0 right-0 w-[80%] max-w-[300px] h-full bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col",
            isOpen ? "translate-x-0" : "translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-green-100 bg-green-50/50">
            <span className="font-bold text-lg text-primary">মেনু</span>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-red-500">
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-green-50 hover:text-primary transition-all"
                >
                  <div className="text-primary/70">{link.icon}</div>
                  {link.name}
                </Link>
              ))}
              {user && (
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-green-700 bg-green-50 mt-2 border border-green-100"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  ড্যাশবোর্ড
                </Link>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-green-100 bg-gray-50">
            {user ? (
               <Button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 text-white py-6 font-bold">
                  <LogOut className="w-5 h-5 mr-2" />
                  লগআউট করুন
               </Button>
            ) : (
               <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-primary text-white py-6 font-bold">
                      <UserCircle className="w-5 h-5 mr-2" />
                      লগইন করুন
                  </Button>
              </Link>
            )}
            <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest">Rahima Jannat Madrasa</p>
          </div>
        </div>
      </div>
    </>
  );
}