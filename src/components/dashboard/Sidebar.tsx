"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  FileText, 
  Wallet, 
  Settings,
  LogOut,
  School,
  UserPlus,
  BookOpen,
  ChevronDown,
  ChevronRight,
  GitBranch, // Branch Icon
  Layers, // Class Icon
  Book // Subject Icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

// মেনু স্ট্রাকচার টাইপ
type MenuItem = {
  title: string;
  icon: any;
  href?: string;
  submenu?: { title: string; href: string; icon?: any }[];
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [openMenus, setOpenMenus] = useState<string[]>(["একাডেমিক সেটআপ"]); 

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => 
      prev.includes(title) 
        ? prev.filter((item) => item !== title) 
        : [...prev, title]
    );
  };

  const menuItems: MenuItem[] = [
    { 
      title: "ড্যাশবোর্ড", 
      icon: LayoutDashboard, 
      href: "/dashboard" 
    },
    // নতুন সেকশন: একাডেমিক সেটআপ (PRD অনুযায়ী)
    {
      title: "একাডেমিক সেটআপ",
      icon: Settings,
      submenu: [
        { title: "শাখা ব্যবস্থাপনা", href: "/dashboard/academic/branches", icon: GitBranch },
        // ক্লাস এবং বিষয়গুলো শাখার ভেতর দিয়ে এক্সেস হবে, তাই এখানে আলাদা লিংকের দরকার নেই
      ]
    },
    {
      title: "শিক্ষার্থী",
      icon: Users,
      submenu: [
        { title: "নতুন ভর্তি (অ্যাডমিন)", href: "/dashboard/students/add", icon: UserPlus },
        { title: "শিক্ষার্থী তালিকা", href: "/dashboard/students", icon: Users },
      ]
    },
    {
      title: "পরীক্ষা ও ফলাফল",
      icon: BookOpen,
      submenu: [
        { title: "রেজাল্ট এন্ট্রি", href: "/dashboard/results", icon: FileText },
      ]
    },
    {
      title: "ম্যানেজমেন্ট",
      icon: School,
      submenu: [
        { title: "শিক্ষক তালিকা", href: "/dashboard/teachers", icon: GraduationCap },
        { title: "নোটিশ বোর্ড", href: "/dashboard/notices", icon: FileText },
        { title: "হিসাব নিকাশ", href: "/dashboard/accounts", icon: Wallet },
      ]
    },
  ];

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 hidden md:flex z-40 shadow-sm font-sans">
      <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-white">
        <div className="bg-green-100 p-2 rounded-lg text-green-700">
          <School className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-gray-800 text-lg leading-none">অ্যাডমিন</h2>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider mt-1">প্যানেল</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
        {menuItems.map((item, index) => {
          const isActive = item.href ? pathname === item.href : false;
          const isSubmenuActive = item.submenu?.some(sub => pathname === sub.href);
          const isOpen = openMenus.includes(item.title);

          return (
            <div key={index}>
              {item.submenu ? (
                <div className="space-y-1 mb-2">
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group select-none",
                      isSubmenuActive || isOpen
                        ? "bg-green-50 text-green-800"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("w-5 h-5", (isSubmenuActive || isOpen) ? "text-green-600" : "text-gray-400 group-hover:text-gray-600")} />
                      {item.title}
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
                  </button>

                  {isOpen && (
                    <div className="pl-4 space-y-1 animate-in slide-in-from-top-1 duration-200 origin-top">
                      {item.submenu.map((subItem, subIndex) => {
                        const isSubActive = pathname === subItem.href;
                        return (
                          <Link 
                            key={subIndex} 
                            href={subItem.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors border-l-2 ml-2",
                              isSubActive 
                                ? "border-green-600 text-green-700 bg-green-50/50 font-medium" 
                                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                            )}
                          >
                            {subItem.title}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Link href={item.href!}>
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group mb-2",
                    isActive 
                      ? "bg-green-600 text-white shadow-md shadow-green-200" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}>
                    <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600")} />
                    {item.title}
                  </div>
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 gap-3"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">লগআউট</span>
        </Button>
        <div className="text-[10px] text-center text-gray-400 mt-2 flex justify-center gap-1">
           <span>Powered by</span> 
           <span className="font-semibold text-gray-500">Rahima Jannat</span>
        </div>
      </div>
    </div>
  );
}