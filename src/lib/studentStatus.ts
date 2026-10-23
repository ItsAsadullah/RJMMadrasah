export const STUDENT_STATUSES = [
  { value: "active", label: "সক্রিয়", className: "bg-green-100 text-green-700" },
  { value: "inactive", label: "নিষ্ক্রিয়", className: "bg-slate-100 text-slate-700" },
  { value: "pending", label: "অপেক্ষমাণ", className: "bg-yellow-100 text-yellow-700" },
] as const;

export type StudentStatus = (typeof STUDENT_STATUSES)[number]["value"];

export function getStudentStatus(status: string) {
  // Keep legacy records visible after retiring the rejected option.
  if (status === "rejected") return STUDENT_STATUSES[1];
  return STUDENT_STATUSES.find((option) => option.value === status) ?? {
    value: status,
    label: status || "অজানা",
    className: "bg-slate-100 text-slate-700",
  };
}
