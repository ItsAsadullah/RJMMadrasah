"use client";

import Link from "next/link";
import Image from "next/image"; // ইমেজ ইম্পোর্ট করা হলো
import { useState, useEffect } from "react";
import { Menu, X, UserCircle, Phone, Home, FileText, GraduationCap, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "হোম", path: "/", icon: <Home className="w-5 h-5" /> },
    { name: "ভর্তি তথ্য", path: "/admission", icon: <FileText className="w-5 h-5" /> },
    { name: "ফলাফল", path: "/result", icon: <GraduationCap className="w-5 h-5" /> },
    { name: "নোটিশ", path: "/notice", icon: <Bell className="w-5 h-5" /> },
    { name: "যোগাযোগ", path: "/contact", icon: <Phone className="w-5 h-5" /> },
  ];

  if (!mounted) {
    return (
        <nav className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-green-100">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="text-primary font-bold">রহিমা জান্নাত</div>
            </div>
        </nav>
    ); 
  }

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
              {/* লোগো ইমেজ */}
              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-green-100 shadow-sm group-hover:scale-105 transition-transform">
                  <Image 
                    src="/logo.png" 
                    alt="Logo" 
                    fill 
                    className="object-cover"
                    sizes="40px"
                  />
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-bold text-primary leading-tight tracking-tight">
                  রহিমা জান্নাত
                </span>
                <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
                  মহিলা মাদ্রাসা
                </span>
              </div>
            </Link>

            <div className="hidden md:flex space-x-1 items-center">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary hover:bg-green-50 transition-all duration-200"
                >
                  {link.name}
                </Link>
              ))}
              
              <Link href="/login" className="ml-4">
                  <Button className="bg-primary hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all">
                      <UserCircle className="w-4 h-4 mr-2" />
                      লগইন
                  </Button>
              </Link>
            </div>

            <div className="md:hidden flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(true)}
                className="text-gray-700 hover:text-primary hover:bg-green-50"
              >
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

          <div className="flex-1 overflow-y-auto py-4">
            <div className="flex flex-col space-y-1 px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-green-50 hover:text-primary transition-all active:scale-95"
                >
                  <div className="text-primary/70">{link.icon}</div>
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-green-100 bg-gray-50">
             <Link href="/login" onClick={() => setIsOpen(false)}>
                <Button className="w-full bg-primary text-white text-base py-6 shadow-md active:scale-95 transition-transform">
                    <UserCircle className="w-5 h-5 mr-2" />
                    লগইন করুন
                </Button>
            </Link>
            <p className="text-center text-xs text-gray-400 mt-4">
              © ২০২৫ রহিমা জান্নাত মাদ্রাসা
            </p>
          </div>
        </div>
      </div>
    </>
  );
}