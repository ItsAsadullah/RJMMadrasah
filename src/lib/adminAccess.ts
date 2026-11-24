// Existing administrator verified in Supabase Auth and confirmed by the owner.
// Match the immutable Auth ID, never editable user_metadata or an email alone.
export const ADMIN_USER_ID = '85bec2fc-13df-4b53-84a3-9e15d14da142';

export function isAdminUser(user: { id: string } | null | undefined): boolean {
  return user?.id === ADMIN_USER_ID;
}
