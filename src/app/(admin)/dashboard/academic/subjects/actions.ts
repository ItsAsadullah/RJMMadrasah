'use server';

import { createClient } from "@/lib/supabase/server";

export async function removeAcademicSubject(subjectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_remove_academic_subject", { subject_id: subjectId });
  if (error) {
    return {
      success: false as const,
      error: {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    };
  }
  return { success: true as const };
}
