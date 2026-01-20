"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Save, School, UserPlus } from "lucide-react";
import { divisions, districts, upazilas, departments, classesByDept } from "@/data/bangladesh-data";

export default function AdminStudentAdd() {
  const [loading, setLoading] = useState(false);
  
  // ফর্ম ডাটা (সংক্ষিপ্ত ভার্সন - অ্যাডমিনের দ্রুত এন্ট্রির জন্য)
  const [formData, setFormData] = useState({
    name_bn: "",
    branch_id: "1",
    department: "",
    class_name: "",
    father_mobile: "",
    birth_reg_no: "",
    status: "active" // অ্যাডমিন এন্ট্রি দিলে সরাসরি একটিভ
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_bn || !formData.class_name || !formData.father_mobile) {
      alert("নাম, ক্লাস এবং মোবাইল নম্বর আবশ্যক!");
      return;
    }

    setLoading(true);
    // মোবাইল নম্বরে 01 যোগ করা
    const payload = {
      ...formData,
      branch_id: parseInt(formData.branch_id),
      father_mobile: formData.father_mobile.startsWith("01") ? formData.father_mobile : "01" + formData.father_mobile
    };

    const { error } = await supabase.from("students").insert([payload]);

    if (error) {
      console.error(error);
      alert("সেভ করা যায়নি!");
    } else {
      alert("শিক্ষার্থী সফলভাবে ভর্তি হয়েছে! ✅");
      // ফর্ম রিসেট
      setFormData({ ...formData, name_bn: "", father_mobile: "", birth_reg_no: "" });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="bg-green-100 p-2 rounded-full">
          <UserPlus className="w-6 h-6 text-green-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">নতুন শিক্ষার্থী ভর্তি (অ্যাডমিন)</h1>
          <p className="text-sm text-gray-500">সরাসরি ডাটাবেসে শিক্ষার্থী যুক্ত করুন</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
        
        {/* ১. প্রাতিষ্ঠানিক তথ্য */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">শাখা</label>
            <select name="branch_id" value={formData.branch_id} onChange={handleChange} className="w-full h-10 px-3 border rounded-md">
              <option value="1">হলিধানী বাজার শাখা</option>
              <option value="2">চাঁন্দুয়ালী বাজার শাখা</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">বিভাগ</label>
            <select name="department" value={formData.department} onChange={handleChange} className="w-full h-10 px-3 border rounded-md">
              <option value="">সিলেক্ট</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">ক্লাস/জামাত</label>
            <select name="class_name" value={formData.class_name} onChange={handleChange} className="w-full h-10 px-3 border rounded-md">
              <option value="">সিলেক্ট</option>
              {formData.department && classesByDept[formData.department]?.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* ২. ব্যক্তিগত তথ্য */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">শিক্ষার্থীর নাম (বাংলায়) *</label>
            <input type="text" name="name_bn" required value={formData.name_bn} onChange={handleChange} className="w-full h-10 px-3 border rounded-md" placeholder="সম্পূর্ণ নাম" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">জন্ম নিবন্ধন নম্বর</label>
            <input type="text" name="birth_reg_no" value={formData.birth_reg_no} onChange={handleChange} className="w-full h-10 px-3 border rounded-md" placeholder="১৭ ডিজিট" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">অভিভাবকের মোবাইল *</label>
            <input type="text" name="father_mobile" required value={formData.father_mobile} onChange={handleChange} className="w-full h-10 px-3 border rounded-md" placeholder="017XXXXXXXX" />
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button type="submit" disabled={loading} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4" />} ভর্তি সম্পন্ন করুন
          </Button>
        </div>
      </form>
    </div>
  );
}