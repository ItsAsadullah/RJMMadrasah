'use server'

import { createClient } from '@/lib/supabase/server' // Adjust your supabase import path
import { revalidatePath } from 'next/cache'

export async function addNotice(formData: FormData) {
  const supabase = await createClient()

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const branch = formData.get('branch') as string
  
  // Handle File Upload (Optional: if you have a file input)
  // let file_url = null
  // const file = formData.get('file') as File
  // if (file && file.size > 0) {
  //    ... upload logic to Supabase Storage ...
  // }

  const { error } = await supabase.from('notices').insert({
    title,
    description,
    branch
  })

  if (error) {
    console.error('Error adding notice:', error)
    return { success: false, message: 'Failed to add notice' }
  }

  revalidatePath('/dashboard/notices')
  return { success: true, message: 'Notice added successfully!' }
}

export async function deleteNotice(id: number) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('notices').delete().eq('id', id)

  if (error) {
    return { success: false }
  }

  revalidatePath('/admin/notices')
  return { success: true }
}