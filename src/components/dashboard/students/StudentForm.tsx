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
import { Loader2, Save, BookOpen, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { STUDENT_STATUSES, getStudentStatus } from "@/lib/studentStatus";
import {
  isHifzDepartment,
  normalizeAcademicText,
  buildSecondaryEnrollmentFields,
  formatSecondaryEnrollmentDbError,
} from "@/lib/secondaryEnrollment";

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
    secondary_department: "",
    secondary_class_name: "",
    secondary_roll_number: "",
    father_mobile: "",
    status: "active",
    branch_id: "",
    residential_status: "non_residential",
    extra_care_enabled: false,
  });

  useEffect(() => {
    if (student) {
      setFormData({
        name_bn: student.name_bn || "",
        student_id: student.student_id || "",
        class_name: student.class_name || "",
        department: student.department || "",
        secondary_department: student.secondary_department || "",
        secondary_class_name: student.secondary_class_name || "",
        secondary_roll_number: student.secondary_roll_number || "",
        father_mobile: student.father_mobile || "",
        status: getStudentStatus(student.status || "active").value,
        branch_id: student.branch_id?.toString() || "",
        residential_status: student.residential_status || "non_residential",
        extra_care_enabled: student.extra_care_enabled || false,
      });
    } else {
      setFormData({
        name_bn: "",
        student_id: "",
        class_name: "",
        department: "",
        secondary_department: "",
        secondary_class_name: "",
        secondary_roll_number: "",
        father_mobile: "",
        status: "active",
        branch_id: "",
        residential_status: "non_residential",
        extra_care_enabled: false,
      });
    }
  }, [student, open]);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const secondaryDeptOptions = dbDepartments.filter(
    (d: any) =>
      (!formData.branch_id || String(d.branch_id) === String(formData.branch_id)) &&
      !isHifzDepartment(d.name)
  );

  const secondaryClassOptions = (() => {
    if (!formData.secondary_department) return [];
    const targetDept = dbDepartments.find(
      (dept: any) =>
        normalizeAcademicText(dept.name) === normalizeAcademicText(formData.secondary_department) &&
        (!formData.branch_id || String(dept.branch_id) === String(formData.branch_id))
    );
    const matches = dbClasses.filter(
      (c: any) =>
        c.department_id === targetDept?.id &&
        (!formData.branch_id || String(c.branch_id) === String(formData.branch_id)) &&
        (!student?.academic_year || !c.academic_year || String(c.academic_year) === String(student.academic_year))
    );
    const seen = new Set<string>();
    return matches.filter((c: any) => {
      const key = normalizeAcademicText(c.name);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        secondary_department,
        secondary_class_name,
        secondary_roll_number,
        ...baseFields
      } = formData;
      const payload = {
        ...baseFields,
        ...buildSecondaryEnrollmentFields(
          { secondary_department, secondary_class_name, secondary_roll_number },
          student
        ),
      };

      if (student) {
        // Update existing student
        const { error } = await supabase
          .from("students")
          .update(payload)
          .eq("id", student.id);

        if (error) throw error;
      } else {
        // Create new student
        // Note: Ideally, use the full add page for better validation and ID generation
        const { error } = await supabase.from("students").insert([payload]);

        if (error) throw error;
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving student:", error);
      alert("Error saving student: " + formatSecondaryEnrollmentDbError(error));
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
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    department: val,
                    class_name: "",
                    ...(isHifzDepartment(val)
                      ? {}
                      : {
                          secondary_department: "",
                          secondary_class_name: "",
                          secondary_roll_number: "",
                        }),
                  }))
                }
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
                    (() => {
                      const d = dbDepartments.find(
                        (dept: any) =>
                          normalizeAcademicText(dept.name) === normalizeAcademicText(formData.department) &&
                          (!formData.branch_id || String(dept.branch_id) === String(formData.branch_id))
                      );
                      const seen = new Set<string>();
                      return dbClasses
                        .filter((c: any) => {
                          if (c.department_id !== d?.id || (formData.branch_id && String(c.branch_id) !== String(formData.branch_id))) {
                            return false;
                          }
                          const key = normalizeAcademicText(c.name);
                          if (!key || seen.has(key)) return false;
                          seen.add(key);
                          return true;
                        })
                        .map((cls: any) => (
                          <SelectItem key={cls.id} value={cls.name}>
                            {cls.name.trim()}
                          </SelectItem>
                        ));
                    })()
                  ) : (
                    <SelectItem value="none" disabled>
                      আগে বিভাগ নির্বাচন করুন
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(isHifzDepartment(formData.department) || Boolean(formData.secondary_class_name || formData.secondary_department)) && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    অতিরিক্ত বিভাগ ও শ্রেণি (শুধু ক্লাস তালিকা ও পরীক্ষা)
                  </p>
                  <p className="text-[11px] text-purple-700/80">
                    হাজিরা ও ফি হেফজখানার সাথেই থাকবে; এখানে নির্বাচিত শ্রেণির তালিকা ও পরীক্ষায় অংশ নিবে।
                  </p>
                </div>
                {(formData.secondary_department || formData.secondary_class_name || formData.secondary_roll_number) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        secondary_department: "",
                        secondary_class_name: "",
                        secondary_roll_number: "",
                      }))
                    }
                    className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <X className="w-3 h-3 mr-1" /> মুছুন
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-purple-900">অতিরিক্ত বিভাগ</Label>
                  <Select
                    value={formData.secondary_department}
                    onValueChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        secondary_department: val,
                        secondary_class_name: "",
                      }))
                    }
                  >
                    <SelectTrigger className="bg-white h-9 text-xs">
                      <SelectValue placeholder="যেমন: কিতাব" />
                    </SelectTrigger>
                    <SelectContent>
                      {secondaryDeptOptions.map((dept: any) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name.trim()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-purple-900">অতিরিক্ত শ্রেণি</Label>
                  <Select
                    value={formData.secondary_class_name}
                    onValueChange={(val) => handleChange("secondary_class_name", val)}
                  >
                    <SelectTrigger className="bg-white h-9 text-xs">
                      <SelectValue placeholder="যেমন: চতুর্থ" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.secondary_department ? (
                        secondaryClassOptions.length > 0 ? (
                          secondaryClassOptions.map((cls: any) => (
                            <SelectItem key={cls.id} value={cls.name}>
                              {cls.name.trim()}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none_cls" disabled>
                            এই বিভাগে কোনো শ্রেণি নেই
                          </SelectItem>
                        )
                      ) : (
                        <SelectItem value="none_dept" disabled>
                          আগে বিভাগ নির্বাচন করুন
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-purple-900">অতিরিক্ত রোল (ঐচ্ছিক)</Label>
                  <Input
                    value={formData.secondary_roll_number}
                    onChange={(e) => handleChange("secondary_roll_number", e.target.value)}
                    placeholder="যেমন: ১৫"
                    className="bg-white h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

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
                  {STUDENT_STATUSES.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
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

           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="residential_status">আবাসন</Label>
               <Select
                 value={formData.residential_status}
                 onValueChange={(val) => {
                   handleChange("residential_status", val);
                   if (val === "residential") {
                     setFormData(prev => ({ ...prev, residential_status: val, extra_care_enabled: false }));
                   } else {
                     handleChange("residential_status", val);
                   }
                 }}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="আবাসন নির্বাচন" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="non_residential">অনাবাসিক</SelectItem>
                   <SelectItem value="residential">আবাসিক</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             {formData.residential_status === "non_residential" && (
               <div className="space-y-2">
                 <Label htmlFor="extra_care">এক্সট্রা কেয়ার</Label>
                 <div className="flex items-center gap-3 h-10">
                   <Checkbox
                     id="extra_care"
                     checked={formData.extra_care_enabled}
                     onCheckedChange={(checked) => setFormData(prev => ({ ...prev, extra_care_enabled: !!checked }))}
                   />
                   <span className="text-sm text-gray-600">
                     {formData.extra_care_enabled ? "সক্রিয়" : "নিষ্ক্রিয়"}
                   </span>
                 </div>
               </div>
             )}
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
