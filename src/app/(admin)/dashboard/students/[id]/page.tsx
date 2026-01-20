"use client";

import { useState, useEffect, use } from "react"; // 'use' import করা হয়েছে
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Phone, 
  MapPin, 
  FileText, 
  User, 
  Printer,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

// টাইপ ডেফিনিশন
type StudentDetail = {
  id: string;
  created_at: string;
  status: string;
  branch_id: number;
  department: string;
  class_name: string;
  residential_status: string;
  
  name_bn: string;
  name_en: string;
  dob: string;
  age_info: string;
  birth_reg_no: string;
  blood_group: string;
  photo_url: string;
  birth_cert_url: string;

  father_name_bn: string;
  father_name_en: string;
  father_occupation: string;
  father_mobile: string;
  father_nid: string;
  father_nid_url: string;

  mother_name_bn: string;
  mother_name_en: string;
  mother_occupation: string;
  mother_mobile: string;
  mother_nid: string;
  mother_nid_url: string;

  guardian_name: string;
  guardian_relation: string;
  guardian_mobile: string;

  present_division: string;
  present_district: string;
  present_upazila: string;
  present_union: string;
  present_village: string;
  
  perm_division: string;
  perm_district: string;
  perm_upazila: string;
  perm_union: string;
  perm_village: string;
};

// ফিক্স: params এখন Promise টাইপ
export default function StudentDetails({ params }: { params: Promise<{ id: string }> }) {
  // ফিক্স: use() দিয়ে params আনর‍্যাপ করা হচ্ছে
  const { id } = use(params);
  
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // id পাওয়ার পরেই শুধু ফেচ করবে
    if (id) {
        fetchStudentDetails();
    }
  }, [id]);

  const fetchStudentDetails = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", id) // ফিক্স: params.id এর বদলে id ব্যবহার করা হয়েছে
      .single();

    if (error) {
      console.error("Error:", error);
      // alert("তথ্য পাওয়া যায়নি!"); // ইউজারের বিরক্তি এড়াতে অ্যালার্ট বন্ধ রাখা হলো, UI তে দেখানো হবে
    } else {
      setStudent(data);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (newStatus: 'active' | 'rejected') => {
    if (!confirm(newStatus === 'active' ? "আপনি কি এই ছাত্রীর ভর্তি নিশ্চিত করতে চান?" : "আপনি কি এই আবেদনটি বাতিল করতে চান?")) return;
    
    setUpdating(true);
    const { error } = await supabase
      .from("students")
      .update({ status: newStatus })
      .eq("id", id); // ফিক্স

    if (error) {
      alert("আপডেট ব্যর্থ হয়েছে!");
    } else {
      fetchStudentDetails(); 
      alert(newStatus === 'active' ? "ভর্তি নিশ্চিত করা হয়েছে!" : "আবেদন বাতিল করা হয়েছে।");
    }
    setUpdating(false);
  };

  const handleDelete = async () => {
    if (!confirm("সতর্কতা: এটি স্থায়ীভাবে ডিলিট হয়ে যাবে। আপনি কি নিশ্চিত?")) return;
    
    setUpdating(true);
    const { error } = await supabase.from("students").delete().eq("id", id); // ফিক্স
    
    if (error) {
        alert("ডিলিট করা যায়নি!");
        setUpdating(false);
    } else {
        router.push("/dashboard/students");
    }
  };

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-green-600" /></div>;
  
  if (!student) return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500 space-y-4">
        <XCircle className="w-16 h-16 text-red-200" />
        <p className="text-lg font-medium">কোনো তথ্য পাওয়া যায়নি</p>
        <Link href="/dashboard/students">
            <Button variant="outline">তালিকায় ফিরে যান</Button>
        </Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      
      {/* ১. টপ অ্যাকশন বার */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Link href="/dashboard/students">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> ব্যাকে যান
          </Button>
        </Link>
        
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 hidden md:flex">
                <Printer className="w-4 h-4" /> প্রিন্ট করুন
            </Button>
            
            {student.status === 'pending' && (
                <>
                    <Button 
                        onClick={() => handleStatusUpdate('rejected')} 
                        disabled={updating}
                        variant="destructive" 
                        size="sm"
                        className="gap-2"
                    >
                        <XCircle className="w-4 h-4" /> বাতিল করুন
                    </Button>
                    <Button 
                        onClick={() => handleStatusUpdate('active')} 
                        disabled={updating}
                        className="bg-green-600 hover:bg-green-700 text-white gap-2" 
                        size="sm"
                    >
                        <CheckCircle className="w-4 h-4" /> ভর্তি কনফার্ম করুন
                    </Button>
                </>
            )}
             {student.status === 'active' && (
                 <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" /> ভর্তি সম্পন্ন
                 </span>
             )}
             {student.status === 'rejected' && (
                 <span className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                    <XCircle className="w-5 h-5" /> বাতিলকৃত
                 </span>
             )}
        </div>
      </div>

      {/* ২. মেইন প্রোফাইল কার্ড */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         {/* কভার এরিয়া */}
         <div className="h-32 bg-gradient-to-r from-green-600 to-green-400 relative">
            <div className="absolute -bottom-16 left-6 md:left-10 p-1 bg-white rounded-xl shadow-md">
                {student.photo_url ? (
                    <Image src={student.photo_url} alt="Student" width={128} height={128} className="w-32 h-32 rounded-lg object-cover bg-gray-100" />
                ) : (
                    <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">ছবি নেই</div>
                )}
            </div>
         </div>
         
         {/* নাম ও বেসিক তথ্য */}
         <div className="pt-20 px-6 pb-6 md:px-10">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{student.name_bn}</h1>
            <p className="text-gray-500 font-medium">{student.name_en}</p>
            
            <div className="mt-4 flex flex-wrap gap-3">
                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-100">
                    শাখা: {student.branch_id === 1 ? 'হলিধানী বাজার' : 'চাঁন্দুয়ালী বাজার'}
                </span>
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100">
                    বিভাগ: {student.department}
                </span>
                <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium border border-purple-100">
                    ক্লাস: {student.class_name}
                </span>
                <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm font-medium border border-orange-100">
                    {student.residential_status === 'residential' ? 'আবাসিক' : 'অনাবাসিক'}
                </span>
            </div>
         </div>
      </div>

      {/* ৩. বিস্তারিত তথ্যের গ্রিড */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* ব্যক্তিগত তথ্য */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" /> ব্যক্তিগত তথ্য
              </h3>
              <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3">
                      <span className="text-gray-500">জন্ম তারিখ</span>
                      <span className="col-span-2 font-medium">{new Date(student.dob).toLocaleDateString('bn-BD')} ({student.age_info})</span>
                  </div>
                  <div className="grid grid-cols-3">
                      <span className="text-gray-500">রক্তের গ্রুপ</span>
                      <span className="col-span-2 font-medium">{student.blood_group || 'অজানা'}</span>
                  </div>
                  <div className="grid grid-cols-3">
                      <span className="text-gray-500">জন্ম নিবন্ধন</span>
                      <span className="col-span-2 font-medium">{student.birth_reg_no}</span>
                  </div>
              </div>
          </div>

          {/* ঠিকানার তথ্য */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" /> ঠিকানা
              </h3>
              <div className="space-y-3 text-sm">
                  <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-400 uppercase">বর্তমান ঠিকানা</span>
                      <p className="font-medium text-gray-800">
                          {student.present_village}, {student.present_union} <br />
                          {student.present_upazila}, {student.present_district} - {student.present_postcode}
                      </p>
                  </div>
                  <div className="space-y-1 mt-4">
                      <span className="text-xs font-bold text-gray-400 uppercase">স্থায়ী ঠিকানা</span>
                      <p className="font-medium text-gray-800">
                          {student.perm_village}, {student.perm_union} <br />
                          {student.perm_upazila}, {student.perm_district}
                      </p>
                  </div>
              </div>
          </div>

          {/* পিতা-মাতার তথ্য */}
          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
              <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" /> অভিভাবকের তথ্য
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* পিতা */}
                  <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-bold text-blue-800 flex items-center gap-2">পিতার তথ্য</h4>
                      <div className="space-y-2 text-sm">
                          <p><span className="text-gray-500">নাম:</span> <span className="font-medium">{student.father_name_bn}</span></p>
                          <p><span className="text-gray-500">পেশা:</span> <span className="font-medium">{student.father_occupation}</span></p>
                          <p className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <a href={`tel:${student.father_mobile}`} className="font-bold text-blue-600 hover:underline">{student.father_mobile}</a>
                          </p>
                          <p><span className="text-gray-500">NID:</span> <span className="font-medium">{student.father_nid || 'নেই'}</span></p>
                      </div>
                  </div>

                  {/* মাতা */}
                  <div className="space-y-3 bg-pink-50 p-4 rounded-lg">
                      <h4 className="font-bold text-pink-800 flex items-center gap-2">মাতার তথ্য</h4>
                      <div className="space-y-2 text-sm">
                          <p><span className="text-gray-500">নাম:</span> <span className="font-medium">{student.mother_name_bn}</span></p>
                          <p><span className="text-gray-500">পেশা:</span> <span className="font-medium">{student.mother_occupation}</span></p>
                          <p className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <a href={`tel:${student.mother_mobile}`} className="font-bold text-pink-600 hover:underline">{student.mother_mobile}</a>
                          </p>
                          <p><span className="text-gray-500">NID:</span> <span className="font-medium">{student.mother_nid || 'নেই'}</span></p>
                      </div>
                  </div>
              </div>

              {/* অভিভাবক (যদি থাকে) */}
              {(student.guardian_name) && (
                  <div className="mt-4 border-t pt-4">
                      <p className="text-sm font-medium text-gray-700">
                          স্থানীয় অভিভাবক: <span className="font-bold">{student.guardian_name}</span> ({student.guardian_relation}) - {student.guardian_mobile}
                      </p>
                  </div>
              )}
          </div>

          {/* ডকুমেন্টস গ্যালারি */}
          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" /> সংযুক্ত কাগজপত্র
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {student.birth_cert_url && (
                      <div className="border p-2 rounded-lg text-center">
                          <p className="text-xs text-gray-500 mb-2">জন্ম সনদ</p>
                          <a href={student.birth_cert_url} target="_blank" rel="noopener noreferrer">
                            <img src={student.birth_cert_url} className="h-32 w-full object-cover rounded hover:opacity-80 transition" alt="Birth Cert" />
                          </a>
                      </div>
                  )}
                  {student.father_nid_url && (
                      <div className="border p-2 rounded-lg text-center">
                          <p className="text-xs text-gray-500 mb-2">পিতার এনআইডি</p>
                          <a href={student.father_nid_url} target="_blank" rel="noopener noreferrer">
                             <img src={student.father_nid_url} className="h-32 w-full object-cover rounded hover:opacity-80 transition" alt="Father NID" />
                          </a>
                      </div>
                  )}
                  {student.mother_nid_url && (
                      <div className="border p-2 rounded-lg text-center">
                          <p className="text-xs text-gray-500 mb-2">মাতার এনআইডি</p>
                          <a href={student.mother_nid_url} target="_blank" rel="noopener noreferrer">
                             <img src={student.mother_nid_url} className="h-32 w-full object-cover rounded hover:opacity-80 transition" alt="Mother NID" />
                          </a>
                      </div>
                  )}
              </div>
          </div>

          {/* ডেঞ্জার জোন (ডিলিট বাটন) */}
          <div className="md:col-span-2 flex justify-end pt-6">
              <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4" /> আবেদন ডিলিট করুন
              </Button>
          </div>

      </div>
    </div>
  );
}