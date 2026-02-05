"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, Eye, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type LeaveApplication = {
  id: string;
  student_id: string;
  from_date: string;
  to_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_remark: string;
  created_at: string;
  student?: {
    name_en: string;
    name_bn: string;
    roll_no: string;
    class_name: string;
    branch_id: number;
    branches?: { name: string };
  };
};

export default function LeaveManagementPage() {
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  
  // Modal State
  const [selectedLeave, setSelectedLeave] = useState<LeaveApplication | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [remark, setRemark] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    fetchBranches();
    fetchLeaves();
  }, [filterStatus]);

  const fetchBranches = async () => {
    const { data } = await supabase.from("branches").select("id, name");
    if (data) setBranches(data);
  };

  const fetchLeaves = async () => {
    setLoading(true);
    let query = supabase
      .from("leave_applications")
      .select(`
        *,
        student:students (
          name_en,
          name_bn,
          roll_no,
          class_name,
          branch_id
        )
      `)
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching leaves:", error);
    } else {
      setLeaves(data || []);
    }
    setLoading(false);
  };

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (!selectedLeave) return;
    setActionLoading(true);

    const { error } = await supabase
      .from("leave_applications")
      .update({ 
        status: status,
        admin_remark: remark
      })
      .eq("id", selectedLeave.id);

    if (error) {
      alert("আপডেট করতে সমস্যা হয়েছে!");
    } else {
      setIsViewOpen(false);
      fetchLeaves();
      setRemark("");
    }
    setActionLoading(false);
  };

  const openView = (leave: LeaveApplication) => {
    setSelectedLeave(leave);
    setRemark(leave.admin_remark || "");
    setIsViewOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <Badge className="bg-green-600">অনুমোদিত</Badge>;
      case 'rejected': return <Badge className="bg-red-600">বাতিল</Badge>;
      default: return <Badge className="bg-yellow-500 text-black">অপেক্ষমান</Badge>;
    }
  };

  const calculateDays = (from: string, to: string) => {
    const start = new Date(from);
    const end = new Date(to);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
    return diffDays;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-purple-600" /> ছুটি ব্যবস্থাপনা
            </h1>
            <p className="text-sm text-gray-500">শিক্ষার্থীদের ছুটির আবেদন পর্যালোচনা ও অনুমোদন</p>
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="স্ট্যাটাস ফিল্টার" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল আবেদন</SelectItem>
            <SelectItem value="pending">অপেক্ষমান (Pending)</SelectItem>
            <SelectItem value="approved">অনুমোদিত (Approved)</SelectItem>
            <SelectItem value="rejected">বাতিল (Rejected)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>শিক্ষার্থী</TableHead>
              <TableHead>শ্রেণি ও রোল</TableHead>
              <TableHead>তারিখ</TableHead>
              <TableHead>কারণ</TableHead>
              <TableHead>স্ট্যাটাস</TableHead>
              <TableHead className="text-right">পদক্ষেপ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-purple-600"/></TableCell></TableRow>
            ) : leaves.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-gray-400">কোনো আবেদন পাওয়া যায়নি</TableCell></TableRow>
            ) : (
              leaves.map((leave) => (
                <TableRow key={leave.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <p className="font-bold text-gray-800">{leave.student?.name_bn || leave.student?.name_en || "অজানা"}</p>
                      <p className="text-xs text-gray-500">{branches.find(b => b.id === leave.student?.branch_id)?.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-semibold">{leave.student?.class_name}</span>
                      <span className="text-gray-400 mx-1">|</span>
                      <span>রোল: {leave.student?.roll_no}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{format(new Date(leave.from_date), "dd MMM")} - {format(new Date(leave.to_date), "dd MMM, yyyy")}</p>
                      <p className="text-xs text-gray-500">{calculateDays(leave.from_date, leave.to_date)} দিন</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={leave.reason}>
                    {leave.reason}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(leave.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openView(leave)} className="text-blue-600 hover:bg-blue-50">
                      <Eye className="w-4 h-4 mr-1" /> দেখুন
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View/Action Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>আবেদনের বিস্তারিত</DialogTitle>
          </DialogHeader>
          
          {selectedLeave && (
            <div className="space-y-4 mt-2">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-white p-2 rounded-full border">
                   <User className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                   <h3 className="font-bold text-lg">{selectedLeave.student?.name_bn || selectedLeave.student?.name_en}</h3>
                   <p className="text-sm text-gray-600">
                     {selectedLeave.student?.class_name}, রোল: {selectedLeave.student?.roll_no}
                   </p>
                   <p className="text-xs text-gray-500 mt-1">{branches.find(b => b.id === selectedLeave.student?.branch_id)?.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                   <p className="text-xs text-gray-500 mb-1">ছুটি শুরু</p>
                   <p className="font-bold">{format(new Date(selectedLeave.from_date), "dd MMM, yyyy")}</p>
                </div>
                <div className="p-3 border rounded-lg">
                   <p className="text-xs text-gray-500 mb-1">ছুটি শেষ</p>
                   <p className="font-bold">{format(new Date(selectedLeave.to_date), "dd MMM, yyyy")}</p>
                </div>
              </div>

              <div className="p-3 border rounded-lg bg-gray-50">
                 <p className="text-xs text-gray-500 mb-2 font-bold uppercase">ছুটির কারণ</p>
                 <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedLeave.reason}</p>
              </div>

              {/* Admin Action Section */}
              <div className="border-t pt-4 mt-2 space-y-3">
                 <div className="space-y-1">
                    <label className="text-sm font-medium">অ্যাডমিনের মন্তব্য (অপশনাল)</label>
                    <Textarea 
                      value={remark} 
                      onChange={(e) => setRemark(e.target.value)} 
                      placeholder="মন্তব্য লিখুন..."
                      className="h-20"
                    />
                 </div>

                 <div className="flex gap-3 pt-2">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700" 
                      onClick={() => handleAction('approved')}
                      disabled={actionLoading || selectedLeave.status === 'approved'}
                    >
                      {actionLoading ? <Loader2 className="animate-spin w-4 h-4"/> : <><CheckCircle className="w-4 h-4 mr-2"/> অনুমোদন করুন</>}
                    </Button>
                    <Button 
                      className="flex-1 bg-red-600 hover:bg-red-700" 
                      variant="destructive"
                      onClick={() => handleAction('rejected')}
                      disabled={actionLoading || selectedLeave.status === 'rejected'}
                    >
                      {actionLoading ? <Loader2 className="animate-spin w-4 h-4"/> : <><XCircle className="w-4 h-4 mr-2"/> বাতিল করুন</>}
                    </Button>
                 </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
