"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownCircle, ArrowUpCircle, DollarSign, PieChart } from "lucide-react";

import FeeSetup from "@/components/dashboard/accounts/FeeSetup";
import FeeCollection from "@/components/dashboard/accounts/FeeCollection";
import ExpenseManagement from "@/components/dashboard/accounts/ExpenseManagement";
import DonationCollection from "@/components/dashboard/accounts/DonationCollection";
import Reports from "@/components/dashboard/accounts/Reports";

const toBengaliNumber = (num: any) => String(num).replace(/[0-9]/g, c => "০১২৩৪৫৬৭৮৯"[parseInt(c)]);

export default function AccountsPage() {
    const [reportSummary, setReportSummary] = useState({ income: 0, expense: 0, balance: 0, lillah: 0 });

    async function fetchTransactions() {
      const { data } = await supabase.from("transactions").select("*, categories(name)").order("transaction_date", { ascending: false });
      
      if (data) {
          let inc = 0, exp = 0, lil = 0;
          data.forEach((t: any) => {
              if(t.type === 'income') { inc += t.amount; if(t.fund_type === 'lillah') lil += t.amount; }
              else { exp += t.amount; if(t.fund_type === 'lillah') lil -= t.amount; }
          });
          setReportSummary({ income: inc, expense: exp, balance: inc - exp, lillah: lil });
      }
    }

    useEffect(() => {
      fetchTransactions();
    }, []);

    return (
      <div className="space-y-4 md:space-y-6 p-3 sm:p-4 md:p-8 bg-gray-50 min-h-screen font-[Kalpurush]">
                <div className="print:hidden">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900">বেতন ও ফিস</h1>
                    <p className="text-xs sm:text-sm text-gray-500">ফি আদায়, দান, ব্যয় ও রিপোর্ট এক জায়গায় দেখুন</p>
                </div>
        
        {/* Top Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 print:hidden">
            <StatCard title="মোট আয়" amount={reportSummary.income} icon={ArrowDownCircle} color="green" />
            <StatCard title="মোট ব্যয়" amount={reportSummary.expense} icon={ArrowUpCircle} color="red" />
            <StatCard title="বর্তমান স্থিতি" amount={reportSummary.balance} icon={DollarSign} color="blue" />
            <StatCard title="লিল্লাহ ফান্ড" amount={reportSummary.lillah} icon={PieChart} color="purple" />
        </div>

        <Tabs defaultValue="collection" className="w-full print:hidden">
                    <div className="overflow-x-auto">
                        <TabsList className="flex w-max min-w-full bg-white border h-auto mb-4 sm:mb-6 p-0.5 sm:p-1 rounded-lg">
                                <TabsTrigger value="collection" className="font-bold whitespace-nowrap text-[11px] sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2">ফি আদায়</TabsTrigger>
                                <TabsTrigger value="donation" className="font-bold whitespace-nowrap text-[11px] sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2">দান গ্রহণ</TabsTrigger>
                                <TabsTrigger value="setup" className="font-bold whitespace-nowrap text-[11px] sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2">ফি নির্ধারণ</TabsTrigger>
                                <TabsTrigger value="expense" className="font-bold whitespace-nowrap text-[11px] sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2">ব্যয়</TabsTrigger>
                                <TabsTrigger value="reports" className="font-bold whitespace-nowrap text-[11px] sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2">রিপোর্ট</TabsTrigger>
                        </TabsList>
                    </div>

          <TabsContent value="collection">
              <FeeCollection />
          </TabsContent>

          <TabsContent value="donation">
              <DonationCollection />
          </TabsContent>

          <TabsContent value="setup">
              <FeeSetup />
          </TabsContent>

          <TabsContent value="expense">
              <ExpenseManagement />
          </TabsContent>

          <TabsContent value="reports">
              <Reports />
          </TabsContent>
        </Tabs>
      </div>
    );
}

// --- Helper Components ---
const StatCard = ({ title, amount, icon: Icon, color }: any) => {
    const colorMap: Record<string, string> = {
        green: "border-green-600 text-green-700 bg-green-50 text-green-600",
        red: "border-red-600 text-red-700 bg-red-50 text-red-600",
        blue: "border-blue-600 text-blue-700 bg-blue-50 text-blue-600",
        purple: "border-purple-600 text-purple-700 bg-purple-50 text-purple-600",
    };
    const [border, text, bg, iconColor] = (colorMap[color] || colorMap.blue).split(" ");
    return (
        <Card className={`border-l-[3px] sm:border-l-4 ${border} py-0 gap-0 rounded-2xl shadow-sm`}>
            <CardContent className="p-2.5 sm:p-3 flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                    <p className="text-[9px] sm:text-[11px] leading-tight font-bold text-gray-500">{title}</p>
                    <h3 className={`text-sm sm:text-2xl leading-none font-bold ${text}`}>৳ {toBengaliNumber(amount)}</h3>
                </div>
                <div className={`shrink-0 p-1 sm:p-1.5 rounded-full ${bg} ${iconColor}`}><Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5"/></div>
            </CardContent>
        </Card>
    );
};
