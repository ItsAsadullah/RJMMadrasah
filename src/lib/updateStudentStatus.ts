import type { SupabaseClient } from "@supabase/supabase-js";
import { STUDENT_STATUSES, type StudentStatus } from "./studentStatus";

export async function updateStudentStatus(db: SupabaseClient, ids: string[], status: StudentStatus) {
  if (!STUDENT_STATUSES.some(option => option.value === status)) throw new Error("Invalid student status");
  const uniqueIds = [...new Set(ids)];
  if (!uniqueIds.length) return { updated: [], complete: true };

  const { data, error } = await db.from("students")
    .update({ status })
    .in("id", uniqueIds)
    .select("id, status");
  if (error) throw error;

  // RLS may return no rows or only some rows without reporting an error.
  const updated = (data ?? []).filter(row => uniqueIds.includes(row.id) && row.status === status);
  return { updated, complete: new Set(updated.map(row => row.id)).size === uniqueIds.length };
}
