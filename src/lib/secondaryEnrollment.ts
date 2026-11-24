/**
 * Helpers for dual/secondary class & department enrollment AND bulk class assignment
 * with automatic serial roll numbering and zero-migration hybrid persistence.
 */

export const SECONDARY_ENROLLMENTS_SECTION_KEY = "system_secondary_enrollments";

export type SecondaryEnrollmentEntry = {
  secondary_department: string | null;
  secondary_class_name: string | null;
  secondary_roll_number: string | null;
};

type SecondaryEnrollmentStore = {
  by_id?: Record<string, SecondaryEnrollmentEntry>;
  by_student_id?: Record<string, SecondaryEnrollmentEntry>;
};

const DIGIT_MAP: Record<string, string> = {
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

export function toAsciiDigits(value?: string | number | null): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[০-৯٠-٩]/g, (d) => DIGIT_MAP[d] ?? d);
}

export function parseRollNumber(roll?: string | number | null): number {
  const ascii = toAsciiDigits(roll).replace(/[^0-9]/g, "");
  if (!ascii) return 0;
  const parsed = parseInt(ascii, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

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
 * Computes existing student count and maximum roll number in a target class
 * (considering BOTH primary students and dual-enrolled secondary students in that class).
 */
export function getTargetClassRollStats(
  allStudents: any[] | null | undefined,
  target: TargetAcademicClass & {
    branch_id?: string | number | null;
    academic_year?: string | number | null;
  },
  excludeStudentIds: Set<string> = new Set()
): { existingCount: number; maxRoll: number; nextRoll: number } {
  if (!allStudents?.length || !normalizeAcademicText(target.name)) {
    return { existingCount: 0, maxRoll: 0, nextRoll: 1 };
  }

  const candidates = allStudents.filter((s) => {
    if (!s || excludeStudentIds.has(String(s.id))) return false;
    if (target.branch_id && String(s.branch_id || "") !== String(target.branch_id)) return false;
    if (
      target.academic_year &&
      s.academic_year &&
      String(s.academic_year) !== String(target.academic_year)
    ) {
      return false;
    }
    return true;
  });

  const resolved = filterAndResolveStudentsForClass(candidates, target);
  const maxRoll = resolved.reduce((max, s) => {
    const r = parseRollNumber(s.roll_number ?? s.roll_no);
    return r > max ? r : max;
  }, 0);

  return {
    existingCount: resolved.length,
    maxRoll,
    nextRoll: maxRoll + 1,
  };
}

/**
 * Sorts selected students by their current roll number ascending (unrolled last, then by student_id/name)
 * and assigns sequential roll numbers starting at `startRoll`.
 */
export function assignSequentialRolls<
  T extends {
    id: string;
    roll_number?: string | number | null;
    roll_no?: string | number | null;
    student_id?: string | null;
    name_bn?: string | null;
  }
>(selectedStudents: T[], startRoll: number): Array<{ student: T; assignedRoll: string }> {
  const safeStart = Math.max(1, Math.floor(startRoll || 1));
  const sorted = [...selectedStudents].sort((a, b) => {
    const rA = parseRollNumber(a.roll_number ?? a.roll_no);
    const rB = parseRollNumber(b.roll_number ?? b.roll_no);
    if (rA > 0 && rB > 0 && rA !== rB) return rA - rB;
    if (rA > 0 && rB === 0) return -1;
    if (rA === 0 && rB > 0) return 1;
    const idCmp = String(a.student_id || "").localeCompare(String(b.student_id || ""), undefined, {
      numeric: true,
    });
    if (idCmp !== 0) return idCmp;
    return String(a.name_bn || "").localeCompare(String(b.name_bn || ""), "bn");
  });

  return sorted.map((student, idx) => ({
    student,
    assignedRoll: String(safeStart + idx),
  }));
}

const VIRTUAL_AND_SECONDARY_KEYS = new Set([
  "secondary_department",
  "secondary_class_name",
  "secondary_roll_number",
  "enrollment_role",
  "is_secondary_enrollment",
  "origin_badge",
  "secondary_badge",
  "primary_department",
  "primary_class_name",
  "primary_roll_number",
  "branches",
]);

/**
 * Strips secondary_* and virtual UI fields from a student payload so `students.insert` / `students.update`
 * never fails even when the `students` table does not have `secondary_*` columns.
 */
export function stripSecondaryAndVirtualFields<T extends Record<string, any>>(
  payload: T
): Omit<T, "secondary_department" | "secondary_class_name" | "secondary_roll_number"> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(payload || {})) {
    if (!VIRTUAL_AND_SECONDARY_KEYS.has(key)) {
      cleaned[key] = val;
    }
  }
  return cleaned as any;
}

export function normalizeSecondaryEntry(values: {
  secondary_department?: string | null;
  secondary_class_name?: string | null;
  secondary_roll_number?: string | null;
}): SecondaryEnrollmentEntry {
  const hasCls = Boolean(normalizeAcademicText(values.secondary_class_name));
  if (!hasCls) {
    return {
      secondary_department: null,
      secondary_class_name: null,
      secondary_roll_number: null,
    };
  }
  const cleanRoll = toAsciiDigits(values.secondary_roll_number).trim() || null;
  return {
    secondary_department: values.secondary_department || null,
    secondary_class_name: values.secondary_class_name || null,
    secondary_roll_number: cleanRoll,
  };
}

/**
 * Partitions selected students into:
 * - `alreadyEnrolled`: students who are ALREADY in the target class (primary or secondary depending on mode)
 * - `eligible`: remaining students who should be added/migrated to the target class
 */
export function partitionStudentsForTargetClass<T extends Record<string, any>>(
  selectedStudents: T[],
  target: TargetAcademicClass & {
    branch_id?: string | number | null;
    academic_year?: string | number | null;
  },
  mode: "secondary" | "primary"
): {
  alreadyEnrolled: Array<{ student: T; existingRoll: string; matchType: "primary" | "secondary" }>;
  eligible: T[];
} {
  const targetName = normalizeAcademicText(target.name);
  if (!targetName) {
    return { alreadyEnrolled: [], eligible: selectedStudents };
  }

  const alreadyEnrolled: Array<{
    student: T;
    existingRoll: string;
    matchType: "primary" | "secondary";
  }> = [];
  const eligible: T[] = [];

  for (const student of selectedStudents) {
    const sameBranch =
      !target.branch_id || String(student?.branch_id || "") === String(target.branch_id);
    const sameYear =
      !target.academic_year ||
      !student?.academic_year ||
      String(student.academic_year) === String(target.academic_year);

    const match = sameBranch && sameYear ? matchesAcademicClass(student, target) : null;

    if (mode === "secondary" && (match === "primary" || match === "secondary")) {
      const existingRoll =
        match === "secondary"
          ? String(student?.secondary_roll_number || "")
          : String((student?.roll_number ?? student?.roll_no) || "");
      alreadyEnrolled.push({ student, existingRoll, matchType: match });
    } else if (mode === "primary" && match === "primary") {
      const existingRoll = String((student?.roll_number ?? student?.roll_no) || "");
      alreadyEnrolled.push({ student, existingRoll, matchType: "primary" });
    } else {
      eligible.push(student);
    }
  }

  return { alreadyEnrolled, eligible };
}

export async function fetchSecondaryEnrollmentStore(
  supabaseClient: any
): Promise<SecondaryEnrollmentStore> {
  try {
    const { data, error } = await supabaseClient
      .from("home_sections")
      .select("id, additional_data")
      .like("section_key", `${SECONDARY_ENROLLMENTS_SECTION_KEY}%`)
      .order("id", { ascending: false })
      .limit(1);

    const latest = Array.isArray(data) ? data[0] : data;
    if (error || !latest?.additional_data || typeof latest.additional_data !== "object") {
      return {};
    }
    return latest.additional_data as SecondaryEnrollmentStore;
  } catch {
    return {};
  }
}

/**
 * Hydrates student records in memory with secondary enrollment data from `home_sections`
 * whenever native `students.secondary_*` columns are not present or empty.
 */
export async function attachSecondaryEnrollments<T extends Record<string, any>>(
  supabaseClient: any,
  students: T[] | null | undefined
): Promise<T[]> {
  if (!students?.length) return [];
  const store = await fetchSecondaryEnrollmentStore(supabaseClient);
  const byId = store.by_id || {};
  const byStudentId = store.by_student_id || {};

  if (!Object.keys(byId).length && !Object.keys(byStudentId).length) {
    return students;
  }

  return students.map((student) => {
    if (normalizeAcademicText(student?.secondary_class_name)) {
      return student;
    }
    const mapped =
      (student?.id ? byId[String(student.id)] : undefined) ??
      (student?.student_id ? byStudentId[String(student.student_id)] : undefined);

    if (!mapped || !normalizeAcademicText(mapped.secondary_class_name)) {
      return student;
    }

    return {
      ...student,
      secondary_department: mapped.secondary_department,
      secondary_class_name: mapped.secondary_class_name,
      secondary_roll_number: mapped.secondary_roll_number,
    };
  });
}

/**
 * Saves secondary enrollment(s) reliably WITHOUT requiring manual SQL column migrations:
 * 1) Persists into `home_sections` (`section_key = 'system_secondary_enrollments'`, `is_active = false`).
 * 2) Best-effort syncs `students.secondary_*` columns if those columns exist in the DB.
 */
export async function saveSecondaryEnrollmentsHybrid(
  supabaseClient: any,
  items: Array<{
    id: string;
    student_id?: string | null;
    secondary_department?: string | null;
    secondary_class_name?: string | null;
    secondary_roll_number?: string | null;
  }>
): Promise<void> {
  if (!items.length) return;

  // Fetch all existing snapshot rows (latest first).
  // IMPORTANT: Live `home_sections` has a `BEFORE UPDATE` trigger referencing `NEW.updated_at`
  // while the live table lacks an `updated_at` column. Therefore we NEVER call `.update()`
  // on `home_sections` — we INSERT a new snapshot row first, then best-effort DELETE older rows.
  const { data: existingRows, error: fetchError } = await supabaseClient
    .from("home_sections")
    .select("id, section_key, additional_data")
    .like("section_key", `${SECONDARY_ENROLLMENTS_SECTION_KEY}%`)
    .order("id", { ascending: false });

  if (fetchError) {
    throw fetchError;
  }

  const latestRow = Array.isArray(existingRows) && existingRows.length > 0 ? existingRows[0] : null;
  const prevData: SecondaryEnrollmentStore =
    latestRow?.additional_data && typeof latestRow.additional_data === "object"
      ? latestRow.additional_data
      : {};

  const nextById: Record<string, SecondaryEnrollmentEntry> = { ...(prevData.by_id || {}) };
  const nextByStudentId: Record<string, SecondaryEnrollmentEntry> = {
    ...(prevData.by_student_id || {}),
  };

  for (const item of items) {
    if (!item.id) continue;
    const entry = normalizeSecondaryEntry(item);
    if (entry.secondary_class_name) {
      nextById[String(item.id)] = entry;
      if (item.student_id) {
        nextByStudentId[String(item.student_id)] = entry;
      }
    } else {
      delete nextById[String(item.id)];
      if (item.student_id) {
        delete nextByStudentId[String(item.student_id)];
      }
    }
  }

  const nextAdditionalData: SecondaryEnrollmentStore = {
    by_id: nextById,
    by_student_id: nextByStudentId,
  };

  const uniqueSnapshotKey = `${SECONDARY_ENROLLMENTS_SECTION_KEY}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 6)}`;

  const { error: insertErr } = await supabaseClient.from("home_sections").insert([
    {
      section_key: uniqueSnapshotKey,
      title: "System Secondary Enrollments",
      subtitle: "",
      content: "",
      image_url: "",
      additional_data: nextAdditionalData,
      is_active: false,
    },
  ]);
  if (insertErr) throw insertErr;

  // Best-effort cleanup of older snapshot rows so the table stays clean
  if (Array.isArray(existingRows) && existingRows.length > 0) {
    const oldIds = existingRows.map((r: any) => r.id).filter(Boolean);
    if (oldIds.length > 0) {
      try {
        await supabaseClient.from("home_sections").delete().in("id", oldIds);
      } catch {
        // Ignore if DELETE policy is restricted; readers always select highest `id`
      }
    }
  }

  // Best-effort sync to native `students` columns if the SQL migration has been applied
  try {
    const first = items[0];
    const firstEntry = normalizeSecondaryEntry(first);
    const { error: probeErr } = await supabaseClient
      .from("students")
      .update(firstEntry)
      .eq("id", first.id);

    if (!probeErr && items.length > 1) {
      await Promise.all(
        items.slice(1).map((item) =>
          supabaseClient
            .from("students")
            .update(normalizeSecondaryEntry(item))
            .eq("id", item.id)
        )
      );
    }
  } catch {
    // Ignore if native columns are not yet present in `students`
  }
}
