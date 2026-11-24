"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearStoredSupabaseSession, supabase } from "@/lib/supabase/client";
import { isAdminUser } from "@/lib/adminAccess";
import { Button } from "@/components/ui/button";
import { School, Lock, User, Loader2 } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function UniversalLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Login State
  const [userType, setUserType] = useState<"admin" | "student" | "teacher">("student");
  const [identifier, setIdentifier] = useState(""); // Email for admin, ID for student/teacher
  const [password, setPassword] = useState(""); // Password for admin/teacher, Mobile for student

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        if (userType === 'admin') {
            // --- ADMIN LOGIN LOGIC ---
            clearStoredSupabaseSession();
            await supabase.auth.signOut({ scope: "local" });

            const { error } = await supabase.auth.signInWithPassword({
                email: identifier,
                password: password,
            });

            if (error) throw error;
            const { data: { user }, error: verificationError } = await supabase.auth.getUser();
            if (verificationError || !isAdminUser(user)) {
                await supabase.auth.signOut({ scope: "local" });
                throw new Error("এই অ্যাকাউন্টের অ্যাডমিন প্যানেলে প্রবেশের অনুমতি নেই।");
            }
            router.push("/dashboard");
            router.refresh();

        } else {
            const response = await fetch("/api/portal/login", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: userType, identifier: identifier.trim(), password }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            localStorage.removeItem("teacher_portal_session");
            localStorage.removeItem("student_portal_session");
            window.location.assign(userType === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
        }
    } catch (err: any) {
        setError(err.message || "লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করে আবার চেষ্টা করুন।");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4 font-[Kalpurush]">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-green-100">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <School className="w-8 h-8 text-green-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">লগইন প্যানেল</h1>
          <p className="text-sm text-gray-500 mt-1">রহিমা জান্নাত মহিলা মাদ্রাসা</p>
        </div>

        {/* Tabs for Switching */}
        <Tabs defaultValue="student" className="w-full mb-6" onValueChange={(val) => {
            setUserType(val as "admin" | "student" | "teacher");
            setIdentifier("");
            setPassword("");
            setError(null);
        }}>
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="student">শিক্ষার্থী</TabsTrigger>
                <TabsTrigger value="teacher">শিক্ষক</TabsTrigger>
                <TabsTrigger value="admin">অ্যাডমিন</TabsTrigger>
            </TabsList>
        </Tabs>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-100 animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">
                {userType === 'admin' ? "ইমেইল" : userType === 'teacher' ? "ইউজার আইডি" : "স্টুডেন্ট আইডি"}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type={userType === 'admin' ? "email" : "text"}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-gray-50 focus:bg-white"
                placeholder={userType === 'admin' ? "admin@example.com" : userType === 'teacher' ? "teacher123" : "উদাহরণ: 2023001"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">
                {userType === 'student' ? "জরুরী যোগাযোগের নম্বর (পাসওয়ার্ড)" : "পাসওয়ার্ড"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type={userType === 'student' ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-gray-50 focus:bg-white"
                placeholder={userType === 'student' ? "জরুরী যোগাযোগের নম্বরটি দিন" : "••••••••"}
              />
            </div>
            {userType === 'student' && (
                <p className="text-xs text-gray-500 text-right">ভর্তির ফর্মে দেয়া জরুরী যোগাযোগের নম্বরটি দিন</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 text-white h-11 text-base font-bold shadow-lg shadow-green-200"
            disabled={loading}
          >
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> যাচাই হচ্ছে...</> : "লগইন করুন"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-green-600 hover:underline">
            ← হোমপেজে ফিরে যান
          </Link>
        </div>
      </div>
    </div>
  );
}
