'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type NoticePayload = {
  title: string
  content: string
  file_url: string
  google_drive_link: string
}

export async function addNotice(payload: NoticePayload) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from('notices').insert({
      title: payload.title,
      content: payload.content || '',
      file_url: payload.file_url || '',
      google_drive_link: payload.google_drive_link || '',
    }).select().single()

    if (error) {
      console.error('Error adding notice:', error)
      return { success: false, message: `নোটিশ তৈরি ব্যর্থ: ${error.message} (Code: ${error.code})` }
    }

    revalidatePath('/dashboard/notices')
    revalidatePath('/notice')
    revalidatePath('/')
    return { success: true, message: 'নোটিশ সফলভাবে প্রকাশিত হয়েছে!', data }
  } catch (err: any) {
    console.error('Unexpected error adding notice:', err)
    return { success: false, message: `অপ্রত্যাশিত ত্রুটি: ${err?.message || 'Unknown error'}` }
  }
}

export async function updateNotice(id: string, payload: NoticePayload) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('notices')
      .update({
        title: payload.title,
        content: payload.content || '',
        file_url: payload.file_url || '',
        google_drive_link: payload.google_drive_link || '',
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating notice:', error)
      return { success: false, message: `নোটিশ আপডেট ব্যর্থ: ${error.message} (Code: ${error.code})` }
    }

    revalidatePath('/dashboard/notices')
    revalidatePath('/notice')
    revalidatePath('/')
    return { success: true, message: 'নোটিশ সফলভাবে আপডেট হয়েছে!' }
  } catch (err: any) {
    console.error('Unexpected error updating notice:', err)
    return { success: false, message: `অপ্রত্যাশিত ত্রুটি: ${err?.message || 'Unknown error'}` }
  }
}

export async function deleteNotice(id: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('notices').delete().eq('id', id)

    if (error) {
      console.error('Error deleting notice:', error)
      return { success: false, message: `নোটিশ ডিলিট ব্যর্থ: ${error.message}` }
    }

    revalidatePath('/dashboard/notices')
    revalidatePath('/notice')
    revalidatePath('/')
    return { success: true, message: 'নোটিশ সফলভাবে ডিলিট হয়েছে!' }
  } catch (err: any) {
    console.error('Unexpected error deleting notice:', err)
    return { success: false, message: `অপ্রত্যাশিত ত্রুটি: ${err?.message || 'Unknown error'}` }
  }
}