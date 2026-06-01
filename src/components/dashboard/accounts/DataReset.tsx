"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Trash2, ShieldAlert, Loader2, Building2 } from "lucide-react";

export default function DataReset() {
    const [branches, setBranches] = useState<any[]>([]);
    const [selectedBranch, setSelectedBranch] = useState("all");
    const [confirmText, setConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const [selectedTypes, setSelectedTypes] = useState({
        feeCollections: false,
        assignedDues: false,
        teacherSalaries: false,
        waivers: false,
        donations: false,
        expenses: false
    });

    useEffect(() => {
        const fetchBranches = async () => {
            const { data } = await supabase.from("branches").select("id, name");
            if (data) setBranches(data);
        };
        fetchBranches();
    }, []);

    const handleCheckboxChange = (key: keyof typeof selectedTypes) => {
        setSelectedTypes(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const isAnySelected = Object.values(selectedTypes).some(v => v);
    const isValidConfirmation = confirmText === "Confirm";

    const getStudentIdsInBranch = async (branchId: string) => {
        const { data } = await supabase.from("students").select("student_id").eq("branch_id", parseInt(branchId));
        return data ? data.map(d => d.student_id) : [];
    };

    const getStudentInternalIdsInBranch = async (branchId: string) => {
        const { data } = await supabase.from("students").select("id").eq("branch_id", parseInt(branchId));
        return data ? data.map(d => d.id) : [];
    };

    const getTeacherIdsInBranch = async (branchId: string) => {
        const { data } = await supabase.from("teachers").select("id").eq("branch_id", parseInt(branchId));
        return data ? data.map(d => d.id) : [];
    };

    const handleReset = async () => {
        if (!isAnySelected || !isValidConfirmation) return;

        setIsDeleting(true);

        try {
            const isAllBranches = selectedBranch === "all";

            // 1. Student Fee Collections (transactions where type='income' and student_id is not null)
            if (selectedTypes.feeCollections) {
                let txQuery = supabase.from("transactions").delete().eq("type", "income").not("student_id", "is", null);
                if (!isAllBranches) {
                    txQuery = txQuery.eq("branch_id", parseInt(selectedBranch));
                }
                await txQuery;

                // Also reset student_dues paid amounts
                let duesUpdateQuery = supabase.from("student_dues").update({ paid_amount: 0, status: "unpaid" });
                if (!isAllBranches) {
                    const internalIds = await getStudentInternalIdsInBranch(selectedBranch);
                    if (internalIds.length > 0) {
                        duesUpdateQuery = duesUpdateQuery.in("student_id", internalIds);
                    } else {
                        // Dummy condition that fails if no students found
                        duesUpdateQuery = duesUpdateQuery.eq("id", -1);
                    }
                } else {
                    duesUpdateQuery = duesUpdateQuery.neq("id", -1); // update all
                }
                await duesUpdateQuery;
            }

            // 2. Assigned Dues (student_dues)
            if (selectedTypes.assignedDues) {
                let duesDeleteQuery = supabase.from("student_dues").delete();
                if (!isAllBranches) {
                    const internalIds = await getStudentInternalIdsInBranch(selectedBranch);
                    if (internalIds.length > 0) {
                        duesDeleteQuery = duesDeleteQuery.in("student_id", internalIds);
                    } else {
                        duesDeleteQuery = duesDeleteQuery.eq("id", -1);
                    }
                } else {
                    duesDeleteQuery = duesDeleteQuery.neq("id", -1);
                }
                await duesDeleteQuery;
            }

            // 3. Teacher Salaries (teacher_salaries and transactions)
            if (selectedTypes.teacherSalaries) {
                let salQuery = supabase.from("teacher_salaries").delete();
                let txSalQuery = supabase.from("transactions").delete().eq("type", "expense").ilike("description", "%শিক্ষক বেতন%");
                
                if (!isAllBranches) {
                    const teacherIds = await getTeacherIdsInBranch(selectedBranch);
                    if (teacherIds.length > 0) {
                        salQuery = salQuery.in("teacher_id", teacherIds);
                    } else {
                        salQuery = salQuery.eq("id", -1);
                    }
                    txSalQuery = txSalQuery.eq("branch_id", parseInt(selectedBranch));
                } else {
                    salQuery = salQuery.neq("id", -1);
                }
                await salQuery;
                await txSalQuery;
            }

            // 4. Waivers (student_waivers)
            if (selectedTypes.waivers) {
                let waiverQuery = supabase.from("student_waivers").delete();
                if (!isAllBranches) {
                    const studentIds = await getStudentIdsInBranch(selectedBranch);
                    if (studentIds.length > 0) {
                        waiverQuery = waiverQuery.in("student_id", studentIds);
                    } else {
                        waiverQuery = waiverQuery.eq("id", -1);
                    }
                } else {
                    waiverQuery = waiverQuery.neq("id", -1);
                }
                await waiverQuery;
            }

            // 5. Donations (transactions where type='income' and student_id is null and due_id is null)
            if (selectedTypes.donations) {
                let donQuery = supabase.from("transactions")
                    .delete()
                    .eq("type", "income")
                    .is("student_id", null)
                    .is("due_id", null);
                
                if (!isAllBranches) {
                    donQuery = donQuery.eq("branch_id", parseInt(selectedBranch));
                }
                await donQuery;
            }

            // 6. General Expenses (transactions where type='expense' and description not like '%শিক্ষক বেতন%')
            if (selectedTypes.expenses) {
                let expQuery = supabase.from("transactions")
                    .delete()
                    .eq("type", "expense")
                    .not("description", "ilike", "%শিক্ষক বেতন%");
                
                if (!isAllBranches) {
                    expQuery = expQuery.eq("branch_id", parseInt(selectedBranch));
                }
                await expQuery;
            }

            alert("নির্বাচিত ডেটা সফলভাবে রিসেট করা হয়েছে!");
            
            // Reset form
            setConfirmText("");
            setSelectedTypes({
                feeCollections: false,
                assignedDues: false,
                teacherSalaries: false,
                waivers: false,
                donations: false,
                expenses: false
            });

        } catch (error: any) {
            console.error("Error during reset:", error);
            alert("ডেটা রিসেট করার সময় একটি সমস্যা হয়েছে: " + error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Card className="border-red-200 shadow-sm overflow-hidden">
                <div className="bg-red-50 p-4 border-b border-red-100 flex items-start gap-3">
                    <div className="shrink-0 p-2 bg-red-100 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-red-900">ডেটা রিসেট / ক্লিয়ার (Data Reset)</h2>
                        <p className="text-sm text-red-700 mt-1">
                            সতর্কতা: এখান থেকে মুছে ফেলা ডেটা আর রিকভার করা সম্ভব নয়। সাবধানে রিসেট অপশন ব্যবহার করুন।
                        </p>
                    </div>
                </div>

                <CardContent className="p-6 space-y-8">
                    {/* Branch Selection */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-500" /> ১. শাখা নির্বাচন করুন
                        </Label>
                        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                            <SelectTrigger className="w-full sm:w-[300px]">
                                <SelectValue placeholder="শাখা নির্বাচন করুন" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="font-bold text-red-600">সকল শাখা (All Branches)</SelectItem>
                                {branches.map(b => (
                                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Category Checkboxes */}
                    <div className="space-y-4">
                        <Label className="text-base font-semibold flex items-center gap-2">
                            <Trash2 className="w-4 h-4 text-gray-500" /> ২. কী কী রিসেট করতে চান?
                        </Label>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex items-start space-x-3">
                                <Checkbox 
                                    id="feeCollections" 
                                    checked={selectedTypes.feeCollections}
                                    onCheckedChange={() => handleCheckboxChange("feeCollections")}
                                    className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 mt-0.5"
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor="feeCollections" className="text-sm font-semibold cursor-pointer">স্টুডেন্ট ফি আদায় (Collections)</label>
                                    <p className="text-xs text-gray-500">সকল আদায়কৃত ফি মুছে যাবে, বকেয়া আগের মতো Unpaid হয়ে যাবে।</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start space-x-3">
                                <Checkbox 
                                    id="assignedDues" 
                                    checked={selectedTypes.assignedDues}
                                    onCheckedChange={() => handleCheckboxChange("assignedDues")}
                                    className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 mt-0.5"
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor="assignedDues" className="text-sm font-semibold cursor-pointer text-red-600">ফি নির্ধারণ (Assigned Dues)</label>
                                    <p className="text-xs text-gray-500">সকল নির্ধারিত ফি/বকেয়া রেকর্ড ডেটাবেজ থেকে মুছে যাবে।</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <Checkbox 
                                    id="teacherSalaries" 
                                    checked={selectedTypes.teacherSalaries}
                                    onCheckedChange={() => handleCheckboxChange("teacherSalaries")}
                                    className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 mt-0.5"
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor="teacherSalaries" className="text-sm font-semibold cursor-pointer">শিক্ষক বেতন (Teacher Salaries)</label>
                                    <p className="text-xs text-gray-500">শিক্ষকদের প্রদানকৃত সকল বেতনের রেকর্ড মুছে যাবে।</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <Checkbox 
                                    id="waivers" 
                                    checked={selectedTypes.waivers}
                                    onCheckedChange={() => handleCheckboxChange("waivers")}
                                    className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 mt-0.5"
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor="waivers" className="text-sm font-semibold cursor-pointer">ছাড়/মওকুফ (Waivers)</label>
                                    <p className="text-xs text-gray-500">শিক্ষার্থীদের দেওয়া সকল ছাড়/মওকুফের তালিকা মুছে যাবে।</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <Checkbox 
                                    id="donations" 
                                    checked={selectedTypes.donations}
                                    onCheckedChange={() => handleCheckboxChange("donations")}
                                    className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 mt-0.5"
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor="donations" className="text-sm font-semibold cursor-pointer">দান/অনুদান (Donations)</label>
                                    <p className="text-xs text-gray-500">সকল প্রাপ্ত দান ও অনুদানের রেকর্ড মুছে যাবে।</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <Checkbox 
                                    id="expenses" 
                                    checked={selectedTypes.expenses}
                                    onCheckedChange={() => handleCheckboxChange("expenses")}
                                    className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 mt-0.5"
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor="expenses" className="text-sm font-semibold cursor-pointer">সাধারণ ব্যয় (General Expenses)</label>
                                    <p className="text-xs text-gray-500">মাদ্রাসার সকল সাধারণ ব্যয়ের রেকর্ড মুছে যাবে।</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Confirmation */}
                    <div className="space-y-3 pt-4 border-t border-gray-100">
                        <Label className="text-base font-semibold flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-red-500" /> ৩. সিকিউরিটি কনফার্মেশন
                        </Label>
                        <p className="text-sm text-gray-600 mb-2">
                            ডেটা ডিলিট নিশ্চিত করতে নিচের বক্সে <strong className="text-red-600 font-mono bg-red-50 px-1 rounded">Confirm</strong> টাইপ করুন।
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Input 
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Type Confirm here..."
                                className="max-w-[200px] border-red-200 focus-visible:ring-red-200"
                                disabled={!isAnySelected}
                            />
                            <Button 
                                onClick={handleReset}
                                disabled={!isAnySelected || !isValidConfirmation || isDeleting}
                                className="bg-red-600 hover:bg-red-700 text-white sm:w-auto w-full font-bold"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                ডেটা মুছে ফেলুন
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
