'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getBranches, getClasses, getExams, getPromotionList, promoteStudents } from './actions';
import { PromotionStudent } from './utils';
import { Loader2, ArrowRight, Save, RotateCw, AlertTriangle, Printer, Download, History } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";

export default function PromotionPage() {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [targetClasses, setTargetClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [fromClass, setFromClass] = useState<string>('');
  const [toClass, setToClass] = useState<string>('');
  const [examId, setExamId] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('2026');
  const [targetYear, setTargetYear] = useState<string>('2027');
  
  const [students, setStudents] = useState<PromotionStudent[]>([]);
  const [promotedCount, setPromotedCount] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  // Initial Load: Branches
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await getBranches();
        setBranches(data || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadBranches();
  }, []);

  // When Branch or Year changes -> Fetch Classes and Exams
  useEffect(() => {
    const loadData = async () => {
      if (!selectedBranch) return;
      
      try {
        const cls = await getClasses(selectedBranch, parseInt(academicYear));
        setClasses(cls || []);
        
        const exms = await getExams(parseInt(academicYear), selectedBranch);
        setExams(exms || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadData();
  }, [selectedBranch, academicYear]);

  // Handle Automatic Session & Class Logic
  useEffect(() => {
    // 1. Auto set next year
    const nextYear = String(parseInt(academicYear) + 1);
    setTargetYear(nextYear);

    // 2. Load target classes
    if (selectedBranch) {
       getClasses(selectedBranch, parseInt(nextYear)).then(cls => {
          setTargetClasses(cls || []);
          // Try to guess next class if possible, otherwise reset
          if (fromClass && cls) {
             // Heuristic: If we have an ordered list, we could pick index + 1
             // For now, let's try to match by name or reset
             // Implementation: We don't have enough data to reliably auto-select 'To Class' 
             // without a defined order. We will reset it to force user selection 
             // or keep previous selection if valid.
             // But user asked for "System automatically loads...". 
             // Let's assume user manually selects 'To Class' for now as per image showing "Select Target Class"
             // But we can clear it to avoid confusion
             setToClass('');
          }
       });
    }
  }, [academicYear, selectedBranch, fromClass]);

  const handleLoadResults = async () => {
    if (!selectedBranch || !fromClass || !examId) {
      alert("Please select Branch, From Class and Exam");
      return;
    }
    setLoading(true);
    try {
      const list = await getPromotionList(fromClass, examId);
      setStudents(list);
      updatePromotedCount(list);
    } catch (error) {
      console.error(error);
      alert("Failed to load results");
    }
    setLoading(false);
  };

  const updatePromotedCount = (list: PromotionStudent[]) => {
    const count = list.filter(s => s.status === 'passed' || s.status === 'manual_passed').length;
    setPromotedCount(count);
  };

  const handleManualToggle = (studentId: string, checked: boolean) => {
    setStudents(prev => {
       const updated = prev.map(s => {
          if (s.id === studentId) {
             const newStatus: 'manual_passed' | 'failed' = checked ? 'manual_passed' : 'failed';
             return { ...s, status: newStatus, is_manual: checked, manual_reason: checked ? 'Admin Override' : undefined };
          }
          return s;
       });
       updatePromotedCount(updated);
       return updated;
    });
  };

  const handlePromote = async () => {
    if (!toClass) {
      alert("Please select To Class");
      return;
    }
    
    setProcessing(true);
    try {
      const result = await promoteStudents(students, toClass, parseInt(targetYear), fromClass, examId);
      if (result.success) {
        alert(result.message);
        setStudents([]); 
        setShowConfirm(false);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error(error);
      alert("Promotion failed");
    }
    setProcessing(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text("Rahima Jannat Madrasa", 105, 15, { align: "center" });
    doc.setFontSize(14);
    doc.text("Promotion List / Result Sheet", 105, 25, { align: "center" });
    
    // Info
    doc.setFontSize(10);
    const fromClassName = classes.find(c => c.id === fromClass)?.name || "";
    const toClassName = targetClasses.find(c => c.id === toClass)?.name || "";
    const examName = exams.find(e => e.id === examId)?.title || "";
    
    doc.text(`Branch: ${branches.find(b => String(b.id) === selectedBranch)?.name}`, 14, 35);
    doc.text(`Exam: ${examName}`, 14, 40);
    doc.text(`Class: ${fromClassName} (${academicYear})  ->  ${toClassName} (${targetYear})`, 14, 45);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 50);

    // Table
    const tableColumn = ["ID", "Name", "Old Roll", "Marks", "Failed Subjects", "Status", "New Roll"];
    const tableRows: any[] = [];

    students.forEach(student => {
      const studentData = [
        student.student_id,
        student.name_en,
        student.roll_no,
        student.total_marks,
        student.failed_subjects.join(', '),
        student.status === 'manual_passed' ? 'MANUAL PASS' : student.status.toUpperCase(),
        student.new_roll || '-'
      ];
      tableRows.push(studentData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 163, 74] } // Green-600
    });

    doc.save(`promotion_list_${fromClassName}_${academicYear}.pdf`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Student Promotion System</h1>
        <Link href="/dashboard/academic/promotion/history">
          <Button variant="outline" className="gap-2">
            <History className="w-4 h-4" />
            Promotion History
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Promotion Criteria</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-4">
          
          <div className="space-y-2">
            <Label>Branch</Label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map(b => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>From Year</Label>
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
              </SelectContent>
            </Select>
          </div>

           <div className="space-y-2">
            <Label>Target Year</Label>
            <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              {targetYear}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Exam</Label>
            <Select value={examId} onValueChange={setExamId} disabled={!selectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Select Exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>From Class</Label>
            <Select value={fromClass} onValueChange={setFromClass} disabled={!selectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>To Class</Label>
            <Select value={toClass} onValueChange={setToClass} disabled={!selectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Select Target Class" />
              </SelectTrigger>
              <SelectContent>
                {targetClasses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-1 md:col-span-6 flex justify-end gap-2">
             <Button onClick={handleLoadResults} disabled={loading || !selectedBranch || !fromClass || !examId} className="gap-2">
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
               Process Results
             </Button>
          </div>
        </CardContent>
      </Card>

      {students.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Result Preview ({promotedCount} Promoted / {students.length} Total)</CardTitle>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportPDF} title="Download Report">
                <Download className="w-4 h-4 mr-2" /> Download Report
              </Button>

              <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogTrigger asChild>
                  <Button disabled={processing || !toClass} className="bg-green-600 hover:bg-green-700 gap-2">
                    <Save className="w-4 h-4" />
                    Proceed to Promotion
                  </Button>
                </DialogTrigger>
                <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Promotion</DialogTitle>
                  <DialogDescription>
                    You are about to promote <strong>{promotedCount}</strong> students from 
                    <strong> {classes.find(c => c.id === fromClass)?.name} ({academicYear})</strong> to 
                    <strong> {targetClasses.find(c => c.id === toClass)?.name} ({targetYear})</strong>.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    This action will update student records permanently.
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
                  <Button onClick={handlePromote} disabled={processing} className="bg-green-600 hover:bg-green-700">
                    {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Confirm Promotion
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>

          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Select</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Current Roll</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead>Failed Subjects</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">New Roll</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} className={student.status === 'failed' ? 'bg-red-50' : (student.status === 'manual_passed' ? 'bg-yellow-50' : '')}>
                      <TableCell>
                        <Checkbox 
                          checked={student.status === 'passed' || student.status === 'manual_passed'}
                          disabled={student.status === 'passed'} // Passed students always checked
                          onCheckedChange={(checked) => handleManualToggle(student.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{student.student_id}</TableCell>
                      <TableCell>{student.name_en}</TableCell>
                      <TableCell>{student.roll_no}</TableCell>
                      <TableCell>{student.total_marks}</TableCell>
                      <TableCell className="text-red-500 text-xs">
                        {student.failed_subjects.join(', ')}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          student.status === 'passed' ? 'bg-green-100 text-green-800' : 
                          student.status === 'manual_passed' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {student.status === 'manual_passed' ? 'MANUAL PASS' : student.status.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg text-blue-600">
                        {student.new_roll || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
