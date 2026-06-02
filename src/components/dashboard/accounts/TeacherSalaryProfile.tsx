import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useReactToPrint } from "react-to-print";
import TeacherSalaryReport from "./TeacherSalaryReport";

const bengaliMonths = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

export default function TeacherSalaryProfile({ 
    teacher, 
    year, 
    open, 
    onClose 
}: { 
    teacher: any, 
    year: number, 
    open: boolean, 
    onClose: () => void 
}) {
    const [loading, setLoading] = useState(true);
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const reportRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: reportRef,
        documentTitle: `Salary_Report_${teacher?.name}_${year}`,
        suppressErrors: true
    });

    useEffect(() => {
        if (open && teacher && year) {
            fetchYearlyData();
        }
    }, [open, teacher, year]);

    async function fetchYearlyData() {
        setLoading(true);
        const { data, error } = await supabase
            .from("teacher_salaries")
            .select("*")
            .eq("teacher_id", teacher.id)
            .eq("salary_year", year);

        if (error) {
            console.error("Error fetching yearly salary:", error);
            setLoading(false);
            return;
        }

        const salaries = data || [];
        const baseAmount = teacher.salary_amount || 0;

        // Construct 12 months data
        const yearData = bengaliMonths.map((monthName, index) => {
            // Find all payments for this specific month (1-12)
            const monthPayments = salaries.filter(s => s.salary_month === index + 1);
            
            const totalPaid = monthPayments.reduce((sum, p) => sum + p.net_amount, 0);
            // We use the base_amount from the first payment record of that month if it exists, otherwise teacher's base
            const monthBase = monthPayments.length > 0 && monthPayments[0].base_amount 
                ? monthPayments[0].base_amount 
                : baseAmount;

            const dueAmount = monthBase - totalPaid;
            
            let status = 'Unpaid';
            if (monthPayments.length > 0) {
                if (dueAmount <= 0) status = 'Paid';
                else status = 'Partial';
            } else if (monthBase > 0) {
                status = 'Due';
            }

            return {
                monthIndex: index + 1,
                monthName,
                baseAmount: monthBase,
                paidAmount: totalPaid,
                dueAmount: dueAmount > 0 ? dueAmount : 0,
                status,
                paymentDates: monthPayments.map(p => p.created_at),
                paymentMethods: monthPayments.map(p => p.payment_method)
            };
        });

        setMonthlyData(yearData);
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-[900px] w-[95vw] max-h-[90vh] flex flex-col overflow-hidden p-0 bg-gray-100">
                <div className="bg-white border-b p-4 flex justify-between items-center print:hidden shrink-0 z-10 shadow-sm">
                    <DialogTitle className="font-bold text-lg">শিক্ষক বেতন প্রোফাইল</DialogTitle>
                    <div className="flex gap-2">
                        <Button onClick={() => handlePrint()} className="bg-teal-600 hover:bg-teal-700">
                            <Printer className="w-4 h-4 mr-2"/> প্রিন্ট করুন
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-full ml-1">
                            <X className="w-5 h-5"/>
                        </Button>
                    </div>
                </div>

                <div className="p-4 sm:p-8 flex justify-center overflow-auto flex-1 bg-gray-100/50 custom-scrollbar relative">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                        </div>
                    ) : (
                        <TeacherSalaryReport 
                            ref={reportRef}
                            teacher={teacher}
                            year={year}
                            monthlyData={monthlyData}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
