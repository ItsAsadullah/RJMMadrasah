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
  LogOut,
  Image as ImageIcon
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
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 100); 
    };
    window.addEventListener("scroll", handleScroll);

    const checkUser = async () => {
      if (supabase && supabase.auth) {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      }
    };
    
    checkUser();

    let authListener: any = null;

    if (supabase && supabase.auth && typeof supabase.auth.onAuthStateChange === 'function') {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
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
    { name: "গ্যালারি", path: "/gallery", icon: <ImageIcon className="w-5 h-5" /> },
    { name: "নোটিশ", path: "/notice", icon: <Bell className="w-5 h-5" /> },
    { name: "যোগাযোগ", path: "/contact", icon: <Phone className="w-5 h-5" /> },
  ];

  if (!mounted) return (
    <div className="h-32 w-full bg-white animate-pulse" />
  );

  return (
    <>
      <header className="flex flex-col w-full font-[Kalpurush]">
        
        {/* ১. লোগো সেকশন (টপ বার) */}
        {/* পরিবর্তন: bg-white এর বদলে bg-green-50/80 ব্যবহার করা হয়েছে */}
        <div className="w-full bg-green-50/80 pt-1 pb-0 border-b border-green-100"> 
          <div className="max-w-7xl mx-auto px-4 flex flex-col justify-center items-center">
             
             {/* বিসমিল্লাহ ইমেজ */}
             <div className="relative h-7 w-36 sm:h-12 sm:w-64 transition-all -mb-5 sm:-mb-6 z-10"> 
                <Image 
                  src="/images/bismillah.svg" 
                  alt="Bismillah" 
                  fill 
                  className="object-contain" 
                  priority
                />
              </div>

            <Link href="/">
              {/* লোগো কন্টেইনার */}
              <div className="relative h-28 w-[320px] sm:h-44 sm:w-[550px] md:h-52 md:w-[750px] transition-all hover:scale-105 -mt-6 sm:-mt-12 -mb-8 sm:-mb-14"> 
                <Image 
                  src="/images/long_logo.svg" 
                  alt="Rahima Jannat Mohila Madrasa Logo" 
                  fill 
                  className="object-contain" 
                  priority
                />
              </div>
            </Link>
          </div>
        </div>

        {/* ২. ন্যাভিগেশন বার */}
        <nav
          className={cn(
            "w-full bg-green-700 text-white transition-all duration-300 shadow-md",
            scrolled ? "sticky top-0 z-50 shadow-lg" : "relative z-40"
          )}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-14 items-center">
              
              <div className="md:hidden flex items-center">
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} className="text-white hover:bg-green-600 hover:text-white">
                  <Menu className="h-6 w-6" />
                </Button>
              </div>

              <div className="hidden md:flex space-x-1 items-center mx-auto">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    className="px-5 py-2 rounded-md text-base font-medium text-white hover:bg-green-600 hover:shadow-inner transition-all flex items-center gap-2"
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                ))}
              </div>
              
              <div className="flex items-center gap-2 absolute right-4 md:static">
                {user ? (
                  <>
                    <Link href="/dashboard" className="hidden md:block">
                      <Button variant="outline" size="sm" className="bg-white text-green-700 hover:bg-green-50 border-0 font-bold">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        ড্যাশবোর্ড
                      </Button>
                    </Link>
                    <Button onClick={handleLogout} variant="ghost" size="sm" className="text-white hover:bg-red-500/20 hover:text-red-200">
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </>
                ) : (
                  <Link href="/login">
                    <Button size="sm" className="bg-white text-green-700 hover:bg-green-50 font-bold border-0 shadow-sm">
                      <UserCircle className="w-4 h-4 mr-2" />
                      লগইন
                    </Button>
                  </Link>
                )}
              </div>

            </div>
          </div>
        </nav>
      </header>

      {/* মোবাইল ড্রয়ার */}
      <div 
        className={cn(
          "fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={() => setIsOpen(false)}
      >
        <div
          className={cn(
            "absolute top-0 left-0 w-[80%] max-w-[300px] h-full bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col font-[Kalpurush]",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center justify-center p-6 border-b border-green-100 bg-green-50/30">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="absolute top-2 right-2 text-gray-500 hover:text-red-500">
              <X className="h-6 w-6" />
            </Button>
            <div className="h-4"></div> {/* Spacer */}
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg text-lg font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all border border-transparent hover:border-green-100"
                >
                  <div className="text-green-600 bg-green-50 p-2 rounded-full">{link.icon}</div>
                  {link.name}
                </Link>
              ))}
              
              {user && (
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg text-lg font-medium text-white bg-green-600 hover:bg-green-700 mt-4 shadow-md"
                >
                  <div className="text-white bg-white/20 p-2 rounded-full"><LayoutDashboard className="w-5 h-5" /></div>
                  ড্যাশবোর্ড
                </Link>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-green-100 bg-gray-50">
            {user ? (
               <Button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 text-white py-6 font-bold text-lg">
                  <LogOut className="w-5 h-5 mr-2" />
                  লগআউট
               </Button>
            ) : (
               <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-green-700 hover:bg-green-800 text-white py-6 font-bold text-lg shadow-lg">
                      <UserCircle className="w-5 h-5 mr-2" />
                      লগইন করুন
                  </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}