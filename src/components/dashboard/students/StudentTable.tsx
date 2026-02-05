"use client";

import { useState, useMemo } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"; 
import { 
  Search, Edit, Trash2, Download, Printer, ArrowUpDown, ChevronLeft, ChevronRight, Eye
} from "lucide-react";
import Link from "next/link";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Define Student Type (Needs to match your data)
type Student = {
  id: string;
  name_bn: string;
  student_id: string;
  roll_no: string;
  class_name: string;
  department: string;
  father_mobile: string;
  email?: string;
  status: string;
  created_at: string;
  branch_id: number;
  photo_url?: string;
};

type StudentTableProps = {
  data: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
};

export default function StudentTable({ data, onEdit, onDelete, onBulkDelete }: StudentTableProps) {
  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Student, direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Filter & Sort Logic
  const filteredData = useMemo(() => {
    let processed = [...data];

    // Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      processed = processed.filter(s => 
        s.name_bn?.toLowerCase().includes(lower) || 
        s.student_id?.toLowerCase().includes(lower) || 
        s.father_mobile?.includes(lower) ||
        s.email?.toLowerCase().includes(lower)
      );
    }

    // Sort
    if (sortConfig) {
      processed.sort((a, b) => {
        // @ts-ignore
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        // @ts-ignore
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return processed;
  }, [data, searchTerm, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Handlers
  const handleSort = (key: keyof Student) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(s => s.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedRows(newSelected);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["ID", "Name", "Class", "Mobile", "Status"];
    const tableRows: any[] = [];

    const exportData = selectedRows.size > 0 
      ? filteredData.filter(s => selectedRows.has(s.id))
      : filteredData;

    exportData.forEach(student => {
      const studentData = [
        student.student_id || "N/A",
        student.name_bn,
        student.class_name,
        student.father_mobile,
        student.status
      ];
      tableRows.push(studentData);
    });

    // @ts-ignore
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      styles: { font: "helvetica", fontSize: 10 }, 
    });
    doc.save("students_list.pdf");
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedRows.size} students?`)) {
      onBulkDelete(Array.from(selectedRows));
      setSelectedRows(new Set());
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 w-full md:w-1/3">
          <Search className="w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search students..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {selectedRows.size > 0 && (
            <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded text-red-600 animate-in fade-in">
              <span className="text-xs font-bold">{selectedRows.size} Selected</span>
              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleBulkDelete}>
                <Trash2 className="w-3 h-3 mr-1" /> Delete
              </Button>
            </div>
          )}
          
          <Button size="sm" variant="outline" onClick={exportPDF} title="Export PDF">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()} title="Print">
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox 
                  checked={paginatedData.length > 0 && selectedRows.size === paginatedData.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="cursor-pointer hover:text-green-600" onClick={() => handleSort('student_id')}>
                ID <ArrowUpDown className="w-3 h-3 inline ml-1" />
              </TableHead>
              <TableHead className="cursor-pointer hover:text-green-600" onClick={() => handleSort('name_bn')}>
                Name <ArrowUpDown className="w-3 h-3 inline ml-1" />
              </TableHead>
              <TableHead>Class & Roll</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                  No students found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((student) => (
                <TableRow key={student.id} className={selectedRows.has(student.id) ? "bg-blue-50" : ""}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedRows.has(student.id)}
                      onCheckedChange={() => toggleSelectRow(student.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono font-medium text-gray-600">{student.student_id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-100 overflow-hidden border">
                        {student.photo_url ? (
                          <img src={student.photo_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs font-bold text-gray-400">
                            {student.name_bn?.[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{student.name_bn}</p>
                        <p className="text-xs text-gray-500">{student.email || ""}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="badge bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">{student.class_name}</span>
                    <div className="text-xs text-gray-500 mt-1">Roll: {student.roll_no || "-"}</div>
                    {student.department && <div className="text-xs text-gray-400">{student.department}</div>}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{student.father_mobile}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {student.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/students/${student.id}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                            <Eye className="w-3 h-3 mr-1" /> প্রোফাইল
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onEdit(student)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(student.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-gray-500">
          Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} entries
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = i + 1;
                return (
                    <Button
                        key={p}
                        variant={currentPage === p ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(p)}
                    >
                        {p}
                    </Button>
                )
            })}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
