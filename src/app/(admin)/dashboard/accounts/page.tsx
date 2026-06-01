"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    LayoutDashboard, DollarSign, GraduationCap, Users,
    Wallet, Heart, ShieldOff, BarChart3, Trash2
} from "lucide-react";

import AccountsDashboard from "@/components/dashboard/accounts/AccountsDashboard";
import FeeSetup from "@/components/dashboard/accounts/FeeSetup";
import FeeCollection from "@/components/dashboard/accounts/FeeCollection";
import TeacherSalary from "@/components/dashboard/accounts/TeacherSalary";
import ExpenseManagement from "@/components/dashboard/accounts/ExpenseManagement";
import DonationCollection from "@/components/dashboard/accounts/DonationCollection";
import WaiverManagement from "@/components/dashboard/accounts/WaiverManagement";
import Reports from "@/components/dashboard/accounts/Reports";
import DataReset from "@/components/dashboard/accounts/DataReset";

const tabs = [
    { value: "dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
    { value: "setup", label: "ফি নির্ধারণ", icon: DollarSign },
    { value: "collection", label: "বেতন আদায়", icon: GraduationCap },
    { value: "teacher", label: "শিক্ষক বেতন", icon: Users },
    { value: "expense", label: "খরচ", icon: Wallet },
    { value: "donation", label: "দান-অনুদান", icon: Heart },
    { value: "waiver", label: "ছাড়/মওকুফ", icon: ShieldOff },
    { value: "reports", label: "রিপোর্ট", icon: BarChart3 },
    { value: "reset", label: "রিসেট", icon: Trash2 },
];

export default function AccountsPage() {
    const [activeTab, setActiveTab] = useState("dashboard");

    return (
        <div className="space-y-4 md:space-y-6 p-3 sm:p-4 md:p-8 bg-gray-50 min-h-screen font-[Kalpurush]">
            <div className="print:hidden">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">হিসাব ব্যবস্থাপনা</h1>
                <p className="text-xs sm:text-sm text-gray-500">ফি, বেতন, দান, ব্যয় ও আর্থিক রিপোর্ট এক জায়গায়</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full print:hidden">
                <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0 px-3 sm:px-4 md:px-0">
                    <TabsList className="flex w-max min-w-full bg-white border h-auto mb-4 sm:mb-6 p-0.5 sm:p-1 rounded-xl shadow-sm">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="font-bold whitespace-nowrap text-[10px] sm:text-sm px-2 sm:px-3.5 py-1.5 sm:py-2 gap-1 sm:gap-1.5 rounded-lg data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-sm transition-all"
                                >
                                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                                    {tab.label}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                </div>

                <TabsContent value="dashboard">
                    <AccountsDashboard />
                </TabsContent>

                <TabsContent value="setup">
                    <FeeSetup />
                </TabsContent>

                <TabsContent value="collection">
                    <FeeCollection />
                </TabsContent>

                <TabsContent value="teacher">
                    <TeacherSalary />
                </TabsContent>

                <TabsContent value="expense">
                    <ExpenseManagement />
                </TabsContent>

                <TabsContent value="donation">
                    <DonationCollection />
                </TabsContent>

                <TabsContent value="waiver">
                    <WaiverManagement />
                </TabsContent>

                <TabsContent value="reports">
                    <Reports />
                </TabsContent>

                <TabsContent value="reset">
                    <DataReset />
                </TabsContent>
            </Tabs>
        </div>
    );
}
