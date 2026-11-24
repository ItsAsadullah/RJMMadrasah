import { ADMIN_USER_ID, isAdminUser } from './adminAccess';

describe('administrator identity', () => {
  it('allows the verified administrator', () => {
    expect(isAdminUser({ id: ADMIN_USER_ID })).toBe(true);
  });
  it('rejects missing sessions and other authenticated accounts', () => {
    expect(isAdminUser(null)).toBe(false);
    expect(isAdminUser(undefined)).toBe(false);
    expect(isAdminUser({ id: 'another-user' })).toBe(false);
  });
  it('does not trust an admin email or editable role metadata', () => {
    const impostor = { id: 'another-user', email: 'admin@madrasah.com', user_metadata: { role: 'admin' } };
    expect(isAdminUser(impostor)).toBe(false);
  });
});
