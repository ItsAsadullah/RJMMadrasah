"use client";

import { useState, useEffect, useRef } from "react";
import { getPromotionLogs } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useReactToPrint } from "react-to-print";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function PromotionHistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [viewBranch, setViewBranch] = useState<string>("all");
  const [viewYear, setViewYear] = useState<string>("all");
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [printLogs, setPrintLogs] = useState<any[]>([]);

  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Promotion Report",
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
        .page-break {
          page-break-after: always;
        }
      }
    `
  });

  const triggerPrint = (logsToPrint: any[]) => {
    setPrintLogs(logsToPrint);
    // Wait for state update and render
    setTimeout(() => {
        handlePrint();
    }, 100);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await getPromotionLogs();
      setLogs(data || []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (viewYear !== "all" && String(log.academic_year) !== viewYear) return false;
    return true;
  });
  
  // Group logs by Year -> Branch -> Class for the consolidated report
  const generateConsolidatedReport = () => {
    // If specific logs are selected, filter only those
    if (selectedLogIds.length > 0) {
        return filteredLogs.filter(log => selectedLogIds.includes(log.id));
    }
    // Otherwise return all filtered logs
    return filteredLogs;
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
        setSelectedLogIds(filteredLogs.map(l => l.id));
    } else {
        setSelectedLogIds([]);
    }
  };

  const toggleSelectLog = (id: string, checked: boolean) => {
    if (checked) {
        setSelectedLogIds(prev => [...prev, id]);
    } else {
        setSelectedLogIds(prev => prev.filter(lid => lid !== id));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href="/dashboard/academic/promotion">
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Promotion History (প্রোমোশন হিস্টোরি)</h1>
        </div>
        
        <Button onClick={() => triggerPrint(generateConsolidatedReport())} className="bg-green-600 hover:bg-green-700 gap-2">
            <Printer className="w-4 h-4" /> 
            {selectedLogIds.length > 0 ? `নির্বাচিত রিপোর্ট প্রিন্ট করুন (${selectedLogIds.length})` : "সম্পূর্ণ রিপোর্ট প্রিন্ট করুন"}
        </Button>
      </div>

      <div className="flex gap-4 mb-4 items-center">
         <Select value={viewYear} onValueChange={setViewYear}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Year Filter" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
            </SelectContent>
         </Select>
         
         {selectedLogIds.length > 0 && (
             <span className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                 {selectedLogIds.length} টি ক্লাস নির্বাচিত
             </span>
         )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Promotion Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              No promotion history found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={filteredLogs.length > 0 && selectedLogIds.length === filteredLogs.length}
                        onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                      />
                  </TableHead>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>পূর্বের শ্রেণি</TableHead>
                  <TableHead>বর্তমান শ্রেণি</TableHead>
                  <TableHead>পরীক্ষা</TableHead>
                  <TableHead className="text-center">প্রোমোটেড / মোট</TableHead>
                  <TableHead className="text-right">পদক্ষেপ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className={selectedLogIds.includes(log.id) ? "bg-green-50" : ""}>
                    <TableCell>
                        <Checkbox 
                            checked={selectedLogIds.includes(log.id)}
                            onCheckedChange={(checked) => toggleSelectLog(log.id, !!checked)}
                        />
                    </TableCell>
                    <TableCell>{new Date(log.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{log.from_class?.name}</TableCell>
                    <TableCell className="font-medium text-green-600">{log.to_class?.name}</TableCell>
                    <TableCell>{log.exam?.title}</TableCell>
                    <TableCell className="text-center">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                        {log.promoted_count}
                      </span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-gray-600 text-xs font-bold">{log.total_students}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedLog(log)}>
                                    <Eye className="w-4 h-4 mr-1" /> বিস্তারিত
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>প্রোমোশন বিস্তারিত</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                        <div>
                                            <p className="text-xs text-gray-500">পূর্বের শ্রেণি</p>
                                            <p className="font-bold">{log.from_class?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">বর্তমান শ্রেণি</p>
                                            <p className="font-bold text-green-600">{log.to_class?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">তারিখ</p>
                                            <p className="font-bold">{new Date(log.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">সারসংক্ষেপ</p>
                                            <p className="font-bold">{log.promoted_count} উত্তীর্ণ, {log.failed_count} অকৃতকার্য</p>
                                        </div>
                                    </div>
                                    
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>আইডি</TableHead>
                                                <TableHead>নাম</TableHead>
                                                <TableHead>পুরাতন রোল</TableHead>
                                                <TableHead>নম্বর</TableHead>
                                                <TableHead>নতুন রোল</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(typeof log.data === 'string' ? JSON.parse(log.data) : log.data).map((s: any, idx: number) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{s.id}</TableCell>
                                                    <TableCell>{s.name_bn || '-'}</TableCell>
                                                    <TableCell>{s.old_roll}</TableCell>
                                                    <TableCell>{s.marks}</TableCell>
                                                    <TableCell className="font-bold text-green-600">{s.new_roll}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </DialogContent>
                        </Dialog>
                        
                        <Button variant="outline" size="sm" onClick={() => triggerPrint([log])}>
                          <Printer className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Hidden Print Component */}
      <div style={{ display: "none" }}>
        <div ref={componentRef} className="print-container p-8 bg-white text-black min-h-screen font-bengali w-[297mm]">
            <style jsx global>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                .print-container, .print-container * {
                  visibility: visible;
                }
                .print-container {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                }
              }
            `}</style>
            <div className="space-y-12">
                {printLogs.map((log, index) => (
                    <div key={index} className="break-inside-avoid">
                        {/* Header / Letterpad */}
                        <div className="flex flex-col items-center mb-8 border-b-2 border-green-600 pb-4">
                            <div className="w-32 mb-2">
                                <img src="/images/bismillah.svg" alt="Bismillah" className="w-full" />
                            </div>
                            <div className="flex items-center gap-4 mb-2">
                                <img src="/images/logo.png" alt="Logo" className="w-24 h-24 object-contain" />
                                <div className="text-center">
                                    <h1 className="text-3xl font-bold text-green-700">রহিমা জান্নাত মহিলা মাদ্রাসা</h1>
                                    <h2 className="text-lg font-semibold text-green-600">{log.from_class?.branch?.name}</h2>
                                    <p className="text-sm font-semibold mt-1">
                                         {log.from_class?.branch?.address || "ঠিকানা পাওয়া যায়নি"}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        মোবাইল: {log.from_class?.branch?.phone || "মোবাইল নম্বর নেই"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Class Info Header */}
                        <div className="flex justify-between items-end mb-4 bg-green-50 p-4 rounded border border-green-100">
                            <div>
                                <div className="flex gap-6 text-sm">
                                    <div>
                                        <span className="text-gray-500 block">পূর্বের শ্রেণি</span>
                                        <span className="font-bold text-lg">{log.from_class?.name}</span>
                                    </div>
                                    <div className="text-2xl text-gray-300">→</div>
                                    <div>
                                        <span className="text-gray-500 block">বর্তমান শ্রেণি</span>
                                        <span className="font-bold text-lg text-green-700">{log.to_class?.name}</span>
                                    </div>
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                    পরীক্ষা: <span className="font-semibold">{log.exam?.title}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm">
                                    <span className="text-gray-500">তারিখ:</span> {new Date(log.created_at).toLocaleDateString('bn-BD')}
                                </div>
                                <div className="mt-2 font-bold text-green-800">
                                    মোট উত্তীর্ণ: {log.promoted_count} / {log.total_students}
                                </div>
                            </div>
                        </div>

                        {/* Student Table */}
                        <table className="w-full text-sm border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-green-600 text-white print:bg-green-600 print:text-white">
                                    <th className="border border-green-700 p-2 text-center w-16">আইডি</th>
                                    <th className="border border-green-700 p-2 text-left">শিক্ষার্থীর নাম</th>
                                    <th className="border border-green-700 p-2 text-center w-20">পুরাতন রোল</th>
                                    <th className="border border-green-700 p-2 text-center w-20">প্রাপ্ত নম্বর</th>
                                    <th className="border border-green-700 p-2 text-center w-20">নতুন রোল</th>
                                    <th className="border border-green-700 p-2 text-center w-24">অবস্থা</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(typeof log.data === 'string' ? JSON.parse(log.data) : log.data).map((s: any, idx: number) => (
                                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                        <td className="border border-gray-300 p-2 text-center">{s.id}</td>
                                        <td className="border border-gray-300 p-2 font-medium">{s.name_bn || s.name_en || '-'}</td>
                                        <td className="border border-gray-300 p-2 text-center">{s.old_roll}</td>
                                        <td className="border border-gray-300 p-2 text-center">{s.marks}</td>
                                        <td className="border border-gray-300 p-2 text-center font-bold">{s.new_roll}</td>
                                        <td className="border border-gray-300 p-2 text-center">
                                            {s.is_manual ? 
                                                <span className="text-orange-600 font-semibold">মানুয়াল</span> : 
                                                <span className="text-green-600 font-semibold">উত্তীর্ণ</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {/* Footer Signature Area */}
                        <div className="mt-16 flex justify-between text-center px-8">
                            <div>
                                <div className="h-px w-40 bg-black mb-2"></div>
                                <p>শ্রেণি শিক্ষকের স্বাক্ষর</p>
                            </div>
                            <div>
                                <div className="h-px w-40 bg-black mb-2"></div>
                                <p>অধ্যক্ষের স্বাক্ষর</p>
                            </div>
                        </div>

                        {/* Page Break for Multiple Reports */}
                        {index < printLogs.length - 1 && (
                             <div className="page-break" style={{ pageBreakAfter: 'always' }}></div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}