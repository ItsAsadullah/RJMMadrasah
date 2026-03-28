"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"; 
import { 
  Search, Edit, Trash2, Download, Printer, ArrowUpDown, ChevronLeft, ChevronRight, Eye, Columns3
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

// Define Student Type (Needs to match your data)
type Student = {
  id: string;
  name_bn: string;
  student_id: string;
  roll_number?: string;
  roll_no?: string;
  class_name: string;
  department: string;
  father_mobile: string;
  guardian_name?: string;
  guardian_mobile?: string;
  email?: string;
  status: string;
  created_at: string;
  branch_id: number;
  photo_url?: string;
  present_village?: string;
  present_union?: string;
  present_upazila?: string;
  present_district?: string;
  branches?: { name: string };
};

type StudentTableProps = {
  data: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
};

export default function StudentTable({ data, onEdit, onDelete, onBulkDelete }: StudentTableProps) {
  type ExtraColumns = {
    guardianName: boolean;
    guardianMobile: boolean;
    address: boolean;
  };

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Student, direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showExtraColumnOptions, setShowExtraColumnOptions] = useState(false);
  const [printSchoolName, setPrintSchoolName] = useState("রহিমা জান্নাত মহিলা মাদ্রাসা");
  const [printLongLogoUrl, setPrintLongLogoUrl] = useState("/images/long_logo.svg");
  const [extraColumns, setExtraColumns] = useState<ExtraColumns>({
    guardianName: true,
    guardianMobile: true,
    address: true,
  });

  const visibleExtraColumnCount = Object.values(extraColumns).filter(Boolean).length;

  useEffect(() => {
    supabase
      .from("footer_settings")
      .select("school_name")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data?.school_name) setPrintSchoolName(data.school_name);
      });

    supabase
      .from("branding_settings")
      .select("long_logo_url, logo_url")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data?.long_logo_url) {
          setPrintLongLogoUrl(data.long_logo_url);
          return;
        }
        if (data?.logo_url) setPrintLongLogoUrl(data.logo_url);
      });
  }, []);

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

  const printTable = (documentTitle = "Students Print") => {
    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const resolveLogoUrl = (logoUrl: string) => {
      if (!logoUrl) return "";
      if (
        logoUrl.startsWith("http://") ||
        logoUrl.startsWith("https://") ||
        logoUrl.startsWith("data:") ||
        logoUrl.startsWith("blob:")
      ) {
        return logoUrl;
      }
      if (logoUrl.startsWith("//")) {
        return `${window.location.protocol}${logoUrl}`;
      }
      return `${window.location.origin}${logoUrl.startsWith("/") ? "" : "/"}${logoUrl}`;
    };

    const resolvedLongLogoUrl = resolveLogoUrl(printLongLogoUrl);

    const printData = selectedRows.size > 0
      ? filteredData.filter(s => selectedRows.has(s.id))
      : filteredData;

    const headers = [
      "ID",
      "Name",
      "Class & Roll",
      "Dept",
      "Branch",
      "Contact",
      ...(extraColumns.guardianName ? ["Guardian Name"] : []),
      ...(extraColumns.guardianMobile ? ["Guardian Mobile"] : []),
      ...(extraColumns.address ? ["Address"] : []),
      "Status",
    ];

    const rows = printData.map(student => {
      const address = [
        student.present_village,
        student.present_union,
        student.present_upazila,
        student.present_district,
      ].filter(Boolean).join(", ");

      return [
        student.student_id || "N/A",
        student.name_bn || "-",
        `${student.class_name || "-"} (${student.roll_number || student.roll_no || '-'})`,
        student.department || "-",
        student.branches?.name || "-",
        student.father_mobile || "-",
        ...(extraColumns.guardianName ? [student.guardian_name || "-"] : []),
        ...(extraColumns.guardianMobile ? [student.guardian_mobile || "-"] : []),
        ...(extraColumns.address ? [address || "-"] : []),
        student.status || "-",
      ];
    });

    const html = `
      <html>
        <head>
          <title>${escapeHtml(documentTitle)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .print-pad { display: flex; flex-direction: column; align-items: center; justify-content: center; border-bottom: 2px solid #16a34a; margin-bottom: 14px; padding-bottom: 10px; }
            .print-pad img { width: 420px; max-width: 95%; height: auto; object-fit: contain; }
            .print-pad h1 { margin: 0; font-size: 20px; color: #166534; line-height: 1.2; }
            .print-pad p { margin: 2px 0 0; font-size: 12px; color: #4b5563; }
            .meta { margin: 8px 0 12px; font-size: 12px; color: #4b5563; text-align: right; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <div class="print-pad">
            ${resolvedLongLogoUrl ? `<img src="${escapeHtml(resolvedLongLogoUrl)}" alt="${escapeHtml(printSchoolName)}" />` : `<h1>${escapeHtml(printSchoolName)}</h1>`}
            <p>শিক্ষার্থী তথ্য তালিকা</p>
          </div>
          <div class="meta">প্রিন্ট তারিখ: ${new Date().toLocaleDateString("bn-BD")}</div>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(String(c ?? "-"))}</td>`).join("")}</tr>`).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();

    const images = Array.from(printWindow.document.images);
    const finalizePrint = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };

    if (images.length === 0) {
      setTimeout(finalizePrint, 100);
      return;
    }

    let loadedCount = 0;
    const onDone = () => {
      loadedCount += 1;
      if (loadedCount >= images.length) {
        setTimeout(finalizePrint, 120);
      }
    };

    images.forEach((img) => {
      if (img.complete) {
        onDone();
      } else {
        img.addEventListener("load", onDone, { once: true });
        img.addEventListener("error", onDone, { once: true });
      }
    });
  };

  const exportPDF = () => {
    printTable("students_list");
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
        
        <div className="flex items-center gap-2 relative">
          <Button
            size="sm"
            variant={visibleExtraColumnCount > 0 ? "default" : "outline"}
            onClick={() => setShowExtraColumnOptions(prev => !prev)}
            title="Select extra columns"
          >
            <Columns3 className="w-4 h-4 mr-2" /> Extra Columns
          </Button>
          {showExtraColumnOptions && (
            <div className="absolute top-11 left-0 z-20 w-52 rounded-md border bg-white p-3 shadow-lg space-y-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={extraColumns.guardianName}
                  onCheckedChange={(checked) => setExtraColumns(prev => ({ ...prev, guardianName: checked === true }))}
                />
                <span>অভিভাবকের নাম</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={extraColumns.guardianMobile}
                  onCheckedChange={(checked) => setExtraColumns(prev => ({ ...prev, guardianMobile: checked === true }))}
                />
                <span>অভিভাবকের মোবাইল</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={extraColumns.address}
                  onCheckedChange={(checked) => setExtraColumns(prev => ({ ...prev, address: checked === true }))}
                />
                <span>ঠিকানা</span>
              </label>
            </div>
          )}
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
          <Button size="sm" variant="outline" onClick={printTable} title="Print">
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox 
                  checked={paginatedData.length > 0 && selectedRows.size === paginatedData.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="cursor-pointer hover:text-green-600" onClick={() => handleSort('student_id')}>
                আইডি <ArrowUpDown className="w-3 h-3 inline ml-1" />
              </TableHead>
              <TableHead className="cursor-pointer hover:text-green-600" onClick={() => handleSort('name_bn')}>
                নাম <ArrowUpDown className="w-3 h-3 inline ml-1" />
              </TableHead>
              <TableHead>শ্রেণি ও রোল</TableHead>
              <TableHead>বিভাগ</TableHead>
              <TableHead>শাখা</TableHead>
              <TableHead>যোগাযোগ</TableHead>
              {extraColumns.guardianName && <TableHead>অভিভাবকের নাম</TableHead>}
              {extraColumns.guardianMobile && <TableHead>অভিভাবকের মোবাইল</TableHead>}
              {extraColumns.address && <TableHead>ঠিকানা</TableHead>}
              <TableHead>স্ট্যাটাস</TableHead>
              <TableHead className="text-right">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9 + visibleExtraColumnCount} className="text-center py-10 text-gray-400">
                  কোনো শিক্ষার্থী পাওয়া যায়নি।
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
                    <div className="text-xs text-gray-500 mt-1">রোল: {student.roll_number || student.roll_no || "-"}</div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">{student.department || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">{student.branches?.name || "-"}</span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{student.father_mobile}</TableCell>
                  {extraColumns.guardianName && (
                    <TableCell className="text-sm text-gray-700 font-medium">{student.guardian_name || "-"}</TableCell>
                  )}
                  {extraColumns.guardianMobile && (
                    <TableCell className="text-sm text-gray-700">{student.guardian_mobile || "-"}</TableCell>
                  )}
                  {extraColumns.address && (
                    <TableCell className="text-xs text-gray-600 max-w-55">
                      {[student.present_village, student.present_union, student.present_upazila, student.present_district].filter(Boolean).join(", ") || "-"}
                    </TableCell>
                  )}
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
