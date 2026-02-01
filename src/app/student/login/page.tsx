"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { User, Phone, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function StudentLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ১. ডাটাবেসে স্টুডেন্ট যাচাই করা
      const { data, error } = await supabase
        .from("students")
        .select("id, student_id, name_bn, father_mobile, status")
        .eq("student_id", studentId)
        .single();

      if (error || !data) {
        throw new Error("শিক্ষার্থী আইডি সঠিক নয়।");
      }

      // ২. মোবাইল নম্বর যাচাই করা (পাসওয়ার্ড হিসেবে)
      // নোট: মোবাইল নম্বরের ফরম্যাট নিয়ে সমস্যা হতে পারে (যেমন +880 বা 01...), তাই আমরা শেষ ১১ ডিজিট চেক করতে পারি অথবা হুবহু ম্যাচ
      if (data.father_mobile !== mobileNo && data.father_mobile.slice(-11) !== mobileNo.slice(-11)) {
        throw new Error("মোবাইল নম্বর সঠিক নয়।");
      }

      if (data.status !== "active") {
        throw new Error("আপনার অ্যাকাউন্টটি বর্তমানে নিষ্ক্রিয় অবস্থায় আছে। কর্তৃপক্ষের সাথে যোগাযোগ করুন।");
      }

      // ৩. সফল হলে সেশন কুকি/স্টোরেজ সেট করা
      // আমরা সিম্পল লোকাল স্টোরেজ ব্যবহার করছি পোর্টাল অ্যাক্সেসের জন্য
      localStorage.setItem("student_portal_session", JSON.stringify({
        id: data.id,
        student_id: data.student_id,
        name: data.name_bn,
        login_time: new Date().toISOString()
      }));

      // ৪. ড্যাশবোর্ডে রিডাইরেক্ট
      router.push("/student/dashboard");

    } catch (err: any) {
      setError(err.message || "লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4 font-[Kalpurush]">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-green-600">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4 border border-green-100 shadow-inner">
            <ShieldCheck className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">স্টুডেন্ট লগইন</CardTitle>
          <CardDescription>আপনার আইডি এবং মোবাইল নম্বর দিয়ে লগইন করুন</CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-100 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 ml-1">স্টুডেন্ট আইডি</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  required
                  placeholder="যেমন: 2023001"
                  className="pl-10 h-11 bg-gray-50 focus:bg-white transition-colors"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 ml-1">মোবাইল নম্বর (পাসওয়ার্ড)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  required
                  placeholder="অভিভাবকের মোবাইল নম্বর"
                  className="pl-10 h-11 bg-gray-50 focus:bg-white transition-colors"
                  value={mobileNo}
                  onChange={(e) => setMobileNo(e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500 text-right pr-1 pt-1">ভর্তির সময় ব্যবহৃত নম্বরটি দিন</p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold h-11 mt-2 shadow-lg shadow-green-200 transition-all active:scale-95"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <span className="flex items-center gap-2">লগইন করুন <ArrowRight className="w-4 h-4"/></span>}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center border-t bg-gray-50 py-4 rounded-b-xl">
          <Link href="/" className="text-sm text-gray-500 hover:text-green-700 font-medium transition-colors">
            হোমপেজে ফিরে যান
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
