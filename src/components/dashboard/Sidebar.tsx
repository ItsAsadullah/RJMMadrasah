"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, GraduationCap, Calendar, 
  BookOpen, Settings, LogOut, Clock, Menu, X, ChevronDown, ChevronRight, School, Loader2, FileText
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

  // ডেস্কটপ ভিউতে সাইডবার সবসময় দেখানোর জন্য
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    
    // ইনিশিয়াল চেক
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
          // ফিক্স: branch_id null চেক করা হয়েছে এবং String এ কনভার্ট করে তুলনা করা হচ্ছে
          const branchClasses = classes.filter(c => 
            c.branch_id && branch.id && String(c.branch_id) === String(branch.id)
          );
          
          const yearsMap: Record<number, ClassNode[]> = {};
          branchClasses.forEach(cls => {
            if (cls.academic_year) {
               if (!yearsMap[cls.academic_year]) yearsMap[cls.academic_year] = [];
               yearsMap[cls.academic_year].push({ id: cls.id, name: cls.name });
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

          {/* ২. একাডেমিক (ডাইনামিক কলাপস) */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">একাডেমিক</h3>
            <div className="space-y-1">
               <Link href="/dashboard/academic/branches" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard/academic/branches" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                  <Settings className="w-4 h-4" /> শাখা ব্যবস্থাপনা
               </Link>
               
               {/* Exam Management Link Added */}
               <Link href="/dashboard/academic/exams" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname.includes("/academic/exams") ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                  <FileText className="w-4 h-4" /> পরীক্ষা ব্যবস্থাপনা
               </Link>

               {loading ? (
                 <div className="px-3 py-2 text-xs text-gray-400 animate-pulse flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin"/> লোডিং...</div>
               ) : (
                 treeData.map(branch => (
                   <div key={branch.id} className="mt-1">
                     {/* Branch Level */}
                     <button 
                       onClick={() => toggleBranch(branch.id)}
                       className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg group"
                     >
                        <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-gray-400 group-hover:text-green-600" /> {branch.name}</span>
                        {expandedBranches[branch.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                     </button>

                     {/* Years Level */}
                     {expandedBranches[branch.id] && (
                       <div className="ml-4 border-l-2 border-gray-100 pl-2 space-y-1 mt-1 transition-all">
                          {branch.years.map(yNode => (
                            <div key={yNode.year}>
                               <button 
                                  onClick={() => toggleYear(branch.id, yNode.year)}
                                  className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-md"
                               >
                                  <span className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {yNode.year}</span>
                                  {expandedYears[`${branch.id}-${yNode.year}`] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                               </button>

                               {/* Classes Level */}
                               {expandedYears[`${branch.id}-${yNode.year}`] && (
                                  <div className="ml-3 border-l-2 border-gray-100 pl-2 mt-1 space-y-0.5 animate-in slide-in-from-top-1">
                                      {yNode.classes.length === 0 ? <p className="text-[10px] text-gray-400 px-2">ক্লাস নেই</p> : 
                                        yNode.classes.map(cls => (
                                          <Link 
                                            key={cls.id}
                                            href={`/dashboard/academic/branches/${branch.id}/year/${yNode.year}/class/${cls.id}`}
                                            className={cn(
                                              "block px-3 py-1.5 text-xs rounded-md transition-colors",
                                              pathname.includes(cls.id) ? "bg-green-100 text-green-800 font-bold" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                            )}
                                          >
                                            {cls.name}
                                          </Link>
                                        ))
                                      }
                                  </div>
                               )}
                            </div>
                          ))}
                          {branch.years.length === 0 && <p className="text-xs text-gray-400 px-3 py-1">কোনো সেশন নেই</p>}
                       </div>
                     )}
                   </div>
                 ))
               )}
            </div>
          </div>

          {/* ৩. শিক্ষার্থী */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">শিক্ষার্থী</h3>
            <div className="space-y-1">
              <Link href="/dashboard/students/add" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard/students/add" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                <Users className="w-4 h-4" /> নতুন ভর্তি
              </Link>
              <Link href="/dashboard/students" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard/students" && pathname !== "/dashboard/students/add" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                <BookOpen className="w-4 h-4" /> শিক্ষার্থী তালিকা
              </Link>
            </div>
          </div>

          {/* ৪. শিক্ষক */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">স্টাফ</h3>
            <div className="space-y-1">
              <Link href="/dashboard/teachers" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard/teachers" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                <Users className="w-4 h-4" /> শিক্ষক তালিকা
              </Link>
            </div>
          </div>

          {/* ৫. ম্যানেজমেন্ট */}
          <div>
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">ম্যানেজমেন্ট</h3>
             <Link href="/dashboard/management/routine" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname.includes("/management/routine") ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50")}>
                <Clock className="w-4 h-4" /> রুটিন ম্যানেজমেন্ট
             </Link>
          </div>

        </nav>

        {/* Footer Logout */}
        <div className="p-4 mt-auto border-t border-gray-100 sticky bottom-0 bg-white">
          <button className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> লগ আউট
          </button>
        </div>
      </aside>
    </>
  );
}