/**
 * Helpers for dual/secondary class & department enrollment
 * (e.g. হিফজুল কুরআন বিভাগের শিক্ষার্থীদের কিতাব বিভাগের নির্দিষ্ট শ্রেণির তালিকা ও পরীক্ষায় যুক্ত করা,
 *  হাজিরা ও ফি মূল বিভাগে অপরিবর্তিত রেখে)।
 */

export function normalizeAcademicText(value?: string | null): string {
  if (!value) return "";
  return String(value)
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .normalize("NFC")
    .replace(/\u09AF\u09BC/g, "\u09DF") // য + ় → য়
    .replace(/\s+/g, " ")
    .trim();
}

export function isHifzDepartment(department?: string | null): boolean {
  const norm = normalizeAcademicText(department).toLowerCase();
  return norm.includes("হিফজ") || norm.includes("হেফজ") || norm.includes("hifz");
}

function getDepartmentFamily(normDept: string): "noorani" | "hifz" | "kitab" | null {
  if (!normDept) return null;
  if (normDept.includes("হিফজ") || normDept.includes("হেফজ") || normDept.includes("hifz")) return "hifz";
  if (normDept.includes("কিতাব") || normDept.includes("kitab")) return "kitab";
  if (normDept.includes("নূরানী") || normDept.includes("নুরানী") || normDept.includes("মক্তব")) return "noorani";
  return null;
}

export function departmentsMatch(deptA?: string | null, deptB?: string | null): boolean {
  const a = normalizeAcademicText(deptA).toLowerCase();
  const b = normalizeAcademicText(deptB).toLowerCase();
  if (!a || !b) return true;
  if (a === b) return true;
  const famA = getDepartmentFamily(a);
  const famB = getDepartmentFamily(b);
  return famA !== null && famA === famB;
}

export function hasSecondaryEnrollment(student: any): boolean {
  return Boolean(normalizeAcademicText(student?.secondary_class_name));
}

export function formatOriginDepartmentBadge(student: any): string {
  const dept = normalizeAcademicText(student?.department);
  const cls = normalizeAcademicText(student?.class_name);
  if (isHifzDepartment(dept)) {
    return cls ? `হিফজখানা (${cls})` : "হিফজখানা";
  }
  if (dept && cls) return `${dept} (${cls})`;
  return dept || cls || "মূল বিভাগ";
}

export function formatSecondaryEnrollmentBadge(student: any): string | null {
  if (!hasSecondaryEnrollment(student)) return null;
  const secDept = normalizeAcademicText(student?.secondary_department);
  const secCls = normalizeAcademicText(student?.secondary_class_name);
  const secRoll = normalizeAcademicText(student?.secondary_roll_number);
  const prefix = secDept ? `${secDept}: ${secCls}` : secCls;
  return secRoll ? `${prefix} (রোল: ${secRoll})` : prefix;
}

export type TargetAcademicClass = {
  name?: string | null;
  department?: string | null;
  departments?: { name?: string | null } | null;
};

export function matchesAcademicClass(
  student: any,
  targetClass: TargetAcademicClass
): "primary" | "secondary" | null {
  const targetName = normalizeAcademicText(targetClass?.name);
  if (!targetName) return null;

  const targetDept = normalizeAcademicText(
    targetClass?.departments?.name ?? targetClass?.department
  );

  if (
    normalizeAcademicText(student?.class_name) === targetName &&
    departmentsMatch(student?.department, targetDept)
  ) {
    return "primary";
  }

  if (
    hasSecondaryEnrollment(student) &&
    normalizeAcademicText(student?.secondary_class_name) === targetName &&
    departmentsMatch(student?.secondary_department, targetDept)
  ) {
    return "secondary";
  }

  return null;
}

export function resolveStudentForClass<T extends Record<string, any>>(
  student: T,
  targetClass: TargetAcademicClass
) {
  const role = matchesAcademicClass(student, targetClass);
  if (!role) return null;

  if (role === "primary") {
    return {
      ...student,
      primary_department: student.department,
      primary_class_name: student.class_name,
      primary_roll_number: student.roll_number ?? student.roll_no ?? "",
      enrollment_role: "primary" as const,
      is_secondary_enrollment: false,
      origin_badge: null as string | null,
      secondary_badge: formatSecondaryEnrollmentBadge(student),
    };
  }

  return {
    ...student,
    primary_department: student.department,
    primary_class_name: student.class_name,
    primary_roll_number: student.roll_number ?? student.roll_no ?? "",
    roll_number: student.secondary_roll_number || "",
    roll_no: student.secondary_roll_number || "",
    enrollment_role: "secondary" as const,
    is_secondary_enrollment: true,
    origin_badge: formatOriginDepartmentBadge(student),
    secondary_badge: null as string | null,
  };
}

export function filterAndResolveStudentsForClass<T extends Record<string, any>>(
  students: T[] | null | undefined,
  targetClass: TargetAcademicClass
) {
  if (!students?.length) return [];
  return students
    .map((s) => resolveStudentForClass(s, targetClass))
    .filter((s): s is NonNullable<typeof s> => s !== null);
}

/**
 * Prepares secondary_* fields on a student insert/update payload safely.
 * If the existing record does not yet have secondary_* columns in the DB and
 * no secondary enrollment is set, omits those keys so normal saves never break
 * before the migration is applied.
 */
export function buildSecondaryEnrollmentFields(
  formValues: {
    secondary_department?: string | null;
    secondary_class_name?: string | null;
    secondary_roll_number?: string | null;
  },
  existingRecord?: Record<string, any> | null
): Record<string, string | null> {
  const secDept = normalizeAcademicText(formValues.secondary_department) ? String(formValues.secondary_department).trim() : null;
  const secClass = normalizeAcademicText(formValues.secondary_class_name) ? String(formValues.secondary_class_name) : null;
  const secRoll = normalizeAcademicText(formValues.secondary_roll_number) ? String(formValues.secondary_roll_number).trim() : null;

  // Keep raw DB value for secondary_department & secondary_class_name when selected from dropdown
  // (in case DB department/class has leading/trailing whitespace like "\tকিতাব" or "চতুর্থ ")
  const rawDept = secClass && formValues.secondary_department ? formValues.secondary_department : null;
  const rawClass = secClass ? formValues.secondary_class_name! : null;
  const rawRoll = secClass ? secRoll : null;

  const dbHasSecondaryCols =
    existingRecord != null &&
    ("secondary_class_name" in existingRecord || "secondary_department" in existingRecord);

  if (!rawClass && !rawDept && !dbHasSecondaryCols) {
    return {};
  }

  return {
    secondary_department: rawDept,
    secondary_class_name: rawClass,
    secondary_roll_number: rawRoll,
  };
}

export function formatSecondaryEnrollmentDbError(error: any): string {
  const msg = String(error?.message || error || "");
  if (
    msg.includes("secondary_class_name") ||
    msg.includes("secondary_department") ||
    msg.includes("secondary_roll_number")
  ) {
    return "ডাটাবেসে অতিরিক্ত বিভাগের কলাম এখনো যুক্ত করা হয়নি। অনুগ্রহ করে Supabase SQL Editor-এ supabase/migrations/20261124_add_secondary_enrollment_to_students.sql ফাইলটি রান করুন।";
  }
  return msg;
}
