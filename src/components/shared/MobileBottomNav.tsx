"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Info, PhoneCall, Image as ImageIcon, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "হোম", href: "/", icon: Home },
  { name: "ভর্তি", href: "/admission", icon: GraduationCap },
  { name: "গ্যালারি", href: "/gallery", icon: ImageIcon },
  { name: "আমাদের সম্পর্কে", href: "/about", icon: Info },
  { name: "যোগাযোগ", href: "/contact", icon: PhoneCall },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-[100] px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all",
              isActive ? "text-green-600" : "text-gray-500 hover:text-green-600"
            )}
          >
            <item.icon className={cn("w-5 h-5", isActive && "fill-green-50/50")} />
            <span className="text-[10px] font-medium leading-none">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
