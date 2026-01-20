import Sidebar from "@/components/dashboard/Sidebar";
import { School } from "lucide-react"; // মোবাইলের জন্য আইকন

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ডেস্কটপ সাইডবার */}
      <Sidebar />

      {/* মেইন কন্টেন্ট এরিয়া */}
      <div className="md:ml-64 min-h-screen flex flex-col">
        
        {/* মোবাইল হেডার (শুধুমাত্র ছোট স্ক্রিনে দেখাবে) */}
        <div className="md:hidden bg-white h-16 border-b flex items-center justify-between px-4 sticky top-0 z-30">
           <div className="flex items-center gap-2">
              <School className="w-6 h-6 text-green-600" />
              <span className="font-bold text-gray-800">অ্যাডমিন প্যানেল</span>
           </div>
           {/* এখানে মোবাইল মেনু বাটন যুক্ত করা যেতে পারে */}
        </div>

        {/* পেজ কন্টেন্ট */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}