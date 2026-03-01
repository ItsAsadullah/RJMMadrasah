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

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const { data } = await supabase.from("transactions").select("*, categories(name)").order("transaction_date", { ascending: false });
    
    if (data) {
        let inc = 0, exp = 0, lil = 0;
        data.forEach((t: any) => {
            if(t.type === 'income') { inc += t.amount; if(t.fund_type === 'lillah') lil += t.amount; }
            else { exp += t.amount; if(t.fund_type === 'lillah') lil -= t.amount; }
        });
        setReportSummary({ income: inc, expense: exp, balance: inc - exp, lillah: lil });
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8 bg-gray-50 min-h-screen font-[Kalpurush]">
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          <StatCard title="মোট আয়" amount={reportSummary.income} icon={ArrowDownCircle} color="green" />
          <StatCard title="মোট ব্যয়" amount={reportSummary.expense} icon={ArrowUpCircle} color="red" />
          <StatCard title="বর্তমান স্থিতি" amount={reportSummary.balance} icon={DollarSign} color="blue" />
          <StatCard title="লিল্লাহ ফান্ড" amount={reportSummary.lillah} icon={PieChart} color="purple" />
      </div>

      <Tabs defaultValue="collection" className="w-full print:hidden">
        <TabsList className="grid w-full grid-cols-5 bg-white border h-14 mb-6 p-1 rounded-lg">
            <TabsTrigger value="collection" className="font-bold">ফি আদায়</TabsTrigger>
            <TabsTrigger value="donation" className="font-bold">দান গ্রহণ</TabsTrigger>
            <TabsTrigger value="setup" className="font-bold">ফি নির্ধারণ</TabsTrigger>
            <TabsTrigger value="expense" className="font-bold">ব্যয়</TabsTrigger>
            <TabsTrigger value="reports" className="font-bold">রিপোর্ট</TabsTrigger>
        </TabsList>

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
        <Card className={`border-l-4 ${border}`}>
            <CardContent className="p-4 flex justify-between items-center">
                <div><p className="text-xs font-bold text-gray-500 uppercase">{title}</p><h3 className={`text-2xl font-bold ${text}`}>৳ {toBengaliNumber(amount)}</h3></div>
                <div className={`p-2 rounded-full ${bg} ${iconColor}`}><Icon className="w-6 h-6"/></div>
            </CardContent>
        </Card>
    );
};