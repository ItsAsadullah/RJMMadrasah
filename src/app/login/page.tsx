"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
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
            const { error } = await supabase.auth.signInWithPassword({
                email: identifier,
                password: password,
            });

            if (error) throw error;
            router.push("/dashboard");
            router.refresh();

        } else if (userType === 'teacher') {
            // --- TEACHER LOGIN LOGIC ---
            const { data, error } = await supabase
                .from("teachers")
                .select("*")
                .eq("user_id", identifier)
                .single();

            if (error || !data) {
                throw new Error("ইউজার আইডি সঠিক নয়।");
            }

            if (data.password !== password) {
                throw new Error("পাসওয়ার্ড সঠিক নয়।");
            }

            // Set Session
            localStorage.setItem("teacher_portal_session", JSON.stringify({
                id: data.id,
                name: data.name,
                user_id: data.user_id,
                designation: data.designation,
                login_time: new Date().toISOString()
            }));

            // Redirect
            router.push("/teacher/dashboard");

        } else {
            // --- STUDENT LOGIN LOGIC ---
            // 1. Verify Student ID
            const { data, error } = await supabase
                .from("students")
                .select("id, student_id, name_bn, father_mobile, status")
                .eq("student_id", identifier)
                .single();

            if (error || !data) {
                throw new Error("শিক্ষার্থী আইডি সঠিক নয়।");
            }

            // 2. Verify Mobile Number (Last 11 digits check)
            if (data.father_mobile !== password && data.father_mobile.slice(-11) !== password.slice(-11)) {
                throw new Error("মোবাইল নম্বর সঠিক নয়।");
            }

            if (data.status !== "active") {
                throw new Error("আপনার অ্যাকাউন্টটি বর্তমানে নিষ্ক্রিয় অবস্থায় আছে।");
            }

            // 3. Set Session
            localStorage.setItem("student_portal_session", JSON.stringify({
                id: data.id,
                student_id: data.student_id,
                name: data.name_bn,
                login_time: new Date().toISOString()
            }));

            // 4. Redirect
            router.push("/student/dashboard");
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
                {userType === 'student' ? "মোবাইল নম্বর" : "পাসওয়ার্ড"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type={userType === 'student' ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-gray-50 focus:bg-white"
                placeholder={userType === 'student' ? "অভিভাবকের মোবাইল নম্বর" : "••••••••"}
              />
            </div>
            {userType === 'student' && (
                <p className="text-xs text-gray-500 text-right">ভর্তির সময় ব্যবহৃত মোবাইল নম্বরটি দিন</p>
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
