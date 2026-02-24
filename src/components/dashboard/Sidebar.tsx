"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, GraduationCap, Calendar, 
  BookOpen, Settings, LogOut, Clock, Menu, X, ChevronDown, ChevronRight, 
  School, Loader2, FileText, DollarSign, CalendarCheck, Image as ImageIcon,
  ClipboardList, UserPlus, Globe, Database, Award, TrendingUp, Briefcase, 
  LayoutTemplate, Bell, MapPin, Layers
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// টাইপ ডেফিনিশন
type ClassNode = { id: string; name: string };
type YearNode = { year: number; classes: ClassNode[] };
type BranchNode = { id: string; name: string; years: YearNode[] };

export default function Sidebar() {
  const pathname = usePathname();
  // মোবাইলে ডিফল্টভাবে মেনু বন্ধ থাকবে, ডেস্কটপে খোলা থাকবে
  const [isOpen, setIsOpen] = useState(false); 
  const [treeData, setTreeData] = useState<BranchNode[]>([]);
  const [loading, setLoading] = useState(true);
   
  // কলাপস স্টেট ম্যানেজমেন্ট
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({});
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
  
  // New: Collapsible Menu State
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
      'academic-setup': false,
      'academic-activity': false,
      'students-teachers': false,
      'accounts': false,
      'website': false,
      'system': false
  });

  // ডেস্কটপ ভিউতে সাইডবার সবসময় দেখানোর জন্য
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    
    // ইনিশিয়াল চেক
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchTreeData();
  }, []);

  const fetchTreeData = async () => {
    setLoading(true);
    try {
      const { data: branches } = await supabase.from("branches").select("id, name");
      const { data: classes } = await supabase.from("academic_classes").select("id, name, branch_id, academic_year").order("name");

      if (branches && classes) {
        const tree: BranchNode[] = branches.map(branch => {
          // ফিক্স: branch_id null চেক করা হয়েছে এবং String এ কনভার্ট করে তুলনা করা হচ্ছে
          const branchClasses = classes.filter(c => 
            c.branch_id && branch.id && String(c.branch_id) === String(branch.id)
          );
          
          const yearsMap: Record<number, ClassNode[]> = {};
          branchClasses.forEach(cls => {
            // Check for both academic_year and name to ensure valid data
            if (cls.academic_year) {
               if (!yearsMap[cls.academic_year]) yearsMap[cls.academic_year] = [];
               yearsMap[cls.academic_year].push({ id: cls.id, name: cls.name || "Unknown Class" });
            }
          });

          const years: YearNode[] = Object.keys(yearsMap)
            .map(y => ({ year: parseInt(y), classes: yearsMap[parseInt(y)] }))
            .sort((a, b) => b.year - a.year);

          return { id: branch.id, name: branch.name, years };
        });
        setTreeData(tree);
      }
    } catch (error) {
      console.error("Error fetching sidebar data:", error);
    }
    setLoading(false);
  };

  const toggleBranch = (id: string) => {
    setExpandedBranches(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleYear = (branchId: string, year: number) => {
    const key = `${branchId}-${year}`;
    setExpandedYears(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleMenu = (menuKey: string) => {
      setExpandedMenus(prev => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <>
      {/* মোবাইল টগল বাটন (শুধুমাত্র ছোট স্ক্রিনে দেখাবে) */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md border text-gray-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* ওভারলে (মোবাইলে মেনু খোলা থাকলে ব্যাকগ্রাউন্ড আবছা করবে) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* সাইডবার কন্টেইনার */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-40 transition-transform duration-300 ease-in-out overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 flex-shrink-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* লোগো সেকশন */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between lg:justify-start">
          <Link href="/dashboard" className="flex items-center gap-2 text-green-700 hover:opacity-80 transition-opacity">
            <School className="w-8 h-8" /> 
            <span className="text-xl font-bold">মাদ্রাসা প্যানেল</span>
          </Link>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-500">
             <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-6">
          
          {/* ১. ড্যাশবোর্ড */}
          <div>
             <Link href="/dashboard" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                <LayoutDashboard className="w-4 h-4" /> ড্যাশবোর্ড
             </Link>
          </div>

          {/* ২. একাডেমিক সেটআপ */}
          <div>
            <button 
                onClick={() => toggleMenu('academic-setup')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 hover:text-gray-600 transition-colors"
            >
                <span>একাডেমিক সেটআপ</span>
                {expandedMenus['academic-setup'] ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
            </button>
            
            <div className={cn(
                "space-y-1 overflow-hidden transition-all duration-300 ease-in-out",
                expandedMenus['academic-setup'] ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            )}>
               <Link href="/dashboard/settings/academic" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard/settings/academic" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                  <Settings className="w-4 h-4" /> একাডেমিক কনফিগারেশন
               </Link>
               <Link href="/dashboard/management/routine" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname.includes("/management/routine") ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                  <Clock className="w-4 h-4" /> রুটিন ম্যানেজমেন্ট
               </Link>
            </div>
          </div>

          {/* ৩. একাডেমিক কার্যক্রম */}
          <div>
            <button 
                onClick={() => toggleMenu('academic-activity')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 hover:text-gray-600 transition-colors"
            >
                <span>একাডেমিক কার্যক্রম</span>
                {expandedMenus['academic-activity'] ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
            </button>
            
            <div className={cn(
                "space-y-1 overflow-hidden transition-all duration-300 ease-in-out",
                expandedMenus['academic-activity'] ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
            )}>
               
               {/* Dynamic Tree */}
               {loading ? (
                 <div className="px-3 py-2 text-xs text-gray-400 animate-pulse flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin"/> লোডিং...</div>
               ) : (
                 treeData.map(branch => {
                   const isBranchActive = pathname.includes(`/branches/${branch.id}`);
                   const isExpanded = expandedBranches[branch.id];

                   return (
                   <div key={branch.id} className="mt-1 group/branch">
                     <div className={cn(
                        "flex items-center justify-between w-full pr-2 rounded-lg hover:bg-gray-50 transition-colors",
                        isBranchActive ? "bg-green-50 text-green-700" : "text-gray-600"
                     )}>
                        <Link 
                           href={`/dashboard/academic/branches/${branch.id}`}
                           className="flex-1 flex items-center gap-2 px-3 py-2 text-sm font-medium"
                        >
                           <GraduationCap className={cn("w-4 h-4", isBranchActive ? "text-green-600" : "text-gray-400 group-hover/branch:text-green-600")} />
                           {branch.name}
                        </Link>
                        <button 
                           onClick={(e) => {
                             e.preventDefault();
                             e.stopPropagation();
                             toggleBranch(branch.id);
                           }}
                           className="p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                           {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                     </div>

                     <div className={cn(
                        "grid transition-[grid-template-rows] duration-300 ease-in-out",
                        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                     )}>
                       <div className="overflow-hidden">
                          <div className="ml-4 border-l-2 border-gray-100 pl-2 space-y-1 mt-1">
                             {branch.years.map(yNode => {
                               const isYearActive = pathname.includes(`/year/${yNode.year}`);
                               const isYearExpanded = expandedYears[`${branch.id}-${yNode.year}`];
                               
                               return (
                               <div key={yNode.year} className="group/year">
                                  <div className={cn(
                                     "flex items-center justify-between w-full pr-2 rounded-md hover:bg-green-50/50 transition-colors",
                                     isYearActive ? "text-green-700 bg-green-50" : "text-gray-500"
                                  )}>
                                     <Link
                                        href={`/dashboard/academic/branches/${branch.id}/year/${yNode.year}`}
                                        className="flex-1 flex items-center gap-2 px-3 py-1.5 text-xs font-medium"
                                     >
                                        <Calendar className="w-3 h-3" /> {yNode.year}
                                     </Link>
                                     <button 
                                        onClick={(e) => {
                                           e.preventDefault();
                                           e.stopPropagation();
                                           toggleYear(branch.id, yNode.year);
                                        }}
                                        className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                                     >
                                        {isYearExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                     </button>
                                  </div>

                                  <div className={cn(
                                     "grid transition-[grid-template-rows] duration-300 ease-in-out",
                                     isYearExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                  )}>
                                     <div className="overflow-hidden">
                                        <div className="ml-3 border-l-2 border-gray-100 pl-2 mt-1 space-y-0.5">
                                            {yNode.classes.length === 0 ? <p className="text-[10px] text-gray-400 px-2">ক্লাস নেই</p> : 
                                              yNode.classes.map(cls => (
                                                <Link 
                                                  key={cls.id}
                                                  href={`/dashboard/academic/branches/${branch.id}/year/${yNode.year}/class/${cls.id}`}
                                                  className={cn(
                                                    "block px-3 py-1.5 text-xs rounded-md transition-colors border-l-2 border-transparent",
                                                    pathname.includes(cls.id) 
                                                      ? "bg-green-100 text-green-800 font-bold border-green-500" 
                                                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300"
                                                  )}
                                                >
                                                  {cls.name}
                                                </Link>
                                              ))
                                            }
                                        </div>
                                     </div>
                                  </div>
                               </div>
                               );
                             })}
                             {branch.years.length === 0 && <p className="text-xs text-gray-400 px-3 py-1">কোনো সেশন নেই</p>}
                          </div>
                       </div>
                     </div>
                   </div>
                   );
                 })
               )}

               <Link href="/dashboard/attendance" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard/attendance" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                  <CalendarCheck className="w-4 h-4" /> হাজিরা খাতা
               </Link>

               <Link href="/dashboard/management/leave" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname.includes("/management/leave") ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                  <Calendar className="w-4 h-4" /> ছুটি ব্যবস্থাপনা
               </Link>
               
               <Link href="/dashboard/academic/exams" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname.includes("/academic/exams") ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                  <FileText className="w-4 h-4" /> পরীক্ষা ব্যবস্থাপনা
               </Link>

               <Link href="/dashboard/results" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname.includes("/dashboard/results") ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                  <Award className="w-4 h-4" /> ফলাফল প্রকাশ
               </Link>
               
               <Link href="/dashboard/academic/promotion" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname.includes("/academic/promotion") ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                  <TrendingUp className="w-4 h-4" /> প্রমোশন
               </Link>
            </div>
          </div>

          {/* ৪. শিক্ষার্থী ও শিক্ষক */}
          <div>
            <button 
                onClick={() => toggleMenu('students-teachers')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 hover:text-gray-600 transition-colors"
            >
                <span>শিক্ষার্থী ও শিক্ষক</span>
                {expandedMenus['students-teachers'] ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
            </button>
            
            <div className={cn(
                "space-y-1 overflow-hidden transition-all duration-300 ease-in-out",
                expandedMenus['students-teachers'] ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            )}>
              <Link href="/dashboard/students/add" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard/students/add" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                <UserPlus className="w-4 h-4" /> নতুন ভর্তি
              </Link>
              <Link href="/dashboard/students" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard/students" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                <Users className="w-4 h-4" /> শিক্ষার্থী তালিকা
              </Link>
              <Link href="/dashboard/teachers" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard/teachers" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                <Briefcase className="w-4 h-4" /> শিক্ষক ও স্টাফ
              </Link>
            </div>
          </div>

          {/* ৫. একাউন্টস */}
          <div>
             <button 
                onClick={() => toggleMenu('accounts')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 hover:text-gray-600 transition-colors"
             >
                <span>হিসাব ও বেতন</span>
                {expandedMenus['accounts'] ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
             </button>

             <div className={cn(
                "space-y-1 overflow-hidden transition-all duration-300 ease-in-out",
                expandedMenus['accounts'] ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
             )}>
                <Link href="/dashboard/accounts" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard/accounts" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                    <DollarSign className="w-4 h-4" /> ফি ও পেমেন্ট
                </Link>
             </div>
          </div>

          {/* ৬. ওয়েবসাইট ও কনটেন্ট */}
          <div>
             <button 
                onClick={() => toggleMenu('website')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 hover:text-gray-600 transition-colors"
             >
                <span>ওয়েবসাইট ও কনটেন্ট</span>
                {expandedMenus['website'] ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
             </button>

             <div className={cn(
                "space-y-1 overflow-hidden transition-all duration-300 ease-in-out",
                expandedMenus['website'] ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
             )}>
                 <Link href="/dashboard/notices" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard/notices" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                    <Bell className="w-4 h-4" /> নোটিশ বোর্ড
                 </Link>
                 <Link href="/dashboard/gallery" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard/gallery" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                    <ImageIcon className="w-4 h-4" /> গ্যালারি
                 </Link>
                 <Link href="/dashboard/website/home" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard/website/home" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                    <Globe className="w-4 h-4" /> হোম পেজ কনটেন্ট
                 </Link>
                 <Link href="/dashboard/hero" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard/hero" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                    <LayoutTemplate className="w-4 h-4" /> হিরো সেকশন
                 </Link>
                 <Link href="/dashboard/website/footer" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard/website/footer" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                    <Globe className="w-4 h-4" /> ফুটার সেটিংস
                 </Link>
                 <Link href="/dashboard/website/contact" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard/website/contact" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                    <MapPin className="w-4 h-4" /> যোগাযোগ পেজ
                 </Link>
                 <Link href="/dashboard/website/admission" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard/website/admission" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                    <GraduationCap className="w-4 h-4" /> ভর্তি পেজ
                 </Link>
                 <Link href="/dashboard/website/features" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard/website/features" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                    <Layers className="w-4 h-4" /> বৈশিষ্ট্যসমূহ
                 </Link>
             </div>
          </div>

          {/* ৭. সিস্টেম সেটিংস */}
          <div>
             <button 
                onClick={() => toggleMenu('system')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 hover:text-gray-600 transition-colors"
             >
                <span>সিস্টেম</span>
                {expandedMenus['system'] ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
             </button>

             <div className={cn(
                "space-y-1 overflow-hidden transition-all duration-300 ease-in-out",
                expandedMenus['system'] ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
             )}>
                 <Link href="/dashboard/settings/backup" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard/settings/backup" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                    <Database className="w-4 h-4" /> ডাটাবেস ব্যাকআপ
                 </Link>
             </div>
          </div>

        </nav>

        {/* Footer Logout */}
        <div className="p-4 mt-auto border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> লগ আউট
          </button>
        </div>
      </aside>
    </>
  );
}