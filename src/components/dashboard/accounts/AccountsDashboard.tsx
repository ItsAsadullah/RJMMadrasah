"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    ArrowDownCircle, ArrowUpCircle, DollarSign, PieChart,
    TrendingUp, TrendingDown, Users, Loader2, Clock, Building2
} from "lucide-react";
import { format } from "date-fns";

const toBengaliNumber = (num: any) => String(num).replace(/[0-9]/g, c => "০১২৩৪৫৬৭৮৯"[parseInt(c)]);

const getDueAmount = (due: any) => {
    const amount = Number(due?.amount) || 0;
    const fine = Number(due?.fine) || 0;
    const waiver = Number(due?.waiver) || 0;
    const calculatedNet = Math.max(amount + fine - waiver, 0);
    const storedNet = due?.net_amount == null ? null : Number(due.net_amount);
    const net = storedNet !== null && (storedNet > 0 || calculatedNet === 0) ? storedNet : calculatedNet;
    return Math.max(net - (Number(due?.paid_amount) || 0), 0);
};

export default function AccountsDashboard() {
    const [loading, setLoading] = useState(true);
    const [branches, setBranches] = useState<any[]>([]);
    const [filterBranch, setFilterBranch] = useState("all");
    const [stats, setStats] = useState({
        totalIncome: 0, totalExpense: 0, balance: 0,
        lillahFund: 0, totalDue: 0, dueStudents: 0,
        teachersPaid: 0, teachersTotal: 0
    });
    const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
    const [monthlyData, setMonthlyData] = useState<{ month: string; income: number; expense: number }[]>([]);

    async function fetchDashboardData() {
        setLoading(true);
        try {
            // Fetch branches
            const { data: b } = await supabase.from("branches").select("id, name");
            if (b) setBranches(b);

            // Fetch all transactions
            let txQuery = supabase
                .from("transactions")
                .select("*, categories(name)")
                .order("transaction_date", { ascending: false });
            
            if (filterBranch !== "all") {
                txQuery = txQuery.eq("branch_id", parseInt(filterBranch));
            }
            const { data: txData } = await txQuery;

            // Fetch student dues summary
            let dueQuery = supabase
                .from("student_dues")
                .select("student_id, amount, waiver, fine, net_amount, paid_amount, status, students!inner(branch_id)")
                .not("status", "in", '("paid","waived")');
            if (filterBranch !== "all") {
                dueQuery = dueQuery.eq("students.branch_id", parseInt(filterBranch));
            }
            const { data: dueData } = await dueQuery;

            // Fetch teachers count
            let teacherQuery = supabase
                .from("teachers")
                .select("id");
            if (filterBranch !== "all") {
                teacherQuery = teacherQuery.eq("branch_id", parseInt(filterBranch));
            }
            const { data: teacherData } = await teacherQuery;

            // Fetch teacher salary payments this month
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            let teachersPaidCount = 0;
            try {
                let salaryQuery = supabase
                    .from("teacher_salaries")
                    .select("teacher_id")
                    .eq("salary_month", currentMonth)
                    .eq("salary_year", currentYear);
                
                if (filterBranch !== "all" && teacherData) {
                    const validTeacherIds = teacherData.map(t => t.id);
                    if (validTeacherIds.length > 0) {
                        salaryQuery = salaryQuery.in("teacher_id", validTeacherIds);
                    } else {
                        // if no teachers in this branch, no salaries paid
                        salaryQuery = salaryQuery.eq("id", -1);
                    }
                }
                const { data: salaryData } = await salaryQuery;
                teachersPaidCount = salaryData?.length || 0;
            } catch { /* table may not exist yet */ }

            if (txData) {
                let inc = 0, exp = 0, lil = 0;
                const monthMap: Record<string, { income: number; expense: number }> = {};

                txData.forEach((t: any) => {
                    if (t.type === 'income') {
                        inc += t.amount;
                        if (t.fund_type === 'lillah') lil += t.amount;
                    } else {
                        exp += t.amount;
                        if (t.fund_type === 'lillah') lil -= t.amount;
                    }

                    // Monthly aggregation (last 6 months)
                    const txDate = new Date(t.transaction_date);
                    const monthKey = format(txDate, 'yyyy-MM');
                    if (!monthMap[monthKey]) monthMap[monthKey] = { income: 0, expense: 0 };
                    if (t.type === 'income') monthMap[monthKey].income += t.amount;
                    else monthMap[monthKey].expense += t.amount;
                });

                // Build monthly data (last 6 months)
                const months: { month: string; income: number; expense: number }[] = [];
                const bengaliMonthNames = ["জানু", "ফেব্রু", "মার্চ", "এপ্রি", "মে", "জুন", "জুলা", "আগ", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];
                for (let i = 5; i >= 0; i--) {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    const key = format(d, 'yyyy-MM');
                    months.push({
                        month: bengaliMonthNames[d.getMonth()],
                        income: monthMap[key]?.income || 0,
                        expense: monthMap[key]?.expense || 0
                    });
                }
                setMonthlyData(months);

                // Due calculation
                let totalDueAmount = 0;
                const dueStudentSet = new Set<string>();
                if (dueData) {
                    dueData.forEach((d: any) => {
                        const due = getDueAmount(d);
                        if (due > 0) {
                            totalDueAmount += due;
                            dueStudentSet.add(d.student_id);
                        }
                    });
                }

                setStats({
                    totalIncome: inc,
                    totalExpense: exp,
                    balance: inc - exp,
                    lillahFund: lil,
                    totalDue: totalDueAmount,
                    dueStudents: dueStudentSet.size,
                    teachersPaid: teachersPaidCount,
                    teachersTotal: teacherData?.length || 0
                });

                setRecentTransactions(txData.slice(0, 10));
            }
        } catch (err) {
            console.error("Dashboard fetch error:", err);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchDashboardData();
    }, [filterBranch]);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin w-8 h-8 text-green-600" />
            </div>
        );
    }

    const maxChartValue = Math.max(
        ...monthlyData.map(m => Math.max(m.income, m.expense)), 1
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-indigo-600" /> অ্যাকাউন্টস ওভারভিউ
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">মাদ্রাসার সার্বিক আর্থিক অবস্থার সারাংশ</p>
                </div>
                <div className="w-full md:w-64">
                    <Select value={filterBranch} onValueChange={setFilterBranch}>
                        <SelectTrigger className="bg-gray-50 border-gray-200 h-10 shadow-sm">
                            <div className="flex items-center gap-2 text-gray-700">
                                <Building2 className="w-4 h-4 text-indigo-500" />
                                <span><SelectValue placeholder="মাদ্রাসা নির্বাচন করুন" /></span>
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-medium text-indigo-700">সকল মাদ্রাসা</SelectItem>
                            {branches.map(b => (
                                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                <StatCard title="মোট আয়" amount={stats.totalIncome} icon={ArrowDownCircle} color="green" />
                <StatCard title="মোট ব্যয়" amount={stats.totalExpense} icon={ArrowUpCircle} color="red" />
                <StatCard title="বর্তমান স্থিতি" amount={stats.balance} icon={DollarSign} color="blue" />
                <StatCard title="লিল্লাহ ফান্ড" amount={stats.lillahFund} icon={PieChart} color="purple" />
            </div>

            {/* Second Row Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 py-0 gap-0 rounded-2xl shadow-sm">
                    <CardContent className="p-3 sm:p-4">
                        <p className="text-[10px] sm:text-xs font-bold text-amber-600 mb-1">মোট বকেয়া</p>
                        <h3 className="text-base sm:text-xl font-bold text-amber-700">৳ {toBengaliNumber(stats.totalDue)}</h3>
                        <p className="text-[10px] sm:text-xs text-amber-500 mt-1">{toBengaliNumber(stats.dueStudents)} জন শিক্ষার্থীর</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200 py-0 gap-0 rounded-2xl shadow-sm">
                    <CardContent className="p-3 sm:p-4">
                        <p className="text-[10px] sm:text-xs font-bold text-teal-600 mb-1">শিক্ষক বেতন (এই মাস)</p>
                        <h3 className="text-base sm:text-xl font-bold text-teal-700">
                            {toBengaliNumber(stats.teachersPaid)}/{toBengaliNumber(stats.teachersTotal)}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-teal-500 mt-1">জন পেয়েছে</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200 py-0 gap-0 rounded-2xl shadow-sm col-span-2 lg:col-span-1">
                    <CardContent className="p-3 sm:p-4">
                        <p className="text-[10px] sm:text-xs font-bold text-indigo-600 mb-1">নেট ক্যাশ ফ্লো</p>
                        <div className="flex items-center gap-2">
                            {stats.balance >= 0 ? (
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            ) : (
                                <TrendingDown className="w-5 h-5 text-red-600" />
                            )}
                            <h3 className={`text-base sm:text-xl font-bold ${stats.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                ৳ {toBengaliNumber(Math.abs(stats.balance))}
                            </h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Chart */}
            <Card className="rounded-2xl shadow-sm">
                <CardContent className="p-4 sm:p-6">
                    <h3 className="font-bold text-gray-800 mb-4 text-sm sm:text-base">সাম্প্রতিক ৬ মাসের আয়-ব্যয়</h3>
                    <div className="flex items-end gap-1.5 sm:gap-3 h-36 sm:h-48">
                        {monthlyData.map((m, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="flex gap-0.5 sm:gap-1 items-end w-full h-28 sm:h-40">
                                    {/* Income Bar */}
                                    <div className="flex-1 flex flex-col justify-end">
                                        <div
                                            className="bg-gradient-to-t from-green-500 to-green-400 rounded-t-sm sm:rounded-t-md w-full transition-all duration-500 min-h-[2px]"
                                            style={{ height: `${Math.max((m.income / maxChartValue) * 100, 2)}%` }}
                                            title={`আয়: ৳${m.income}`}
                                        />
                                    </div>
                                    {/* Expense Bar */}
                                    <div className="flex-1 flex flex-col justify-end">
                                        <div
                                            className="bg-gradient-to-t from-red-500 to-red-400 rounded-t-sm sm:rounded-t-md w-full transition-all duration-500 min-h-[2px]"
                                            style={{ height: `${Math.max((m.expense / maxChartValue) * 100, 2)}%` }}
                                            title={`ব্যয়: ৳${m.expense}`}
                                        />
                                    </div>
                                </div>
                                <span className="text-[9px] sm:text-[11px] text-gray-500 font-medium">{m.month}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-4 mt-3 justify-center">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-green-500" />
                            <span className="text-[10px] sm:text-xs text-gray-600">আয়</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-red-500" />
                            <span className="text-[10px] sm:text-xs text-gray-600">ব্যয়</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="rounded-2xl shadow-sm">
                <CardContent className="p-4 sm:p-6">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm sm:text-base">
                        <Clock className="w-4 h-4 text-gray-500" /> সাম্প্রতিক লেনদেন
                    </h3>
                    <div className="space-y-2">
                        {recentTransactions.length === 0 ? (
                            <p className="text-center py-8 text-gray-400 text-sm">কোনো লেনদেন পাওয়া যায়নি</p>
                        ) : (
                            recentTransactions.map((t: any) => (
                                <div key={t.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {t.type === 'income' ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                {t.description || t.categories?.name || (t.type === 'income' ? 'আয়' : 'ব্যয়')}
                                            </p>
                                            <p className="text-[10px] sm:text-xs text-gray-400">
                                                {format(new Date(t.transaction_date), 'dd MMM yyyy')}
                                                {t.fund_type === 'lillah' && (
                                                    <Badge className="ml-2 bg-purple-50 text-purple-600 border-purple-200 text-[9px] py-0">লিল্লাহ</Badge>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold shrink-0 ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.type === 'income' ? '+' : '-'}৳ {toBengaliNumber(t.amount)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// --- Helper ---
const StatCard = ({ title, amount, icon: Icon, color }: any) => {
    const colorMap: Record<string, { border: string; text: string; bg: string; icon: string }> = {
        green: { border: "border-green-600", text: "text-green-700", bg: "bg-green-50", icon: "text-green-600" },
        red: { border: "border-red-600", text: "text-red-700", bg: "bg-red-50", icon: "text-red-600" },
        blue: { border: "border-blue-600", text: "text-blue-700", bg: "bg-blue-50", icon: "text-blue-600" },
        purple: { border: "border-purple-600", text: "text-purple-700", bg: "bg-purple-50", icon: "text-purple-600" },
    };
    const c = colorMap[color] || colorMap.blue;
    return (
        <Card className={`border-l-[3px] sm:border-l-4 ${c.border} py-0 gap-0 rounded-2xl shadow-sm`}>
            <CardContent className="p-2.5 sm:p-3 flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                    <p className="text-[9px] sm:text-[11px] leading-tight font-bold text-gray-500">{title}</p>
                    <h3 className={`text-sm sm:text-2xl leading-none font-bold ${c.text}`}>৳ {toBengaliNumber(amount)}</h3>
                </div>
                <div className={`shrink-0 p-1 sm:p-1.5 rounded-full ${c.bg} ${c.icon}`}>
                    <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
            </CardContent>
        </Card>
    );
};
