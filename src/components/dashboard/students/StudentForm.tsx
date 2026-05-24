"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Save } from "lucide-react";

type StudentFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: any;
  onSuccess: () => void;
  branches?: any[];
  dbDepartments?: any[];
  dbClasses?: any[];
};

export default function StudentForm({
  open,
  onOpenChange,
  student,
  onSuccess,
  branches = [],
  dbDepartments = [],
  dbClasses = []
}: StudentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name_bn: "",
    student_id: "",
    class_name: "",
    department: "",
    father_mobile: "",
    status: "active",
    branch_id: "",
  });

  useEffect(() => {
    if (student) {
      setFormData({
        name_bn: student.name_bn || "",
        student_id: student.student_id || "",
        class_name: student.class_name || "",
        department: student.department || "",
        father_mobile: student.father_mobile || "",
        status: student.status || "active",
        branch_id: student.branch_id?.toString() || "",
      });
    } else {
      setFormData({
        name_bn: "",
        student_id: "",
        class_name: "",
        department: "",
        father_mobile: "",
        status: "active",
        branch_id: "",
      });
    }
  }, [student, open]);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (student) {
        // Update existing student
        const { error } = await supabase
          .from("students")
          .update(formData)
          .eq("id", student.id);

        if (error) throw error;
      } else {
        // Create new student
        // Note: Ideally, use the full add page for better validation and ID generation
        const { error } = await supabase.from("students").insert([formData]);

        if (error) throw error;
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving student:", error);
      alert("Error saving student: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {student ? "শিক্ষার্থী তথ্য হালনাগাদ" : "নতুন শিক্ষার্থী ভর্তি"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name_bn">নাম (বাংলা)</Label>
              <Input
                id="name_bn"
                value={formData.name_bn}
                onChange={(e) => handleChange("name_bn", e.target.value)}
                placeholder="শিক্ষার্থীর নাম"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student_id">স্টুডেন্ট আইডি</Label>
              <Input
                id="student_id"
                value={formData.student_id}
                onChange={(e) => handleChange("student_id", e.target.value)}
                placeholder="ID"
                disabled={!!student} // Disable ID edit on update usually
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">বিভাগ</Label>
              <Select
                value={formData.department}
                onValueChange={(val) => handleChange("department", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="বিভাগ নির্বাচন" />
                </SelectTrigger>
                <SelectContent>
                  {dbDepartments
                    .filter((d: any) => !formData.branch_id || String(d.branch_id) === String(formData.branch_id))
                    .map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class_name">শ্রেণি</Label>
              <Select
                value={formData.class_name}
                onValueChange={(val) => handleChange("class_name", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="শ্রেণি নির্বাচন" />
                </SelectTrigger>
                <SelectContent>
                  {formData.department ? (
                    dbClasses
                      .filter((c: any) => {
                        const d = dbDepartments.find((dept: any) => dept.name === formData.department && (!formData.branch_id || String(dept.branch_id) === String(formData.branch_id)));
                        return c.department_id === d?.id && (!formData.branch_id || String(c.branch_id) === String(formData.branch_id));
                      })
                      .map((cls: any) => (
                        <SelectItem key={cls.id} value={cls.name}>
                          {cls.name}
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="none" disabled>
                      আগে বিভাগ নির্বাচন করুন
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="father_mobile">মোবাইল নম্বর</Label>
              <Input
                id="father_mobile"
                value={formData.father_mobile}
                onChange={(e) => handleChange("father_mobile", e.target.value)}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">অবস্থা</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => handleChange("status", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="অবস্থা" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

           <div className="space-y-2">
              <Label htmlFor="branch_id">শাখা</Label>
              <Select
                value={formData.branch_id}
                onValueChange={(val) => handleChange("branch_id", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="শাখা নির্বাচন" />
                </SelectTrigger>
                <SelectContent>
                    {branches.map((b: any) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

          <DialogFooter>
             {!student && (
                <p className="text-xs text-gray-500 mt-2 mr-auto">
                    বিস্তারিত তথ্যের জন্য <a href="/dashboard/students/add" className="text-blue-600 underline">পূর্ণাঙ্গ ফর্ম</a> ব্যবহার করুন।
                </p>
            )}
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> সংরক্ষণ হচ্ছে...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> সংরক্ষণ করুন
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
