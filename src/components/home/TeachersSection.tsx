"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";
import { Users, GraduationCap, MapPin } from "lucide-react";

export default function TeachersSection() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      // Fetch teachers with branch info
      const { data, error } = await supabase
        .from("teachers")
        .select(`
          name, 
          designation, 
          subject_specialty,
          image_url,
          branches (
            name
          )
        `)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching teachers:", error);
      } else {
        setTeachers(data || []);
      }
      setLoading(false);
    };

    fetchTeachers();
  }, []);

  if (loading) return null;
  if (teachers.length === 0) return null;

  return (
    <section className="py-24 bg-green-50/30 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-white to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white to-transparent"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-white rounded-full shadow-md text-green-600 font-bold mb-6 border border-green-100">
                <Users className="w-5 h-5" />
                <span>আমাদের গর্বিত শিক্ষকমণ্ডলী</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight mb-4">যাদের ছোঁয়ায় <span className="text-green-600">মানুষ</span> গড়ে</h2>
            <div className="h-1.5 w-24 bg-gradient-to-r from-green-400 to-green-600 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {teachers.map((teacher, index) => (
                <div key={index} className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl border border-gray-100 hover:border-green-200 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden">
                    {/* Top Decorative Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="relative mb-6">
                        <div className="w-24 h-24 rounded-full bg-green-50 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
                            {/* Islamic Female Avatar Placeholder */}
                            <Image 
                                src={teacher.image_url || "https://cdn-icons-png.flaticon.com/512/6997/6997662.png"}
                                alt={teacher.name}
                                width={100}
                                height={100}
                                className="object-cover w-full h-full"
                            />
                        </div>
                        <div className="absolute bottom-0 right-0 bg-green-600 text-white p-1.5 rounded-full shadow-sm border-2 border-white">
                            <GraduationCap className="w-3 h-3" />
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-green-700 transition-colors">{teacher.name}</h3>
                    <p className="text-green-600 font-medium text-sm mb-2">{teacher.designation}</p>
                    
                    {teacher.branches?.name && (
                        <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
                            <MapPin className="w-3 h-3" />
                            <span>{teacher.branches.name}</span>
                        </div>
                    )}
                    
                    {teacher.subject_specialty && (
                        <div className="inline-block px-3 py-1 bg-gray-50 text-gray-500 text-xs rounded-full border border-gray-100 group-hover:bg-green-50 group-hover:text-green-700 group-hover:border-green-100 transition-colors">
                            {teacher.subject_specialty}
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>
    </section>
  );
}
