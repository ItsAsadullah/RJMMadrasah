import { createClient } from '@supabase/supabase-js'

// আমরা .env ফাইল থেকে URL এবং Key ডেকে আনছি
// বিল্ড টাইমে এরর এড়ানোর জন্য ফলব্যাক ভ্যালু ব্যবহার করা হয়েছে
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'example-key'
const supabaseProjectRef = (() => {
  try {
    return new URL(supabaseUrl).hostname.split('.')[0] || ''
  } catch {
    return ''
  }
})()
const legacyAuthStorageKey = 'supabase.auth.token'
const browserAuthStorageKeys = [
  legacyAuthStorageKey,
  ...(supabaseProjectRef ? [`sb-${supabaseProjectRef}-auth-token`] : []),
]

// Supabase কানেকশন তৈরি হচ্ছে
export const supabase = createClient(supabaseUrl, supabaseKey)

const invalidRefreshTokenPattern = /Invalid Refresh Token|Refresh Token Not Found/i

export function clearStoredSupabaseSession() {
  if (typeof window === 'undefined') return

  ;[window.localStorage, window.sessionStorage].forEach((storage) => {
    browserAuthStorageKeys.forEach((key) => storage.removeItem(key))

    if (!supabaseProjectRef) return

    Object.keys(storage).forEach((key) => {
      if (key.startsWith(`sb-${supabaseProjectRef}`) && key.includes('auth-token')) {
        storage.removeItem(key)
      }
    })
  })
}

export async function clearInvalidSupabaseSession(error?: unknown) {
  const message = error instanceof Error ? error.message : String(error || '')
  if (!invalidRefreshTokenPattern.test(message)) return false

  clearStoredSupabaseSession()

  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    // Ignore local cleanup failures, storage has already been cleared.
  }

  return true
}

export async function getSafeSupabaseSession() {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      await clearInvalidSupabaseSession(error)
      return { session: null, error }
    }

    return { session: data.session, error: null }
  } catch (error) {
    await clearInvalidSupabaseSession(error)
    return { session: null, error }
  }
}
